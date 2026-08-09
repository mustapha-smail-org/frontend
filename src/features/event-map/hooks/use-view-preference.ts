import { useCallback, useEffect, useState } from 'react'

export type DiscoveryView = 'list' | 'map'

const STORAGE_KEY = 'citypulse.discovery-view'

/**
 * PRD FR-MOBILE-001 / 8.3 / 15: the mobile view preference is the only thing
 * CityPulse persists, it is non-semantic, and it never affects a shared URL.
 */
export function useViewPreference(): [DiscoveryView, (next: DiscoveryView) => void] {
  const [view, setView] = useState<DiscoveryView>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'map' ? 'map' : 'list'
    } catch {
      // Private browsing or a blocked storage partition: default to List.
      return 'list'
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, view)
    } catch {
      // Persistence is best effort and never blocks the UI.
    }
  }, [view])

  return [view, useCallback((next: DiscoveryView) => setView(next), [])]
}
