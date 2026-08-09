/**
 * URL <-> filter contract (PRD 5.2, 5.3).
 *
 * The URL is the single source of truth for shareable search state. These are
 * pure functions so they can be unit-tested without a router.
 */

import type {
  EventArrondissement,
  EventFilters,
  EventPeriod,
  EventPricing,
} from '@/shared/api/types'
import { ARRONDISSEMENT_VALUES } from '@/shared/formatters/labels'

export const MAX_QUERY_LENGTH = 200

export const DEFAULT_FILTERS: EventFilters = {
  period: 'THIS_WEEK',
  category: null,
  pricing: 'ALL',
  arrondissement: null,
  query: '',
}

const PERIODS: readonly EventPeriod[] = ['TODAY', 'TOMORROW', 'THIS_WEEK', 'THIS_MONTH']
const PRICINGS: readonly EventPricing[] = ['ALL', 'FREE', 'PAID', 'NOT_SPECIFIED']

function readParam(params: URLSearchParams, key: string): string | null {
  const raw = params.get(key)
  if (raw === null) return null
  const trimmed = raw.trim()
  // Empty and whitespace-only values are treated as absent.
  return trimmed === '' ? null : trimmed
}

function parsePeriod(value: string | null): EventPeriod {
  if (!value) return DEFAULT_FILTERS.period
  const upper = value.toUpperCase() as EventPeriod
  return PERIODS.includes(upper) ? upper : DEFAULT_FILTERS.period
}

function parsePricing(value: string | null): EventPricing {
  if (!value) return DEFAULT_FILTERS.pricing
  const upper = value.toUpperCase() as EventPricing
  return PRICINGS.includes(upper) ? upper : DEFAULT_FILTERS.pricing
}

function parseArrondissement(value: string | null): EventArrondissement | null {
  if (!value) return null
  const upper = value.toUpperCase()
  // Numeric values are compared as-is; `01` is not a valid backend value.
  const candidate = (ARRONDISSEMENT_VALUES as readonly string[]).includes(value)
    ? value
    : (ARRONDISSEMENT_VALUES as readonly string[]).includes(upper)
      ? upper
      : null
  return candidate as EventArrondissement | null
}

/**
 * Category values are case-preserving because they originate from the backend.
 * Availability is not validated here: the category list may still be loading,
 * and an unmatched value simply returns no results rather than being discarded.
 */
function parseCategory(value: string | null): string | null {
  if (!value) return null
  return value.slice(0, 100)
}

function parseQuery(value: string | null): string {
  if (!value) return ''
  return value.slice(0, MAX_QUERY_LENGTH)
}

/** Unknown parameters are ignored and never reflected into application state. */
export function parseFilters(params: URLSearchParams): EventFilters {
  return {
    period: parsePeriod(readParam(params, 'period')),
    category: parseCategory(readParam(params, 'category')),
    pricing: parsePricing(readParam(params, 'pricing')),
    arrondissement: parseArrondissement(readParam(params, 'arrondissement')),
    query: parseQuery(readParam(params, 'query')),
  }
}

/**
 * Canonical serialisation: defaults are omitted so a default search is just `/`.
 * Unknown incoming parameters are dropped on the next canonical update.
 */
export function serialiseFilters(filters: EventFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.period !== DEFAULT_FILTERS.period) params.set('period', filters.period)
  if (filters.category) params.set('category', filters.category)
  if (filters.pricing !== DEFAULT_FILTERS.pricing) params.set('pricing', filters.pricing)
  if (filters.arrondissement) params.set('arrondissement', filters.arrondissement)

  const query = filters.query.trim()
  if (query !== '') params.set('query', query.slice(0, MAX_QUERY_LENGTH))

  return params
}

export function filtersToSearchString(filters: EventFilters): string {
  const serialised = serialiseFilters(filters).toString()
  return serialised === '' ? '' : `?${serialised}`
}

export function isDefaultFilters(filters: EventFilters): boolean {
  return serialiseFilters(filters).toString() === ''
}

/** Stable identity for query keys and effect dependencies. */
export function filtersKey(filters: EventFilters): string {
  const params = serialiseFilters(filters)
  params.sort()
  return params.toString()
}

export interface ActiveFilterChip {
  id: 'period' | 'category' | 'pricing' | 'arrondissement' | 'query'
  label: string
  /** The filter patch applied when the chip's remove button is pressed. */
  removePatch: Partial<EventFilters>
}

export function countActiveFilters(filters: EventFilters): number {
  let count = 0
  if (filters.period !== DEFAULT_FILTERS.period) count += 1
  if (filters.category) count += 1
  if (filters.pricing !== DEFAULT_FILTERS.pricing) count += 1
  if (filters.arrondissement) count += 1
  if (filters.query.trim() !== '') count += 1
  return count
}
