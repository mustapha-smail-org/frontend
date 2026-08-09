/**
 * Display labels (PRD FR-FILTER-001/003/004, FR-LIST-002).
 * The UI language is English; API and URL values keep their enum spelling.
 */

import type {
  EventArrondissement,
  EventPeriod,
  EventPricing,
  PricingCategory,
} from '@/shared/api/types'

export const PERIOD_OPTIONS: ReadonlyArray<{ value: EventPeriod; label: string; short: string }> = [
  { value: 'TODAY', label: 'Today', short: 'Today' },
  { value: 'TOMORROW', label: 'Tomorrow', short: 'Tmrw' },
  { value: 'THIS_WEEK', label: 'This week', short: 'Week' },
  { value: 'THIS_MONTH', label: 'This month', short: 'Month' },
]

export const PRICING_OPTIONS: ReadonlyArray<{ value: EventPricing; label: string }> = [
  { value: 'ALL', label: 'All prices' },
  { value: 'FREE', label: 'Free' },
  { value: 'PAID', label: 'Paid' },
  // Never worded as "Free"; missing price data is its own state.
  { value: 'NOT_SPECIFIED', label: 'Price not specified' },
]

export const ARRONDISSEMENT_VALUES: readonly EventArrondissement[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  'OUTSIDE_PARIS',
  'UNKNOWN',
]

export function ordinal(value: number): string {
  const mod100 = value % 100
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`
  switch (value % 10) {
    case 1:
      return `${value}st`
    case 2:
      return `${value}nd`
    case 3:
      return `${value}rd`
    default:
      return `${value}th`
  }
}

export function arrondissementLabel(value: EventArrondissement): string {
  if (value === 'OUTSIDE_PARIS') return 'Outside Paris'
  if (value === 'UNKNOWN') return 'Location unknown'
  return `${ordinal(Number(value))} arrondissement`
}

/** Short form used on cards where horizontal space is scarce. */
export function arrondissementBadgeLabel(value: number | null): string | null {
  if (value === null) return null
  return `Paris ${ordinal(value)}`
}

export function periodLabel(value: EventPeriod): string {
  return PERIOD_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export function pricingFilterLabel(value: EventPricing): string {
  return PRICING_OPTIONS.find((option) => option.value === value)?.label ?? value
}

const PRICING_CATEGORY_LABELS: Record<PricingCategory, string> = {
  FREE: 'Free',
  PAID: 'Paid',
  NOT_SPECIFIED: 'Price not specified',
}

export function pricingCategoryLabel(value: PricingCategory): string {
  return PRICING_CATEGORY_LABELS[value]
}

export const PRICING_BADGE_VARIANT: Record<PricingCategory, 'free' | 'paid' | 'unspecified'> = {
  FREE: 'free',
  PAID: 'paid',
  NOT_SPECIFIED: 'unspecified',
}
