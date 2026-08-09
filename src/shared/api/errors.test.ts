import { describe, expect, it } from 'vitest'

import {
  isInvalidCursor,
  isNotFound,
  isRetriableError,
  isValidationFailure,
  networkError,
  normaliseProblemDetail,
} from './errors'

describe('normaliseProblemDetail', () => {
  it('reads top-level Spring extension properties', () => {
    const error = normaliseProblemDetail(
      404,
      {
        type: 'https://api.citypulse.dev/problems/event-not-found',
        title: 'Event not found',
        status: 404,
        detail: 'Event evt-x was not found',
        code: 'EVENT_NOT_FOUND',
        correlationId: 'abc-123',
      },
      'header-id'
    )

    expect(error.status).toBe(404)
    expect(error.code).toBe('EVENT_NOT_FOUND')
    expect(error.title).toBe('Event not found')
    // Payload correlation ID wins over the header (PRD 9.10).
    expect(error.correlationId).toBe('abc-123')
  })

  it('reads extensions nested under `properties`', () => {
    const error = normaliseProblemDetail(
      400,
      {
        title: 'Validation failed',
        detail: 'One or more request values are invalid',
        properties: {
          code: 'VALIDATION_FAILED',
          correlationId: 'nested-id',
          violations: [{ field: 'arrondissement', message: 'must be 1-20' }],
        },
      },
      null
    )

    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.correlationId).toBe('nested-id')
    expect(error.violations).toEqual([{ field: 'arrondissement', message: 'must be 1-20' }])
  })

  it('falls back to the response header correlation ID', () => {
    const error = normaliseProblemDetail(500, { detail: 'boom' }, 'header-id')
    expect(error.correlationId).toBe('header-id')
  })

  it('survives a null or non-object body', () => {
    const error = normaliseProblemDetail(502, null, null)
    expect(error.status).toBe(502)
    expect(error.title).toBe('Request failed')
    expect(error.violations).toEqual([])
    expect(error.correlationId).toBeNull()
  })

  it('ignores malformed violation entries', () => {
    const error = normaliseProblemDetail(
      400,
      { violations: [null, 'nope', { field: 'query' }, { message: 'bad' }] },
      null
    )
    expect(error.violations).toEqual([
      { field: 'query', message: 'Invalid value' },
      { field: '', message: 'bad' },
    ])
  })

  it('never exposes a raw HTML error body as user copy', () => {
    const error = normaliseProblemDetail(500, null, null)
    expect(error.detail).not.toContain('<')
  })
})

describe('error predicates', () => {
  it('classifies a 404', () => {
    const error = normaliseProblemDetail(404, { code: 'EVENT_NOT_FOUND' }, null)
    expect(isNotFound(error)).toBe(true)
    expect(isRetriableError(error)).toBe(false)
  })

  it('classifies an invalid cursor', () => {
    const error = normaliseProblemDetail(400, { code: 'INVALID_CURSOR' }, null)
    expect(isInvalidCursor(error)).toBe(true)
    expect(isRetriableError(error)).toBe(false)
  })

  it('classifies a validation failure', () => {
    expect(
      isValidationFailure(normaliseProblemDetail(400, { code: 'VALIDATION_FAILED' }, null))
    ).toBe(true)
    expect(
      isValidationFailure(normaliseProblemDetail(400, { code: 'INVALID_PARAMETER' }, null))
    ).toBe(true)
  })

  it('treats 503 and network failures as retriable', () => {
    expect(isRetriableError(normaliseProblemDetail(503, {}, null))).toBe(true)
    expect(isRetriableError(networkError())).toBe(true)
    expect(isRetriableError(normaliseProblemDetail(500, {}, null))).toBe(false)
    expect(isRetriableError(new Error('unrelated'))).toBe(false)
  })
})
