/**
 * The single place in the app allowed to call `fetch` (PRD 11.1).
 * Components consume feature hooks; hooks consume `catalog-api.ts`; that module
 * consumes this client.
 */

import { config } from '@/shared/config/env'
import { reportContractViolation } from '@/shared/observability/reporter'

import {
  CORRELATION_ID_HEADER,
  networkError,
  normaliseProblemDetail,
  parseError,
  type ApiError,
} from './errors'

export interface RequestOptions {
  signal?: AbortSignal
  searchParams?: URLSearchParams
}

/** Thrown by the caller's abort signal; must never reach the UI as an error. */
export class RequestAbortedError extends Error {
  constructor() {
    super('Request aborted')
    this.name = 'RequestAbortedError'
  }
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof RequestAbortedError) return true
  return error instanceof DOMException && error.name === 'AbortError'
}

function buildUrl(path: string, searchParams?: URLSearchParams): string {
  const query = searchParams?.toString()
  return `${config.apiBaseUrl}${path}${query ? `?${query}` : ''}`
}

function readCorrelationId(response: Response): string | null {
  return response.headers.get(CORRELATION_ID_HEADER)
}

/**
 * Performs a GET and returns parsed JSON, or throws an {@link ApiError}.
 *
 * - Aborts are rethrown as {@link RequestAbortedError} so TanStack Query can
 *   discard them silently instead of rendering an error state (PRD 8.7).
 * - Non-2xx bodies go through Problem Detail normalisation.
 * - `204` is a contract error for the current GET endpoints (PRD 11.3).
 */
export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response

  try {
    response = await fetch(buildUrl(path, options.searchParams), {
      method: 'GET',
      headers: { Accept: 'application/json, application/problem+json' },
      signal: options.signal ?? null,
      credentials: 'omit',
      mode: 'cors',
    })
  } catch (error) {
    if (isAbortError(error)) throw new RequestAbortedError()
    throw networkError()
  }

  const correlationId = readCorrelationId(response)

  if (!response.ok) {
    let body: unknown = null
    try {
      const text = await response.text()
      body = text ? JSON.parse(text) : null
    } catch {
      // A non-JSON error body (gateway HTML, proxy plain text) must never be
      // shown to the user; fall through with a null body.
      body = null
    }
    throw normaliseProblemDetail(response.status, body, correlationId)
  }

  if (response.status === 204) {
    reportContractViolation('Received 204 No Content for a GET that must return a body', { path })
    throw parseError(204, correlationId)
  }

  try {
    return (await response.json()) as T
  } catch {
    throw parseError(response.status, correlationId)
  }
}

export type { ApiError }
