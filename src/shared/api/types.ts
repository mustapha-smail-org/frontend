/**
 * Hand-authored adapter DTOs for the Catalog Service (PRD 10.2, "temporary path").
 *
 * These types are grounded in the *running* Spring controller and DTO records in
 * `catalog-service/src/main/java/com/citypulse/catalog/dto`, not in the supplied
 * Swagger, which still carries the gaps listed in PRD 10.1.
 *
 * Verified against the backend on 2026-08-09:
 *   - `EventController` uses `@ModelAttribute EventSearchRequest`, so search
 *     parameters are sent flattened (resolves API-GAP-005 at runtime level).
 *   - `findCategories()` returns `List<String>` (API-GAP-004 is doc-only).
 *   - `CursorPageResponse<T>` is `{ items, nextCursor, hasNext }`.
 *
 * KNOWN CONTRADICTION WITH PRD 9.4 / 9.5 (reported, not silently changed):
 *   - The summary DTO field is `pricing`, the PRD calls it `pricingCategory`.
 *   - The summary DTO field is `venue`, the PRD calls it `venueName`.
 *   - The map marker DTO field is `pricing`, the PRD calls it `pricingCategory`.
 * The wire types below accept BOTH spellings and `normalise*` collapses them to
 * one internal shape, so the frontend survives whichever side is corrected.
 *
 * Replace this file with generated types once the OpenAPI contract is fixed.
 */

export type EventPeriod = 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'THIS_MONTH'
export type EventPricing = 'ALL' | 'FREE' | 'PAID' | 'NOT_SPECIFIED'
export type PricingCategory = 'FREE' | 'PAID' | 'NOT_SPECIFIED'
export type EventSort = 'START_DATE'

type ArrondissementNumber =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17'
  | '18'
  | '19'
  | '20'

export type EventArrondissement = ArrondissementNumber | 'OUTSIDE_PARIS' | 'UNKNOWN'

/** The normalised, semantic filter object shared by the list and map queries. */
export interface EventFilters {
  period: EventPeriod
  category: string | null
  pricing: EventPricing
  arrondissement: EventArrondissement | null
  query: string
}

export interface EventSearchParams extends Partial<EventFilters> {
  sort?: EventSort
  limit?: number
  cursor?: string
}

/* --- Wire shapes (what the service actually serialises) -------------------- */

export interface EventSummaryWire {
  id?: unknown
  title?: unknown
  summary?: unknown
  categories?: unknown
  /** Runtime name. */
  pricing?: unknown
  /** PRD 9.4 name; tolerated so a backend rename does not break the client. */
  pricingCategory?: unknown
  arrondissement?: unknown
  /** Runtime name. */
  venue?: unknown
  /** PRD 9.4 name. */
  venueName?: unknown
  startAt?: unknown
  endAt?: unknown
  officialUrl?: unknown
}

export interface EventMapMarkerWire {
  id?: unknown
  title?: unknown
  latitude?: unknown
  longitude?: unknown
  category?: unknown
  pricing?: unknown
  pricingCategory?: unknown
  arrondissement?: unknown
  startAt?: unknown
}

/* --- Normalised domain models used by the whole app ------------------------ */

export interface EventSummary {
  id: string
  title: string
  summary: string | null
  categories: string[]
  pricingCategory: PricingCategory
  arrondissement: number | null
  venueName: string | null
  startAt: string | null
  endAt: string | null
  officialUrl: string | null
}

export interface EventMapMarker {
  id: string
  title: string
  latitude: number
  longitude: number
  category: string | null
  pricingCategory: PricingCategory
  arrondissement: number | null
  startAt: string | null
}

export interface EventLocation {
  name: string | null
  street: string | null
  zipcode: string | null
  city: string | null
  arrondissement: number | null
  latitude: number | null
  longitude: number | null
}

export interface EventAccessibility {
  wheelchairAccessible: boolean | null
  blindAccessible: boolean | null
  deafAccessible: boolean | null
  signLanguage: string | null
  mentalAccessibility: string | null
}

export interface EventPricingDetail {
  type: string | null
  detail: string | null
  accessType: string | null
  bookingUrl: string | null
  bookingLinkText: string | null
}

export interface EventOccurrence {
  start: string | null
  end: string | null
}

export interface EventDetail {
  id: string
  title: string
  description: string | null
  categories: string[]
  officialUrl: string | null
  startAt: string | null
  endAt: string | null
  location: EventLocation | null
  accessibility: EventAccessibility | null
  pricing: EventPricingDetail | null
  occurrences: EventOccurrence[]
}

export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
  hasNext: boolean
}
