import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EventArrondissement } from '@/shared/api/types'
import { arrondissementLabel } from '@/shared/formatters/labels'

const ALL_VALUE = '__ALL__'

const NUMBERED: EventArrondissement[] = Array.from(
  { length: 20 },
  (_, index) => String(index + 1) as EventArrondissement
)

interface ArrondissementSelectProps {
  value: EventArrondissement | null
  onChange: (value: EventArrondissement | null) => void
  className?: string
}

/**
 * PRD FR-FILTER-004: readable ordinal labels in the UI, raw `1`–`20`,
 * `OUTSIDE_PARIS` and `UNKNOWN` on the wire.
 */
export function ArrondissementSelect({ value, onChange, className }: ArrondissementSelectProps) {
  return (
    <Select
      value={value ?? ALL_VALUE}
      onValueChange={(next) => onChange(next === ALL_VALUE ? null : (next as EventArrondissement))}
    >
      <SelectTrigger
        aria-label="Location"
        className={className}
        data-testid="arrondissement-select"
      >
        <SelectValue placeholder="All locations" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value={ALL_VALUE}>All locations</SelectItem>
        <SelectSeparator />
        {NUMBERED.map((option) => (
          <SelectItem key={option} value={option}>
            {arrondissementLabel(option)}
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value="OUTSIDE_PARIS">{arrondissementLabel('OUTSIDE_PARIS')}</SelectItem>
        <SelectItem value="UNKNOWN">{arrondissementLabel('UNKNOWN')}</SelectItem>
      </SelectContent>
    </Select>
  )
}
