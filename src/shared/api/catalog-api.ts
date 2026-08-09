/**
 * Catalog Service adapter (PRD 11).
 *
 * Responsibilities:
 *  - flatten the semantic filter object into query parameters,
 *  - validate the container shape of every response,
 *  - collapse the PRD/runtime DTO field-name divergence into one domain model.
 */

import { reportContractViolation } from '@/shared/observability/reporter'

import { apiGet } from './client'
import { contractError } from './errors'
import type {
  CursorPage,
  EventDetail,
  EventFilters,
  EventMapMarker,
  EventMapMarkerWire,
  EventSummary,
  EventSummaryWire,
  PricingCategory,
} from './types'

/** PRD FR-LIST-001. */
export const LIST_PAGE_SIZE = 20
/** PRD FR-MAP-001. */
export const MAP_PAGE_SIZE = 100

const MAX_QUERY_LENGTH = 200

/* --- Request serialisation (PRD 11.2) -------------------------------------- */

export function buildSearchParams(
  filters: EventFilters,
  limit: number,
  cursor?: string | null
): URLSearchParams {
  const params = new URLSearchParams()

  params.set('period', filters.period)
  // Always sent for both list and map so ordering is stable and identical.
  params.set('sort', 'START_DATE')
  params.set('limit', String(limit))

  if (filters.category && filters.category.trim() !== '') {
    params.set('category', filters.category)
  }

  // `ALL` is the backend default; omitting it keeps request URLs minimal.
  if (filters.pricing && filters.pricing !== 'ALL') {
    params.set('pricing', filters.pricing)
  }

  if (filters.arrondissement) {
    params.set('arrondissement', filters.arrondissement)
  }

  const query = filters.query.trim()
  if (query !== '') {
    params.set('query', query.slice(0, MAX_QUERY_LENGTH))
  }

  // The cursor is opaque: pass the exact bytes the server handed us.
  if (cursor) {
    params.set('cursor', cursor)
  }

  return params
}

/* --- Response normalisation ------------------------------------------------ */

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function int(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : null
}

function bool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')
}

const PRICING_CATEGORIES: PricingCategory[] = ['FREE', 'PAID', 'NOT_SPECIFIED']

/**
 * Anything the backend cannot classify becomes `NOT_SPECIFIED`, never `FREE`
 * (PRD FR-FILTER-003 / experience principle "honest data").
 */
function pricingCategory(...candidates: unknown[]): PricingCategory {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const upper = candidate.toUpperCase() as PricingCategory
      if (PRICING_CATEGORIES.includes(upper)) return upper
    }
  }
  return 'NOT_SPECIFIED'
}

export function normaliseSummary(wire: EventSummaryWire): EventSummary | null {
  const id = str(wire.id)
  const title = str(wire.title)
  if (!id || !title) return null

  return {
    id,
    title,
    summary: str(wire.summary),
    categories: stringList(wire.categories),
    pricingCategory: pricingCategory(wire.pricing, wire.pricingCategory),
    arrondissement: int(wire.arrondissement),
    venueName: str(wire.venue) ?? str(wire.venueName),
    startAt: str(wire.startAt),
    endAt: str(wire.endAt),
    officialUrl: str(wire.officialUrl),
  }
}

