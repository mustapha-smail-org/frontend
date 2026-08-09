/**
 * Query-key factory (PRD 8.5).
 *
 * Cursors are NOT part of any key — they are infinite-query page params.
 */

import type { EventFilters } from './types'
import { filtersKey } from '@/features/event-search/search-params'

export const catalogKeys = {
  all: ['catalog'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  events: (filters: EventFilters) => [...catalogKeys.all, 'events', filtersKey(filters)] as const,
  mapEvents: (filters: EventFilters) =>
    [...catalogKeys.all, 'map-events', filtersKey(filters)] as const,
  event: (eventId: string) => [...catalogKeys.all, 'event', eventId] as const,
}
