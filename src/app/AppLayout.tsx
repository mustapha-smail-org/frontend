import { Outlet } from 'react-router-dom'

import { AppHeader } from '@/app/AppHeader'
import { OfflineBanner } from '@/shared/components/OfflineBanner'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      {/*
        WCAG 2.2 SC 2.4.1. Hidden until it receives keyboard focus — see the
        `.skip-link` utility in src/styles/globals.css.
      */}
      <a href="#main-content" className="skip-link">
        Skip to results
      </a>
      <AppHeader />
      <OfflineBanner />
      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
