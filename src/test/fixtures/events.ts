/**
 * Fixtures mirroring the *runtime* Catalog Service payloads (PRD 19, Phase 0).
 * Note the `pricing` and `venue` field names — these are what the Spring DTOs
 * actually serialise, not the `pricingCategory`/`venueName` used in PRD 9.4.
 */

export const categoriesFixture = ['Concert', 'Exposition', 'Théâtre', 'Atelier', 'Festival']

export interface RawSummary {
  id: string
  title: string
  summary: string | null
  categories: string[]
  pricing: string
  arrondissement: number | null
  venue: string | null
  startAt: string | null
  endAt: string | null
  officialUrl: string | null
}

export const summaryFixture = (overrides: Partial<RawSummary> = {}): RawSummary => ({
  id: 'evt-001',
  title: 'Jazz at Le Bataclan',
  summary: 'An evening of contemporary jazz with three ensembles.',
  categories: ['Concert'],
  pricing: 'PAID',
  arrondissement: 11,
  venue: 'Le Bataclan',
  startAt: '2026-09-12T20:30:00+02:00',
  endAt: '2026-09-12T23:00:00+02:00',
  officialUrl: 'https://example.org/jazz',
  ...overrides,
})

export const listPageOne = {
  items: [
    summaryFixture(),
    summaryFixture({
      id: 'evt-002',
      title: 'Free open-air cinema',
      summary: null,
      categories: ['Festival', 'Projection'],
      pricing: 'FREE',
      arrondissement: 19,
      venue: 'Parc de la Villette',
      startAt: '2026-09-13T21:00:00+02:00',
      endAt: null,
      officialUrl: null,
    }),
    summaryFixture({
      id: 'evt-003',
      title: 'Atelier céramique',
      summary: 'Hands-on introduction to wheel throwing.',
      categories: ['Atelier'],
      pricing: 'NOT_SPECIFIED',
      arrondissement: null,
      venue: null,
      startAt: null,
      endAt: null,
      officialUrl: null,
    }),
  ],
  nextCursor: 'cursor-page-2',
  hasNext: true,
}

export const listPageTwo = {
  items: [
    // Deliberately repeats evt-003 so de-duplication is exercised (PRD 17.3).
    summaryFixture({ id: 'evt-003', title: 'Atelier céramique' }),
    summaryFixture({
      id: 'evt-004',
      title: 'Exposition photographique',
      categories: ['Exposition'],
    }),
  ],
  nextCursor: null,
  hasNext: false,
}

export const mapPageOne = {
  items: [
    {
      id: 'evt-001',
      title: 'Jazz at Le Bataclan',
      latitude: 48.8631,
      longitude: 2.3708,
      category: 'Concert',
      pricing: 'PAID',
      arrondissement: 11,
      startAt: '2026-09-12T20:30:00+02:00',
    },
    {
      id: 'evt-002',
      title: 'Free open-air cinema',
      latitude: 48.8938,
      longitude: 2.3903,
      category: 'Festival',
      pricing: 'FREE',
      arrondissement: 19,
      startAt: '2026-09-13T21:00:00+02:00',
    },
    // Invalid coordinates: must never become a marker (PRD FR-MAP-001).
    {
      id: 'evt-broken',
      title: 'Event with no coordinates',
      latitude: null,
      longitude: null,
      category: null,
      pricing: 'FREE',
      arrondissement: null,
      startAt: null,
    },
  ],
  nextCursor: 'map-cursor-2',
  hasNext: true,
}

export const mapPageTwo = {
  items: [
    {
      id: 'evt-004',
      title: 'Exposition photographique',
      latitude: 48.8606,
      longitude: 2.3376,
      category: 'Exposition',
      pricing: 'NOT_SPECIFIED',
      arrondissement: 1,
      startAt: '2026-09-14T10:00:00+02:00',
    },
  ],
  nextCursor: null,
  hasNext: false,
}

export const detailFixture = {
  id: 'evt-001',
  title: 'Jazz at Le Bataclan',
  description:
    'An evening of contemporary jazz with three ensembles.\n\nDoors open at 19:30.\nSeating is unreserved.',
  categories: ['Concert', 'Musique'],
  officialUrl: 'https://example.org/jazz',
  startAt: '2026-09-12T20:30:00+02:00',
  endAt: '2026-09-12T23:00:00+02:00',
  location: {
    name: 'Le Bataclan',
    street: '50 Boulevard Voltaire',
    zipcode: '75011',
    city: 'Paris',
    arrondissement: 11,
    latitude: 48.8631,
    longitude: 2.3708,
  },
  accessibility: {
    wheelchairAccessible: true,
    blindAccessible: false,
    deafAccessible: null,
    signLanguage: null,
    mentalAccessibility: null,
  },
  pricing: {
    type: 'payant',
    detail: 'From €28',
    accessType: 'Ticket required',
    bookingUrl: 'https://example.org/jazz/book',
    bookingLinkText: 'Buy tickets',
  },
  occurrences: [
    { start: '2026-09-12T20:30:00+02:00', end: '2026-09-12T23:00:00+02:00' },
    { start: '2026-09-13T20:30:00+02:00', end: '2026-09-13T23:00:00+02:00' },
  ],
}

/** Minimal event exercising every "missing data" branch. */
export const sparseDetailFixture = {
  id: 'evt-sparse',
  title: 'Untitled happening',
  description: null,
  categories: [],
  officialUrl: null,
  startAt: null,
  endAt: null,
  location: null,
  accessibility: null,
  pricing: null,
  occurrences: [],
}

export function problemDetail(
  status: number,
  code: string,
  title: string,
  detail: string,
  extra: Record<string, unknown> = {}
) {
  return {
    type: `https://api.citypulse.dev/problems/${code.toLowerCase().replace(/_/g, '-')}`,
    title,
    status,
    detail,
    instance: '/api/v1/events',
    code,
    timestamp: '2026-08-09T10:00:00Z',
    correlationId: 'test-correlation-id',
    ...extra,
  }
}
