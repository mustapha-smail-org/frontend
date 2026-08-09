import { describe, expect, it } from 'vitest'

import {
  buildSearchParams,
  getCategories,
  normaliseCursorPage,
  normaliseMarker,
  normaliseSummary,
  searchEvents,
  searchMapEvents,
} from './catalog-api'
import { ApiError } from './errors'
import type { EventFilters } from './types'
import { DEFAULT_FILTERS } from '@/features/event-search/search-params'
import { errorHandlers } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'

const filters = (overrides: Partial<EventFilters> = {}): EventFilters => ({
  ...DEFAULT_FILTERS,
  ...overrides,
})

describe('buildSearchParams', () => {
  it('always sends period, sort and limit', () => {
    const params = buildSearchParams(filters(), 20)
    expect(params.get('period')).toBe('THIS_WEEK')
    expect(params.get('sort')).toBe('START_DATE')
    expect(params.get('limit')).toBe('20')
  })

  it('omits pricing=ALL, null category, null arrondissement and empty query', () => {
    const params = buildSearchParams(filters(), 20)
    expect(params.has('pricing')).toBe(false)
    expect(params.has('category')).toBe(false)
    expect(params.has('arrondissement')).toBe(false)
    expect(params.has('query')).toBe(false)
    expect(params.has('cursor')).toBe(false)
  })

  it('sends every meaningful filter', () => {
    const params = buildSearchParams(
      filters({ category: 'Concert', pricing: 'FREE', arrondissement: '11', query: '  jazz  ' }),
      100
    )
    expect(params.get('category')).toBe('Concert')
    expect(params.get('pricing')).toBe('FREE')
    expect(params.get('arrondissement')).toBe('11')
    expect(params.get('query')).toBe('jazz')
    expect(params.get('limit')).toBe('100')
  })

  it('caps the query at 200 characters', () => {
    const params = buildSearchParams(filters({ query: 'a'.repeat(400) }), 20)
    expect(params.get('query')).toHaveLength(200)
  })

  it('passes the cursor through byte-for-byte', () => {
    const cursor = 'eyJzdGFydCI6IjIwMjYtMDktMTIifQ==|extra'
    const params = buildSearchParams(filters(), 20, cursor)
    expect(params.get('cursor')).toBe(cursor)
  })
})

describe('normaliseSummary', () => {
  it('accepts the runtime field names (`pricing`, `venue`)', () => {
    const summary = normaliseSummary({
      id: 'a',
      title: 'T',
      pricing: 'FREE',
      venue: 'Le Bataclan',
      categories: ['Concert'],
    })
    expect(summary?.pricingCategory).toBe('FREE')
    expect(summary?.venueName).toBe('Le Bataclan')
  })

  it('also accepts the PRD field names, so a backend rename is non-breaking', () => {
    const summary = normaliseSummary({
      id: 'a',
      title: 'T',
      pricingCategory: 'PAID',
      venueName: 'Olympia',
    })
    expect(summary?.pricingCategory).toBe('PAID')
    expect(summary?.venueName).toBe('Olympia')
  })

  it('treats an unrecognised pricing value as NOT_SPECIFIED, never FREE', () => {
    expect(normaliseSummary({ id: 'a', title: 'T', pricing: 'CHEAP' })?.pricingCategory).toBe(
      'NOT_SPECIFIED'
    )
    expect(normaliseSummary({ id: 'a', title: 'T' })?.pricingCategory).toBe('NOT_SPECIFIED')
  })

  it('drops an item with no id or title', () => {
    expect(normaliseSummary({ title: 'T' })).toBeNull()
    expect(normaliseSummary({ id: 'a' })).toBeNull()
  })

  it('coerces missing optional fields to null rather than undefined', () => {
    const summary = normaliseSummary({ id: 'a', title: 'T' })
    expect(summary).toMatchObject({
      summary: null,
      arrondissement: null,
      venueName: null,
      startAt: null,
      endAt: null,
      officialUrl: null,
      categories: [],
    })
  })
})

