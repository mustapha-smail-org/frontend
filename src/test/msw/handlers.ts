import { http, HttpResponse } from 'msw'

import {
  categoriesFixture,
  detailFixture,
  listPageOne,
  listPageTwo,
  mapPageOne,
  mapPageTwo,
  problemDetail,
  sparseDetailFixture,
} from '../fixtures/events'

const CORRELATION_HEADER = { 'X-Correlation-ID': 'test-correlation-id' }

function problemResponse(status: number, code: string, title: string, detail: string, extra = {}) {
  return HttpResponse.json(problemDetail(status, code, title, detail, extra), {
    status,
    headers: { ...CORRELATION_HEADER, 'Content-Type': 'application/problem+json' },
  })
}

/** Default happy-path handlers; individual tests override with `server.use`. */
export const handlers = [
  http.get('*/api/v1/categories', () =>
    HttpResponse.json(categoriesFixture, { headers: CORRELATION_HEADER })
  ),

  http.get('*/api/v1/events/map', ({ request }) => {
    const cursor = new URL(request.url).searchParams.get('cursor')
    return HttpResponse.json(cursor ? mapPageTwo : mapPageOne, { headers: CORRELATION_HEADER })
  }),

  http.get('*/api/v1/events/:eventId', ({ params }) => {
    const { eventId } = params
    if (eventId === 'evt-sparse') {
      return HttpResponse.json(sparseDetailFixture, { headers: CORRELATION_HEADER })
    }
    if (eventId === 'evt-001') {
      return HttpResponse.json(detailFixture, { headers: CORRELATION_HEADER })
    }
    return problemResponse(
      404,
      'EVENT_NOT_FOUND',
      'Event not found',
      `Event ${String(eventId)} was not found`
    )
  }),

  http.get('*/api/v1/events', ({ request }) => {
    const cursor = new URL(request.url).searchParams.get('cursor')
    return HttpResponse.json(cursor ? listPageTwo : listPageOne, { headers: CORRELATION_HEADER })
  }),
]

/* --- Named error scenarios used by individual tests ------------------------ */

export const errorHandlers = {
  listValidationFailed: http.get('*/api/v1/events', () =>
    problemResponse(
      400,
      'VALIDATION_FAILED',
      'Validation failed',
      'One or more request values are invalid',
      {
        violations: [{ field: 'arrondissement', message: 'arrondissement must be 1-20' }],
      }
    )
  ),

  listInvalidCursor: http.get('*/api/v1/events', ({ request }) => {
    const cursor = new URL(request.url).searchParams.get('cursor')
    if (!cursor) return HttpResponse.json(listPageOne, { headers: CORRELATION_HEADER })
    return problemResponse(
      400,
      'INVALID_CURSOR',
      'Invalid pagination cursor',
      'The cursor is not valid'
    )
  }),

  listServerError: http.get('*/api/v1/events', () =>
    problemResponse(500, 'INTERNAL_ERROR', 'Internal server error', 'An unexpected error occurred')
  ),

  listMalformedJson: http.get('*/api/v1/events', () =>
    HttpResponse.text('{"items": [', { status: 200, headers: CORRELATION_HEADER })
  ),

  listMissingItems: http.get('*/api/v1/events', () =>
    HttpResponse.json({ nextCursor: null, hasNext: false }, { headers: CORRELATION_HEADER })
  ),

  listNetworkError: http.get('*/api/v1/events', () => HttpResponse.error()),

  categoriesFailure: http.get('*/api/v1/categories', () =>
    problemResponse(
      503,
      'SERVICE_UNAVAILABLE',
      'Service temporarily unavailable',
      'Try again shortly'
    )
  ),

  emptyList: http.get('*/api/v1/events', () =>
    HttpResponse.json(
      { items: [], nextCursor: null, hasNext: false },
      { headers: CORRELATION_HEADER }
    )
  ),

  emptyMap: http.get('*/api/v1/events/map', () =>
    HttpResponse.json(
      { items: [], nextCursor: null, hasNext: false },
      { headers: CORRELATION_HEADER }
    )
  ),
}

/** 503 on the first call, success afterwards (PRD 17.3). */
export function flakyListHandler() {
  let calls = 0
  return http.get('*/api/v1/events', () => {
    calls += 1
    if (calls === 1) {
      return problemResponse(
        503,
        'SERVICE_UNAVAILABLE',
        'Service temporarily unavailable',
        'The service cannot complete the request at this time'
      )
    }
    return HttpResponse.json(listPageOne, { headers: CORRELATION_HEADER })
  })
}
