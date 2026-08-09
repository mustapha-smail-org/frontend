import { ArrowRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import type { EventMapMarker } from '@/shared/api/types'
import { formatEventDateRange } from '@/shared/formatters/date'
import { PRICING_BADGE_VARIANT, pricingCategoryLabel } from '@/shared/formatters/labels'
import { getCategoryAccent } from '@/shared/utils/category-accent'

/**
 * PRD FR-MAP-004. Everything shown here also exists in the list (PRD 13.5), so
 * the popup is a shortcut, never the only route to an event.
 */
export function MarkerPopup({ marker }: { marker: EventMapMarker }) {
  const location = useLocation()
  const dates = formatEventDateRange(marker.startAt, null)

  return (
    <div className="p-3">
      <div className="flex flex-wrap items-center gap-1.5 pr-5">
        {marker.category ? (
          <Badge
            variant="category"
            style={getCategoryAccent(marker.category).style}
            className="max-w-[9rem] truncate"
          >
            {marker.category}
          </Badge>
        ) : null}
        <Badge variant={PRICING_BADGE_VARIANT[marker.pricingCategory]}>
          {pricingCategoryLabel(marker.pricingCategory)}
        </Badge>
      </div>

      <h3 className="text-foreground mt-2 text-sm leading-snug font-semibold">{marker.title}</h3>

      <p className="text-muted-foreground mt-1 text-xs">
        {dates.machineValue ? (
          <time dateTime={dates.machineValue}>{dates.label}</time>
        ) : (
          <span className="italic">{dates.label}</span>
        )}
      </p>

      <Link
        to={`/events/${encodeURIComponent(marker.id)}`}
        state={{ from: `${location.pathname}${location.search}` }}
        className="text-primary mt-2.5 inline-flex items-center gap-1 text-sm font-medium hover:underline"
      >
        View details
        <ArrowRight aria-hidden="true" className="size-3.5" />
      </Link>
    </div>
  )
}
