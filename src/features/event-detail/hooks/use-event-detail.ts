import { useQuery } from '@tanstack/react-query'

import { getEvent } from '@/shared/api/catalog-api'
import { catalogKeys } from '@/shared/api/query-keys'
import { isNotFound } from '@/shared/api/errors'
import { shouldRetry } from '@/app/query-client'

/** PRD 8.6 / FR-DETAIL-008: reuse briefly, and never retry a 404. */
export function useEventDetail(eventId: string | undefined) {
  return useQuery({
    queryKey: catalogKeys.event(eventId ?? ''),
    queryFn: ({ signal }) => getEvent(eventId as string, signal),
    enabled: Boolean(eventId),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isNotFound(error)) return false
      return shouldRetry(failureCount, error)
    },
  })
}
