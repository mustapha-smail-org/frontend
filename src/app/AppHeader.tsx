import { Link } from 'react-router-dom'

/**
 * PRD FR-GLOBAL-001: compact header, brand links home, product descriptor where
 * space permits. No authentication, profile, saved or notification controls.
 */
export function AppHeader() {
  return (
    <header className="bg-background/85 border-border sticky top-0 z-30 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className="group flex items-center gap-2.5 rounded-md focus-visible:outline-none"
          aria-label="CityPulse home"
        >
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-[9px]"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
              <path
                d="M3 13.5h3.4l1.9-5 2.8 9.5 2.6-7.2 1.6 2.7H21"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-[0.975rem] font-semibold tracking-tight">CityPulse</span>
        </Link>

        <span aria-hidden="true" className="bg-border hidden h-4 w-px sm:block" />
        <p className="text-muted-foreground hidden text-sm sm:block">Events in Paris</p>
      </div>
    </header>
  )
}
