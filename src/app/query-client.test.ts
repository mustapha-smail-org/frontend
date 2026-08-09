import { describe, expect, it } from 'vitest'

import { RequestAbortedError } from '@/shared/api/client'
import { networkError, normaliseProblemDetail } from '@/shared/api/errors'

import { shouldRetry } from './query-client'

describe('shouldRetry', () => {
  it('retries network failures up to the cap', () => {
    expect(shouldRetry(0, networkError())).toBe(true)
    expect(shouldRetry(1, networkError())).toBe(true)
    expect(shouldRetry(2, networkError())).toBe(false)
  })

  it('retries 503', () => {
    expect(shouldRetry(0, normaliseProblemDetail(503, {}, null))).toBe(true)
  })

  it('never retries deterministic client errors', () => {
    expect(shouldRetry(0, normaliseProblemDetail(400, {}, null))).toBe(false)
    expect(shouldRetry(0, normaliseProblemDetail(404, {}, null))).toBe(false)
    expect(shouldRetry(0, normaliseProblemDetail(500, {}, null))).toBe(false)
  })

  it('never retries an aborted request', () => {
    expect(shouldRetry(0, new RequestAbortedError())).toBe(false)
  })

  it('ignores non-API errors', () => {
    expect(shouldRetry(0, new Error('boom'))).toBe(false)
  })
})
