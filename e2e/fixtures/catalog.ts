import type { Page, Route } from '@playwright/test'

/**
 * Network-level Catalog Service stub for the e2e suite.
 * Mirrors the runtime DTO field names (`pricing`, `venue`).
 */

export const CATEGORIES = ['Concert', 'Exposition', 'Théâtre', 'Atelier', 'Festival']

function summary(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `evt-${String(index).padStart(3, '0')}`,
    title: `Event number ${index}`,
    // Mirrors the real backend: HTML, truncated mid-tag by `summarize()`, and
    // in this fixture also carrying a hostile fragment.
    summary:
      `<p>Summary for event ${index}.</p>` +
      '<script>window.__pwned = true</script> Book at <a href="https://exa',
    categories: ['Concert'],
    pricing: index % 3 === 0 ? 'FREE' : index % 3 === 1 ? 'PAID' : 'NOT_SPECIFIED',
    arrondissement: 11,
    venue: `Venue ${index}`,
    startAt: '2026-09-12T20:30:00+02:00',
    endAt: '2026-09-12T23:00:00+02:00',
    officialUrl: 'https://example.org/event',
    ...overrides,
  }
}

function marker(index: number) {
  return {
    id: `evt-${String(index).padStart(3, '0')}`,
    title: `Event number ${index}`,
    latitude: 48.86 + index * 0.001,
    longitude: 2.35 + index * 0.001,
    category: 'Concert',
    pricing: 'FREE',
    arrondissement: 11,
    startAt: '2026-09-12T20:30:00+02:00',
  }
}

export const LIST_PAGE_ONE = {
  items: Array.from({ length: 5 }, (_, index) => summary(index + 1)),
  nextCursor: 'cursor-2',
  hasNext: true,
}

export const LIST_PAGE_TWO = {
  items: [
    // Repeats evt-005 so the de-duplication guarantee is exercised end to end.
    summary(5),
    ...Array.from({ length: 3 }, (_, index) => summary(index + 6)),
  ],
  nextCursor: null,
  hasNext: false,
}

export const MAP_PAGE_ONE = {
  items: Array.from({ length: 3 }, (_, index) => marker(index + 1)),
  nextCursor: 'map-cursor-2',
  hasNext: true,
}

export const MAP_PAGE_TWO = {
  items: [marker(4)],
  nextCursor: null,
  hasNext: false,
}

export const DETAIL = {
  id: 'evt-001',
  title: 'Event number 1',
  // Mirrors real upstream data: HTML, including a hostile fragment that must
  // never reach the DOM as markup.
  description:
    '<p>A full <b>description</b>.</p>' +
    '<p>Book via <a href="https://example.org/tickets">our partner</a>.</p>' +
    '<script>window.__pwned = true</script><img src=x onerror="window.__pwned = true">',
  categories: ['Concert', 'Musique'],
  officialUrl: 'https://example.org/event',
  startAt: '2026-09-12T20:30:00+02:00',
  endAt: '2026-09-12T23:00:00+02:00',
  location: {
    name: 'Venue 1',
    street: '50 Boulevard Voltaire',
    zipcode: '75011',
    city: 'Paris',
    arrondissement: 11,
    latitude: 48.8631,
    longitude: 2.3708,
  },
  accessibility: {
    wheelchairAccessible: true,
    blindAccessible: null,
    deafAccessible: null,
    signLanguage: null,
    mentalAccessibility: null,
  },
  pricing: {
    type: 'payant',
    detail: '<p>From <strong>€28</strong></p><script>window.__pwned = true</script>',
    accessType: 'Ticket required',
    bookingUrl: 'https://example.org/book',
    bookingLinkText: 'Buy tickets',
  },
  occurrences: [{ start: '2026-09-12T20:30:00+02:00', end: '2026-09-12T23:00:00+02:00' }],
}

export interface StubOptions {
  /** Record every intercepted request URL for assertions. */
  requestLog?: string[]
  /** Force the list endpoint to return no items. */
  emptyList?: boolean
  /** Fail the list endpoint with 503 until `recoverAfter` calls have been made. */
  failListUntil?: number
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: status >= 400 ? 'application/problem+json' : 'application/json',
    headers: { 'X-Correlation-ID': 'e2e-correlation-id' },
    body: JSON.stringify(body),
  })
}

export async function stubCatalog(page: Page, options: StubOptions = {}): Promise<void> {
  const { requestLog, emptyList = false, failListUntil = 0 } = options
  let listCalls = 0

  await page.route('**/api/v1/categories*', (route) => {
    requestLog?.push(route.request().url())
    return json(route, CATEGORIES)
  })

  await page.route('**/api/v1/events/map*', (route) => {
    const url = new URL(route.request().url())
    requestLog?.push(url.toString())
    return json(route, url.searchParams.get('cursor') ? MAP_PAGE_TWO : MAP_PAGE_ONE)
  })

  await page.route('**/api/v1/events/*', (route) => {
    const url = new URL(route.request().url())
    const eventId = url.pathname.split('/').pop() ?? ''

    // Playwright evaluates routes last-registered-first, so this pattern also
    // catches `/events/map`; hand that back to the more specific handler.
    if (eventId === 'map') return route.fallback()

    requestLog?.push(url.toString())

    if (eventId === 'evt-001') return json(route, DETAIL)

    return json(
      route,
      {
        type: 'https://api.citypulse.dev/problems/event-not-found',
        title: 'Event not found',
        status: 404,
        detail: `Event ${eventId} was not found`,
        code: 'EVENT_NOT_FOUND',
        correlationId: 'e2e-correlation-id',
      },
      404
    )
  })

  await page.route('**/api/v1/events?*', (route) => {
    const url = new URL(route.request().url())
    requestLog?.push(url.toString())
    listCalls += 1

    if (listCalls <= failListUntil) {
      return json(
        route,
        {
          title: 'Service temporarily unavailable',
          status: 503,
          detail: 'The service cannot complete the request at this time',
          code: 'SERVICE_UNAVAILABLE',
          correlationId: 'e2e-correlation-id',
        },
        503
      )
    }

    if (emptyList) return json(route, { items: [], nextCursor: null, hasNext: false })

    return json(route, url.searchParams.get('cursor') ? LIST_PAGE_TWO : LIST_PAGE_ONE)
  })

  // Map tiles must never hit a real provider during tests.
  await page.route('**/tile.openstreetmap.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from([]) })
  )
}
