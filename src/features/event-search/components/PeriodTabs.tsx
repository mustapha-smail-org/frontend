import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { EventPeriod } from '@/shared/api/types'
import { PERIOD_OPTIONS } from '@/shared/formatters/labels'

interface PeriodTabsProps {
  value: EventPeriod
  onChange: (value: EventPeriod) => void
}

/** PRD FR-FILTER-001: single-select period control. */
export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as EventPeriod)}>
      <TabsList aria-label="Time period" className="w-full sm:w-auto">
        {PERIOD_OPTIONS.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            // Both spans are decorative: the abbreviated mobile label must never
            // become part of the accessible name.
            aria-label={option.label}
            className="min-h-9 px-3"
          >
            <span aria-hidden="true" className="hidden sm:inline">
              {option.label}
            </span>
            <span aria-hidden="true" className="sm:hidden">
              {option.short}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
