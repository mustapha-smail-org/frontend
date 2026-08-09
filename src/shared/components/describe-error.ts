import { isApiError } from '@/shared/api/errors'

export interface ErrorPresentation {
  title: string
  detail: string
  correlationId: string | null
  retriable: boolean
}

/**
 * Maps a normalised `ApiError` to user-facing copy (PRD section 12).
 * Internal details never reach the surface; the correlation ID is surfaced only
 * inside a collapsed "technical details" disclosure (PRD 9.10).
 */
export function describeError(error: unknown): ErrorPresentation {
  if (!isApiError(error)) {
    return {
      title: 'Something went wrong',
      detail: 'CityPulse could not complete that action. Please try again.',
      correlationId: null,
      retriable: true,
    }
  }

  const correlationId = error.correlationId

  if (error.kind === 'network') {
    return {
      title: 'Cannot reach CityPulse',
      detail: 'Check your internet connection and try again.',
      correlationId,
      retriable: true,
    }
  }

  switch (error.status) {
    case 400:
      return {
        title: error.code === 'INVALID_CURSOR' ? 'This page of results expired' : 'Invalid search',
        detail:
          error.violations.length > 0
            ? `Some search values are not accepted: ${error.violations
                .map((violation) => violation.field)
                .filter(Boolean)
                .join(', ')}.`
            : 'One or more search values are not accepted. Try adjusting or clearing your filters.',
        correlationId,
        retriable: false,
      }
    case 503:
      return {
        title: 'CityPulse is temporarily unavailable',
        detail: 'The event service is not responding right now. This is usually brief.',
        correlationId,
        retriable: true,
      }
    default:
      return {
        title: 'Something went wrong',
        detail: 'CityPulse could not load these events. Please try again.',
        correlationId,
        retriable: true,
      }
  }
}
