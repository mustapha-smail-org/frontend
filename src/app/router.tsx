import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/app/AppLayout'
import { DetailSkeleton } from '@/features/event-detail/components/DetailSkeleton'
import { DiscoveryPage } from '@/pages/DiscoveryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// PRD 14.2 / FR-DETAIL-001: the detail route ships in its own chunk.
const EventDetailPage = lazy(() =>
  import('@/pages/EventDetailPage').then((module) => ({ default: module.EventDetailPage }))
)

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DiscoveryPage />} />
        <Route
          path="events/:eventId"
          element={
            <Suspense fallback={<DetailSkeleton />}>
              <EventDetailPage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
