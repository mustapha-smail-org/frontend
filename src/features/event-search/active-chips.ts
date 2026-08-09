import type { EventFilters } from '@/shared/api/types'
import { arrondissementLabel, periodLabel, pricingFilterLabel } from '@/shared/formatters/labels'

import { DEFAULT_FILTERS } from './search-params'

export interface ActiveFilterChip {
  id: 'period' | 'category' | 'pricing' | 'arrondissement' | 'query'
  label: string
  /** The filter patch applied when the chip's remove button is pressed. */
  patch: Partial<EventFilters>
}

/**
 * PRD FR-FILTER-006: one chip per active non-default filter, each removing only
 * its own filter.
 */
export function buildActiveChips(filters: EventFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  if (filters.period !== DEFAULT_FILTERS.period) {
    chips.push({
      id: 'period',
      label: periodLabel(filters.period),
      patch: { period: DEFAULT_FILTERS.period },
    })
  }
  if (filters.category) {
    chips.push({ id: 'category', label: filters.category, patch: { category: null } })
  }
  if (filters.pricing !== DEFAULT_FILTERS.pricing) {
    chips.push({
      id: 'pricing',
      label: pricingFilterLabel(filters.pricing),
      patch: { pricing: DEFAULT_FILTERS.pricing },
    })
  }
  if (filters.arrondissement) {
    chips.push({
      id: 'arrondissement',
      label: arrondissementLabel(filters.arrondissement),
      patch: { arrondissement: null },
    })
  }
  if (filters.query.trim() !== '') {
    chips.push({ id: 'query', label: `“${filters.query.trim()}”`, patch: { query: '' } })
  }

  return chips
}
