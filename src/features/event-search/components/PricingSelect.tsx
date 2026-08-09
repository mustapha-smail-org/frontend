import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EventPricing } from '@/shared/api/types'
import { PRICING_OPTIONS } from '@/shared/formatters/labels'

interface PricingSelectProps {
  value: EventPricing
  onChange: (value: EventPricing) => void
  className?: string
}

/** PRD FR-FILTER-003. "Price not specified" is never worded as "Free". */
export function PricingSelect({ value, onChange, className }: PricingSelectProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as EventPricing)}>
      <SelectTrigger aria-label="Price" className={className} data-testid="pricing-select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRICING_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
