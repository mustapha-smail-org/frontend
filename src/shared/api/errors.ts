/**
 * Problem Detail normalisation (PRD 9.9, 11.3, 18).
 *
 * The Catalog Service's `GlobalExceptionHandler` builds a Spring `ProblemDetail`
 * and attaches `code`, `timestamp`, `correlationId` and (for validation errors)
 * `violations` as TOP-LEVEL extension properties. Some Spring versions instead
 * nest extensions under a `properties` object, which is what the supplied
 * Swagger implies (API-GAP-008), so both shapes are accepted here.
 */

export type ApiErrorKind =
  | 'http' // The server answered with a non-2xx Problem Detail (or similar).
  | 'network' // The request never completed (offline, DNS, TLS, CORS).
  | 'parse' // 2xx but the body was not the JSON we expect.
  | 'contract' // 2xx, valid JSON, but the payload violates the documented contract.

export interface ApiViolation {
  field: string
  message: string
}

export interface ApiErrorShape {
  status: number
  code: string | null
  title: string
  detail: string
  correlationId: string | null
  violations: ApiViolation[]
  kind: ApiErrorKind
}

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number
  readonly code: string | null
  readonly title: string
  readonly detail: string
  readonly correlationId: string | null
  readonly violations: ApiViolation[]
  readonly kind: ApiErrorKind

  constructor(shape: ApiErrorShape) {
    super(shape.detail || shape.title)
    this.name = 'ApiError'
    this.status = shape.status
    this.code = shape.code
    this.title = shape.title
    this.detail = shape.detail
    this.correlationId = shape.correlationId
    this.violations = shape.violations
    this.kind = shape.kind
  }
}

export const CORRELATION_ID_HEADER = 'X-Correlation-ID'

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readViolations(source: Record<string, unknown>): ApiViolation[] {
  const raw = source.violations
  if (!Array.isArray(raw)) return []

  return raw.flatMap((entry) => {
    const record = asRecord(entry)
    if (!record) return []
    const field = asString(record.field)
    const message = asString(record.message)
    if (!field && !message) return []
    return [{ field: field ?? '', message: message ?? 'Invalid value' }]
  })
}

const DEFAULT_TITLES: Record<number, string> = {
  400: 'Invalid request',
  404: 'Not found',
  409: 'Data conflict',
  500: 'Something went wrong',
  503: 'Service temporarily unavailable',
}

function defaultTitle(status: number): string {
  return DEFAULT_TITLES[status] ?? 'Request failed'
}

/**
 * Turns any non-2xx payload into an {@link ApiError}. Never throws, and never
 * surfaces raw HTML bodies, stack traces or internal URLs (PRD 11.3).
 */
export function normaliseProblemDetail(
  status: number,
  body: unknown,
  headerCorrelationId: string | null
): ApiError {
  const root = asRecord(body)
  // Spring may nest extensions; prefer top-level, fall back to `properties`.
  const extensions = root ? (asRecord(root.properties) ?? {}) : {}
  const merged: Record<string, unknown> = { ...extensions, ...(root ?? {}) }

  const nestedCorrelation = asString(extensions.correlationId)
  const topCorrelation = asString(merged.correlationId)

  const violations = readViolations(merged).length
    ? readViolations(merged)
    : readViolations(extensions)

  return new ApiError({
    status,
    code: asString(merged.code) ?? asString(extensions.code),
    title: asString(merged.title) ?? defaultTitle(status),
    detail: asString(merged.detail) ?? defaultTitle(status),
    // PRD 9.10: prefer the payload correlation ID, fall back to the header.
    correlationId: topCorrelation ?? nestedCorrelation ?? headerCorrelationId,
    violations,
    kind: 'http',
  })
}

export function networkError(correlationId: string | null = null): ApiError {
  return new ApiError({
    status: 0,
    code: 'NETWORK_ERROR',
    title: 'Cannot reach CityPulse',
    detail: 'The request could not be sent. Check your connection and try again.',
    correlationId,
    violations: [],
    kind: 'network',
  })
}

export function parseError(status: number, correlationId: string | null): ApiError {
  return new ApiError({
    status,
    code: 'RESPONSE_FORMAT_ERROR',
    title: 'Unexpected response',
    detail: 'CityPulse received a response it could not read.',
    correlationId,
    violations: [],
    kind: 'parse',
  })
}

export function contractError(
  detail: string,
  status: number,
  correlationId: string | null
): ApiError {
  return new ApiError({
    status,
    code: 'CONTRACT_VIOLATION',
    title: 'Unexpected response',
    detail,
    correlationId,
    violations: [],
    kind: 'contract',
  })
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** True when retrying could plausibly succeed (PRD 8.6). */
export function isRetriableError(error: unknown): boolean {
  if (!isApiError(error)) return false
  return error.kind === 'network' || error.status === 503
}

export function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.status === 404
}

export function isInvalidCursor(error: unknown): boolean {
  return isApiError(error) && error.status === 400 && error.code === 'INVALID_CURSOR'
}

export function isValidationFailure(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.status === 400 &&
    (error.code === 'VALIDATION_FAILED' || error.code === 'INVALID_PARAMETER')
  )
}
