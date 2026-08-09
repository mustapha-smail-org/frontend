import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { searchMapEvents } from '@/shared/api/catalog-api'
import { catalogKeys } from '@/shared/api/query-keys'
import type { EventFilters, EventMapMarker } from '@/shared/api/types'

import { dedupeById } from '@/features/event-list/dedupe'

export interface UseMapEventsResult {
  markers: EventMapMarker[]
  isInitialLoading: boolean
  isError: boolean
  error: unknown
  hasMore: boolean
  isLoadingMore: boolean
  nextPageError: unknown
  loadMore: () => void
  retry: () => void
}

/**
 * Progressive marker pagination (PRD FR-MAP-002).
 *
 * Deliberately NOT auto-advancing: `fetchNextPage` only ever runs from an
 * explicit user action, so the app never crawls every map page in the
 * background. A filter change produces a new query key, which clears the
 * accumulated markers and restarts at page one.
 */
export function useMapEvents(filters: EventFilters, enabled: boolean): UseMapEventsResult {
  const query = useInfiniteQuery({
    queryKey: catalogKeys.mapEvents(filters),
    queryFn: ({ pageParam, signal }) => searchMapEvents(filters, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : null),
    staleTime: 60_000,
    enabled,
  })

  const markers = useMemo(
    () => dedupeById((query.data?.pages ?? []).flatMap((page) => page.items)),
    [query.data]
  )

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage()
    }
  }, [query])

  const hasLoadedPages = (query.data?.pages.length ?? 0) > 0

  return {
    markers,
    isInitialLoading: query.isPending && enabled,
    isError: query.isError && !hasLoadedPages,
    error: query.error,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    // A failed marker page must preserve the markers already on the map.
    nextPageError: hasLoadedPages && query.isError ? query.error : null,
    loadMore,
    retry: useCallback(() => {
      void query.refetch()
    }, [query]),
  }
}
