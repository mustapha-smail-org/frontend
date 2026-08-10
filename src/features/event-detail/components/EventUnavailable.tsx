import { CalendarX2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

/**
 * PRD FR-DETAIL-008: a dedicated page for `404 EVENT_NOT_FOUND`.
 * There is no retry control here — a 404 is never retried automatically or
 * manually, because retrying cannot change the outcome.
 */
export function EventUnavailable({ backTo }: { backTo: string }) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 text-center sm:px-6">
      <CalendarX2 aria-hidden="true" className="text-muted-foreground mx-auto size-8" />
      <h1 className="route-focus mt-4 text-2xl font-semibold" tabIndex={-1}>
        Event unavailable
      </h1>
      <p className="text-muted-foreground mt-2">
        This event may have been removed from the catalogue, or the link may be incomplete or out of
        date.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild className="h-11">
          <Link to={backTo}>Back to results</Link>
        </Button>
        <Button asChild variant="outline" className="h-11">
          <Link to="/">Browse all events</Link>
        </Button>
      </div>
    </div>
  )
}
