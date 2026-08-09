import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useOnlineStatus } from '@/shared/hooks/use-online-status'

/**
 * PRD FR-GLOBAL-003: a non-blocking banner that leaves rendered data in place.
 * Retry appears once the browser reports connectivity again.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const queryClient = useQueryClient()
  const [wasOffline, setWasOffline] = useState(false)
  const dismissTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current)
      return undefined
    }

    if (!wasOffline) return undefined

    // Keep the "back online" affordance briefly so it is actually reachable.
    dismissTimer.current = window.setTimeout(() => setWasOffline(false), 12_000)
    return () => {
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current)
    }
  }, [isOnline, wasOffline])

  if (isOnline && !wasOffline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-banner"
      className={
        isOnline
          ? 'border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 sm:px-6'
          : 'bg-warning-subtle border-b border-amber-200 px-4 py-2 text-sm text-amber-950 sm:px-6'
      }
    >
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-1.5">
        <WifiOff aria-hidden="true" className="size-4 shrink-0" />
        <p className="min-w-0 flex-1">
          {isOnline
            ? 'You are back online. Results may be out of date.'
            : 'You are offline. Showing the events already loaded; new searches will not run.'}
        </p>
        {isOnline ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setWasOffline(false)
              void queryClient.invalidateQueries()
            }}
          >
            <RefreshCw aria-hidden="true" className="size-3.5" />
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  )
}
