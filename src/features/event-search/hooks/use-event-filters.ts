import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { EventFilters } from '@/shared/api/types'

import {
  countActiveFilters,
  DEFAULT_FILTERS,
  filtersKey,
  isDefaultFilters,
  parseFilters,
  serialiseFilters,
} from '../search-params'

export interface UseEventFiltersResult {
  filters: EventFilters
  /** Stable string identity for query keys and memo dependencies. */
  key: string
  activeCount: number
  isDefault: boolean
  /** Merge a partial change; pagination resets because the query key changes. */
  setFilters: (patch: Partial<EventFilters>) => void
  clearAll: () => void
}

/**
 * The one and only owner of filter state (PRD 8.3).
 * Filter state lives in the URL — never in Context, Redux or a store.
 */
export function useEventFilters(): UseEventFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams()

  // `searchParams.toString()` keeps the memo stable across identical URLs.
  const searchString = searchParams.toString()
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchString)), [searchString])

  /*
   * The last URL this hook navigated to. Radix Tabs fires `onValueChange` on
   * both focus and click, so two identical commits can run in one event loop
   * turn — both reading the same pre-update `filters`. Without this ref each
   * would push its own history entry and one Back press would appear to do
   * nothing.
   */
  const lastTarget = useRef(searchString)
  useEffect(() => {
    lastTarget.current = searchString
  }, [searchString])

  /** Commits a filter change; pushes so Back/Forward stay meaningful (PRD 5.3). */
  const commit = useCallback(
    (next: EventFilters) => {
      const canonical = serialiseFilters(next).toString()

      if (canonical === lastTarget.current) {
        // Semantically unchanged. Still normalise the address bar if it carries
        // unknown or non-canonical parameters, without adding history depth.
        if (canonical !== searchString) {
          setSearchParams(new URLSearchParams(canonical), { replace: true })
        }
        return
      }

      lastTarget.current = canonical
      setSearchParams(new URLSearchParams(canonical), { replace: false })
    },
    [searchString, setSearchParams]
  )

  const setFilters = useCallback(
    (patch: Partial<EventFilters>) => commit({ ...filters, ...patch }),
    [commit, filters]
  )

  const clearAll = useCallback(() => commit(DEFAULT_FILTERS), [commit])

  return {
    filters,
    key: useMemo(() => filtersKey(filters), [filters]),
    activeCount: useMemo(() => countActiveFilters(filters), [filters]),
    isDefault: useMemo(() => isDefaultFilters(filters), [filters]),
    setFilters,
    clearAll,
  }
}
