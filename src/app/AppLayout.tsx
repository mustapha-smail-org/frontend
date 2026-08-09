import { Outlet } from 'react-router-dom'

import { AppHeader } from '@/app/AppHeader'
import { OfflineBanner } from '@/shared/components/OfflineBanner'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only-focusable bg-primary text-primary-foreground absolute top-2 left-2 z-50 rounded-md px-3 py-2 text-sm font-medium"
      >
        Skip to content
      </a>
      <AppHeader />
      <OfflineBanner />
      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
