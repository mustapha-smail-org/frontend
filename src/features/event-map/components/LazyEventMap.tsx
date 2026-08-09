import { lazy, Suspense } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

import type { EventMapProps } from './EventMap'

/**
 * PRD FR-MOBILE-001 / 14.2: Leaflet, react-leaflet and the Leaflet stylesheet
 * are only fetched the first time the map is actually shown, so the list-first
 * discovery load never pays for them.
 */
const EventMap = lazy(() => import('./EventMap'))

function MapSkeleton() {
  return (
    <div className="bg-muted/50 relative h-full w-full overflow-hidden" data-testid="map-skeleton">
      <Skeleton className="h-full w-full rounded-none" />
      <p className="text-muted-foreground absolute inset-0 grid place-items-center text-sm">
        Loading map…
      </p>
    </div>
  )
}

export function LazyEventMap(props: EventMapProps) {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <EventMap {...props} />
    </Suspense>
  )
}
