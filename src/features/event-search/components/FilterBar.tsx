import { useCallback } from 'react'

import type { EventFilters } from '@/shared/api/types'

import { ActiveFilterChips } from './ActiveFilterChips'
import { ArrondissementSelect } from './ArrondissementSelect'
import { CategorySelect } from './CategorySelect'
import { MobileFilterSheet } from './MobileFilterSheet'
import { PeriodTabs } from './PeriodTabs'
import { PricingSelect } from './PricingSelect'
import { SearchInput } from './SearchInput'

interface FilterBarProps {
  filters: EventFilters
  onChange: (patch: Partial<EventFilters>) => void
  onClearAll: () => void
  isDesktop: boolean
}

/**
 * One filter bar drives both datasets (PRD FR-SYNC-001). Secondary selects are
 * inline on desktop and collapse into a bottom sheet on small screens.
 */
export function FilterBar({ filters, onChange, onClearAll, isDesktop }: FilterBarProps) {
  const onQueryCommit = useCallback((query: string) => onChange({ query }), [onChange])
  // The sheet trigger badge counts only the filters the sheet actually owns.
  const secondaryCount =
    (filters.category ? 1 : 0) +
    (filters.pricing !== 'ALL' ? 1 : 0) +
    (filters.arrondissement ? 1 : 0)

  return (
    <section aria-label="Search and filters" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={filters.query} onCommit={onQueryCommit} className="min-w-0 flex-1" />
        {!isDesktop ? (
          <MobileFilterSheet
            filters={filters}
            onChange={onChange}
            onClearAll={onClearAll}
            activeCount={secondaryCount}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PeriodTabs value={filters.period} onChange={(period) => onChange({ period })} />

        {isDesktop ? (
          <div className="flex flex-wrap items-center gap-2">
            <CategorySelect
              value={filters.category}
              onChange={(category) => onChange({ category })}
              className="h-10 w-[11.5rem]"
            />
            <PricingSelect
              value={filters.pricing}
              onChange={(pricing) => onChange({ pricing })}
              className="h-10 w-[10.5rem]"
            />
            <ArrondissementSelect
              value={filters.arrondissement}
              onChange={(arrondissement) => onChange({ arrondissement })}
              className="h-10 w-[12rem]"
            />
          </div>
        ) : null}
      </div>

      <ActiveFilterChips filters={filters} onChange={onChange} onClearAll={onClearAll} />
    </section>
  )
}
