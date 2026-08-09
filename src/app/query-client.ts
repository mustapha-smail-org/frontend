import { QueryClient } from '@tanstack/react-query'

import { isApiError } from '@/shared/api/errors'
import { RequestAbortedError } from '@/shared/api/client'

/** PRD 8.6: capped exponential backoff. */
const RETRY_DELAY = (attempt: number) => Math.min(1000 * 2 ** attempt, 8000)

/**
 * Retry only what could plausibly succeed on a second attempt.
 * 400/404 and other deterministic client errors are never retried.
 */
export function shouldRetry(failureCount: number, error: unknown, maxRetries = 2): boolean {
  if (error instanceof RequestAbortedError) return false
  if (failureCount >= maxRetries) return false
  if (!isApiError(error)) return false
  return error.kind === 'network' || error.status === 503
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => shouldRetry(failureCount, error),
        retryDelay: RETRY_DELAY,
        refetchOnWindowFocus: false,
        // An aborted request is not a user-visible failure (PRD 8.7).
        throwOnError: false,
      },
    },
  })
}
