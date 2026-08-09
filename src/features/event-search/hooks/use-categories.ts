import { useQuery } from '@tanstack/react-query'

import { getCategories } from '@/shared/api/catalog-api'
import { catalogKeys } from '@/shared/api/query-keys'

/** PRD FR-FILTER-002: categories rarely change, so they are cached for a day. */
export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: ({ signal }) => getCategories(signal),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}