describe('normaliseMarker', () => {
  it('accepts valid coordinates', () => {
    expect(
      normaliseMarker({ id: 'a', title: 'T', latitude: 48.86, longitude: 2.35, pricing: 'FREE' })
    ).toMatchObject({ latitude: 48.86, longitude: 2.35 })
  })

  it('rejects null, non-finite and out-of-range coordinates', () => {
    expect(normaliseMarker({ id: 'a', title: 'T', latitude: null, longitude: null })).toBeNull()
    expect(normaliseMarker({ id: 'a', title: 'T', latitude: Number.NaN, longitude: 2 })).toBeNull()
    expect(normaliseMarker({ id: 'a', title: 'T', latitude: 91, longitude: 2 })).toBeNull()
    expect(normaliseMarker({ id: 'a', title: 'T', latitude: 48, longitude: 181 })).toBeNull()
    expect(normaliseMarker({ id: 'a', title: 'T', latitude: '48', longitude: '2' })).toBeNull()
  })
})

describe('normaliseCursorPage', () => {
  const identity = (wire: { id: string }) => wire

  it('throws a contract error when items is missing', () => {
    expect(() => normaliseCursorPage({ hasNext: false }, identity, 'test')).toThrow(ApiError)
  })

  it('ignores a cursor when hasNext is false', () => {
    const page = normaliseCursorPage(
      { items: [], nextCursor: 'x', hasNext: false },
      identity,
      'test'
    )
    expect(page.hasNext).toBe(false)
    expect(page.nextCursor).toBeNull()
  })

  it('stops pagination when hasNext is true but the cursor is blank', () => {
    const page = normaliseCursorPage(
      { items: [], nextCursor: '  ', hasNext: true },
      identity,
      'test'
    )
    expect(page.hasNext).toBe(false)
    expect(page.nextCursor).toBeNull()
  })

  it('keeps a valid cursor', () => {
    const page = normaliseCursorPage(
      { items: [], nextCursor: 'abc', hasNext: true },
      identity,
      'test'
    )
    expect(page).toMatchObject({ hasNext: true, nextCursor: 'abc' })
  })
})

describe('client functions against MSW', () => {
  it('loads the first list page', async () => {
    const page = await searchEvents(filters())
    expect(page.items).toHaveLength(3)
    expect(page.hasNext).toBe(true)
    expect(page.items[0]?.venueName).toBe('Le Bataclan')
  })

  it('loads the next list page with the returned cursor', async () => {
    const first = await searchEvents(filters())
    const second = await searchEvents(filters(), first.nextCursor)
    expect(second.hasNext).toBe(false)
    expect(second.items.map((item) => item.id)).toEqual(['evt-003', 'evt-004'])
  })

  it('never emits a marker for an item without coordinates', async () => {
    const page = await searchMapEvents(filters())
    expect(page.items.map((item) => item.id)).toEqual(['evt-001', 'evt-002'])
  })

  it('returns categories as a string array', async () => {
    await expect(getCategories()).resolves.toContain('Concert')
  })

  it('normalises a 400 VALIDATION_FAILED with violations', async () => {
    server.use(errorHandlers.listValidationFailed)
    await expect(searchEvents(filters())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
      correlationId: 'test-correlation-id',
      violations: [{ field: 'arrondissement', message: 'arrondissement must be 1-20' }],
    })
  })

  it('normalises a 500', async () => {
    server.use(errorHandlers.listServerError)
    await expect(searchEvents(filters())).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_ERROR',
    })
  })

  it('turns malformed JSON into a response-format error', async () => {
    server.use(errorHandlers.listMalformedJson)
    await expect(searchEvents(filters())).rejects.toMatchObject({
      kind: 'parse',
      code: 'RESPONSE_FORMAT_ERROR',
      correlationId: 'test-correlation-id',
    })
  })

  it('treats a missing items array as a contract failure, not an empty page', async () => {
    server.use(errorHandlers.listMissingItems)
    await expect(searchEvents(filters())).rejects.toMatchObject({ kind: 'contract' })
  })

  it('turns a transport failure into a network error', async () => {
    server.use(errorHandlers.listNetworkError)
    await expect(searchEvents(filters())).rejects.toMatchObject({ kind: 'network', status: 0 })
  })

  it('propagates an abort without surfacing an ApiError', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(searchEvents(filters(), null, controller.signal)).rejects.toMatchObject({
      name: 'RequestAbortedError',
    })
  })
})
