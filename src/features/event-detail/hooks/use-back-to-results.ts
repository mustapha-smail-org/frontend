import { useLocation } from 'react-router-dom'

/**
 * PRD 5.3 / FR-DETAIL-002: "Back to results" prefers the discovery URL stashed
 * in router location state when the user arrived from a card, and falls back to
 * `/` for a directly opened or shared link.
 */
export function useBackToResults(): { to: string; isRestoredSearch: boolean } {
  const location = useLocation()
  const state = location.state as { from?: unknown } | null
  const from = state?.from

  // Only same-origin, root-relative paths are trusted; never a `//host` value.
  if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')) {
    return { to: from, isRestoredSearch: from !== '/' }
  }

  return { to: '/', isRestoredSearch: false }
}
