import { SearchX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { EventFilters } from '@/shared/api/types'
import { arrondissementLabel, periodLabel, pricingFilterLabel } from '@/shared/formatters/labels'

import { DEFAULT_FILTERS } from '@/features/event-search/search-params'

interface EmptyResultsProps {
  filters: EventFilters
  onChange: (patch: Partial<EventFilters>) => void
  onClearAll: () => void
}

/**
 * PRD FR-LIST-006. This is an outcome, not an error: it states what was searched
 * and offers only the loosening actions that are actually applicable.
 */
export function EmptyResults({ filters, onChange, onClearAll }: EmptyResultsProps) {
  const activeDescriptions: string[] = [periodLabel(filters.period).toLowerCase()]
  if (filters.category) activeDescriptions.push(filters.category)
  if (filters.pricing !== 'ALL')
    activeDescriptions.push(pricingFilterLabel(filters.pricing).toLowerCase())
  if (filters.arrondissement) activeDescriptions.push(arrondissementLabel(filters.arrondissement))

  const actions: Array<{ label: string; patch: Partial<EventFilters> }> = []
  if (filters.query.trim() !== '') {
    actions.push({ label: 'Clear the search text', patch: { query: '' } })
  }
  if (filters.period !== 'THIS_MONTH') {
    actions.push({ label: 'Look at this month', patch: { period: 'THIS_MONTH' } })
  }
  if (filters.pricing !== 'ALL') {
    actions.push({ label: 'Show all prices', patch: { pricing: 'ALL' } })
  }
  if (filters.arrondissement) {
    actions.push({ label: 'Search everywhere', patch: { arrondissement: null } })
  }
  if (filters.category) {
    actions.push({ label: 'Show all categories', patch: { category: null } })
  }

  const canClearAll = filters !== DEFAULT_FILTERS && actions.length > 1

  return (
    <div
      className="border-border bg-card rounded-xl border border-dashed px-5 py-10 text-center"
      data-testid="empty-results"
    >
      <SearchX aria-hidden="true" className="text-muted-foreground mx-auto size-7" />
      <h3 className="mt-3 text-base font-semibold">No events found</h3>
      <p className="text-muted-foreground mx-auto mt-1.5 max-w-md text-sm">
        Nothing matches {activeDescriptions.join(', ')}
        {filters.query.trim() !== '' ? ` and “${filters.query.trim()}”` : ''}. Try widening your
        search.
      </p>

      {actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => onChange(action.patch)}
            >
              {action.label}
            </Button>
          ))}
          {canClearAll ? (
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              Clear all filters
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
