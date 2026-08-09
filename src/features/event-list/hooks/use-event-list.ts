import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { searchEvents } from '@/shared/api/catalog-api'
import { isInvalidCursor } from '@/shared/api/errors'
import { catalogKeys } from '@/shared/api/query-keys'
import type { EventFilters, EventSummary } from '@/shared/api/types'
import { reportContractViolation } from '@/shared/observability/reporter'

import { dedupeById } from '../dedupe'

export interface UseEventListResult {
  events: EventSummary[]
  isInitialLoading: boolean
  /** A committed filter change is refetching while old cards stay on screen. */
  isRefreshing: boolean
  isError: boolean
  error: unknown
  hasNextPage: boolean
  isFetchingNextPage: boolean
  nextPageError: unknown
  loadMore: () => void
  retry: () => void
}

/**
 * Cursor-paginated event list (PRD FR-LIST-001, FR-LIST-004, FR-LIST-005).
 *
 * The cursor never enters the URL and is never decoded; it is carried purely as
 * an infinite-query page param.
 */
export function useEventList(filters: EventFilters): UseEventListResult {
  const queryClient = useQueryClient()
  const queryKey = catalogKeys.events(filters)

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => searchEvents(filters, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : null),
    staleTime: 60_000,
  })

  const events = useMemo(
    () => dedupeById((query.data?.pages ?? []).flatMap((page) => page.items)),
    [query.data]
  )

  /*
   * PRD section 12: a 400 INVALID_CURSOR while appending must discard pagination
   * state and refetch page one exactly once. `recoveredRef` prevents a loop.
   */
  const recoveredRef = useRef(false)
  const invalidCursor = isInvalidCursor(query.error)

  useEffect(() => {
    recoveredRef.current = false
  }, [queryKey.join('|')])

  useEffect(() => {
    if (!invalidCursor || recoveredRef.current) return
    recoveredRef.current = true
    reportContractViolation('Cursor rejected while appending; restarting from the first page')
    queryClient.removeQueries({ queryKey })
    void queryClient.refetchQueries({ queryKey })
  }, [invalidCursor, queryClient, queryKey])

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage()
    }
  }, [query])

  const retry = useCallback(() => {
    void query.refetch()
  }, [query])

  const hasLoadedPages = (query.data?.pages.length ?? 0) > 0
  // A failure while appending must keep existing cards on screen.
  const nextPageError = hasLoadedPages && query.isError ? query.error : null

  return {
    events,
    isInitialLoading: query.isPending,
    isRefreshing: query.isFetching && !query.isFetchingNextPage && hasLoadedPages,
    isError: query.isError && !hasLoadedPages,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    nextPageError,
    loadMore,
    retry,
  }
}
