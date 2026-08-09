import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { EventFilters } from '@/shared/api/types'

import { buildActiveChips } from '../active-chips'

interface ActiveFilterChipsProps {
  filters: EventFilters
  onChange: (patch: Partial<EventFilters>) => void
  onClearAll: () => void
}

/**
 * PRD FR-FILTER-006. Removing one chip changes only that filter; "Clear all"
 * appears once at least two non-default filters are active.
 */
export function ActiveFilterChips({ filters, onChange, onClearAll }: ActiveFilterChipsProps) {
  const chips = buildActiveChips(filters)

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid="active-filter-chips">
      <h2 className="sr-only">Active filters</h2>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onChange(chip.patch)}
          className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="max-w-[14rem] truncate">{chip.label}</span>
          <X aria-hidden="true" className="text-muted-foreground size-3.5" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}

      {chips.length >= 2 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs"
        >
          Clear all
        </Button>
      ) : null}
    </div>
  )
}