/** PRD FR-MAP-001: only finite coordinates may become markers. */
export function normaliseMarker(wire: EventMapMarkerWire): EventMapMarker | null {
  const id = str(wire.id)
  const title = str(wire.title)
  const latitude = wire.latitude
  const longitude = wire.longitude

  if (!id || !title) return null
  if (typeof latitude !== 'number' || !Number.isFinite(latitude)) return null
  if (typeof longitude !== 'number' || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null

  return {
    id,
    title,
    latitude,
    longitude,
    category: str(wire.category),
    pricingCategory: pricingCategory(wire.pricing, wire.pricingCategory),
    arrondissement: int(wire.arrondissement),
    startAt: str(wire.startAt),
  }
}

function normaliseDetail(wire: Record<string, unknown>): EventDetail | null {
  const id = str(wire.id)
  const title = str(wire.title)
  if (!id || !title) return null

  const location = wire.location as Record<string, unknown> | null | undefined
  const accessibility = wire.accessibility as Record<string, unknown> | null | undefined
  const pricing = wire.pricing as Record<string, unknown> | null | undefined
  const occurrences = Array.isArray(wire.occurrences) ? wire.occurrences : []

  return {
    id,
    title,
    description: str(wire.description),
    categories: stringList(wire.categories),
    officialUrl: str(wire.officialUrl),
    startAt: str(wire.startAt),
    endAt: str(wire.endAt),
    location: location
      ? {
          name: str(location.name),
          street: str(location.street),
          zipcode: str(location.zipcode),
          city: str(location.city),
          arrondissement: int(location.arrondissement),
          latitude: typeof location.latitude === 'number' ? location.latitude : null,
          longitude: typeof location.longitude === 'number' ? location.longitude : null,
        }
      : null,
    accessibility: accessibility
      ? {
          wheelchairAccessible: bool(accessibility.wheelchairAccessible),
          blindAccessible: bool(accessibility.blindAccessible),
          deafAccessible: bool(accessibility.deafAccessible),
          signLanguage: str(accessibility.signLanguage),
          mentalAccessibility: str(accessibility.mentalAccessibility),
        }
      : null,
    pricing: pricing
      ? {
          type: str(pricing.type),
          detail: str(pricing.detail),
          accessType: str(pricing.accessType),
          bookingUrl: str(pricing.bookingUrl),
          bookingLinkText: str(pricing.bookingLinkText),
        }
      : null,
    // Order is preserved exactly as supplied (PRD FR-DETAIL-005).
    occurrences: occurrences.flatMap((entry) => {
      const record = entry as Record<string, unknown> | null
      if (!record) return []
      const start = str(record.start)
      const end = str(record.end)
      if (!start && !end) return []
      return [{ start, end }]
    }),
  }
}

/* --- Cursor page guard (PRD 9.6) ------------------------------------------- */

export function normaliseCursorPage<TWire, TItem>(
  body: unknown,
  mapItem: (wire: TWire) => TItem | null,
  context: string
): CursorPage<TItem> {
  const record = body as Record<string, unknown> | null

  if (!record || !Array.isArray(record.items)) {
    // Missing `items` is a contract failure, NOT a successful empty page.
    throw contractError('CityPulse received an incomplete list of events.', 200, null)
  }

  const items: TItem[] = []
  let dropped = 0
  for (const wire of record.items as TWire[]) {
    const item = mapItem(wire)
    if (item) items.push(item)
    else dropped += 1
  }
  if (dropped > 0) {
    reportContractViolation('Dropped unusable items from a cursor page', { context, dropped })
  }

  const hasNextRaw = record.hasNext
  const nextCursorRaw = typeof record.nextCursor === 'string' ? record.nextCursor : null
  let hasNext = hasNextRaw === true
  let nextCursor = nextCursorRaw && nextCursorRaw.trim() !== '' ? nextCursorRaw : null

  if (!hasNext && nextCursor) {
    // hasNext=false: ignore any unexpected cursor.
    nextCursor = null
  }

  if (hasNext && !nextCursor) {
    // hasNext=true with a blank cursor: stop rather than loop forever.
    reportContractViolation('hasNext=true but nextCursor was missing; stopping pagination', {
      context,
    })
    hasNext = false
  }

  return { items, nextCursor, hasNext }
}

/* --- Public client functions (PRD 11.1) ------------------------------------ */

export async function searchEvents(
  filters: EventFilters,
  cursor?: string | null,
  signal?: AbortSignal
): Promise<CursorPage<EventSummary>> {
  const body = await apiGet<unknown>('/api/v1/events', {
    searchParams: buildSearchParams(filters, LIST_PAGE_SIZE, cursor),
    signal,
  })
  return normaliseCursorPage<EventSummaryWire, EventSummary>(body, normaliseSummary, 'events')
}

export async function searchMapEvents(
  filters: EventFilters,
  cursor?: string | null,
  signal?: AbortSignal
): Promise<CursorPage<EventMapMarker>> {
  const body = await apiGet<unknown>('/api/v1/events/map', {
    searchParams: buildSearchParams(filters, MAP_PAGE_SIZE, cursor),
    signal,
  })
  return normaliseCursorPage<EventMapMarkerWire, EventMapMarker>(
    body,
    normaliseMarker,
    'events/map'
  )
}

export async function getEvent(eventId: string, signal?: AbortSignal): Promise<EventDetail> {
  const body = await apiGet<Record<string, unknown>>(
    `/api/v1/events/${encodeURIComponent(eventId)}`,
    { signal }
  )
  const detail = normaliseDetail(body)
  if (!detail) {
    throw contractError('CityPulse received an incomplete event.', 200, null)
  }
  return detail
}

export async function getCategories(signal?: AbortSignal): Promise<string[]> {
  const body = await apiGet<unknown>('/api/v1/categories', { signal })
  if (!Array.isArray(body)) {
    // API-GAP-004: the Swagger declares `string`, the controller returns a list.
    throw contractError('CityPulse received an unexpected category list.', 200, null)
  }
  return stringList(body)
}
