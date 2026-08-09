import { lazy, Suspense } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

const MiniMapCanvas = lazy(() => import('./MiniMapCanvas'))

interface DetailMiniMapProps {
  latitude: number
  longitude: number
  title: string
}

/** PRD FR-DETAIL-002 item 11 — only rendered when coordinates are valid. */
export function DetailMiniMap(props: DetailMiniMapProps) {
  return (
    <Suspense fallback={<Skeleton className="h-56 w-full rounded-xl" />}>
      <MiniMapCanvas {...props} />
    </Suspense>
  )
}
