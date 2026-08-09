import { CalendarDays, MapPin } from 'lucide-react'
import { forwardRef, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EventSummary } from '@/shared/api/types'
import { formatEventDateRange } from '@/shared/formatters/date'
import {
  arrondissementBadgeLabel,
  PRICING_BADGE_VARIANT,
  pricingCategoryLabel,
} from '@/shared/formatters/labels'
import { getCategoryAccent } from '@/shared/utils/category-accent'

/** Categories beyond this are summarised so cards stay scannable. */
const MAX_VISIBLE_CATEGORIES = 2

interface EventCardProps {
  event: EventSummary
  /** True when this card's event is the currently selected map marker. */
  isSelected?: boolean
  onHoverChange?: (eventId: string | null) => void
  onSelect?: (eventId: string) => void
}

/**
 * PRD FR-LIST-002. No image placeholders are invented — the API has no image
 * field — so hierarchy comes from typography, spacing and restrained accents.
 * The whole card is a link (PRD 13.2: navigation is a link, not a click handler).
 */
export const EventCard = forwardRef<HTMLLIElement, EventCardProps>(function EventCard(
  { event, isSelected = false, onHoverChange, onSelect },
  ref
) {
  const location = useLocation()
  const dates = useMemo(() => formatEventDateRange(event.startAt, event.endAt), [event])
  const arrondissement = arrondissementBadgeLabel(event.arrondissement)
  const visibleCategories = event.categories.slice(0, MAX_VISIBLE_CATEGORIES)
  const hiddenCategoryCount = event.categories.length - visibleCategories.length

  return (
    <li
      ref={ref}
      data-event-id={event.id}
      data-selected={isSelected || undefined}
      onMouseEnter={() => onHoverChange?.(event.id)}
      onMouseLeave={() => onHoverChange?.(null)}
      onFocus={() => onHoverChange?.(event.id)}
      onBlur={() => onHoverChange?.(null)}
      className={cn(
        'group bg-card border-border relative rounded-xl border transition-[border-color,box-shadow] duration-150',
        'hover:border-primary/35 hover:shadow-[0_2px_14px_-6px_var(--primary)]',
        'focus-within:border-primary/50',
        isSelected && 'border-primary ring-primary/25 ring-2'
      )}
    >
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleCategories.map((category) => (
            <Badge
              key={category}
              variant="category"
              style={getCategoryAccent(category).style}
              className="max-w-[11rem] truncate"
            >
              {category}
            </Badge>
          ))}
          {hiddenCategoryCount > 0 ? (
            <Badge variant="outline" title={event.categories.join(', ')}>
              +{hiddenCategoryCount}
            </Badge>
          ) : null}

          <Badge
            variant={PRICING_BADGE_VARIANT[event.pricingCategory]}
            className="ml-auto shrink-0"
          >
            {pricingCategoryLabel(event.pricingCategory)}
          </Badge>
        </div>

        <h3 className="mt-2.5 text-base leading-snug font-semibold">
          <Link
            to={`/events/${encodeURIComponent(event.id)}`}
            // Carry the current discovery URL so "Back to results" restores it.
            state={{ from: `${location.pathname}${location.search}` }}
            onClick={() => onSelect?.(event.id)}
            className="after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none"
          >
            <span className="line-clamp-2">{event.title}</span>
          </Link>
        </h3>

        {event.summary ? (
          <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">{event.summary}</p>
        ) : null}

        <dl className="text-muted-foreground mt-3 space-y-1 text-sm">
          <div className="flex items-start gap-2">
            <dt className="mt-0.5">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              <span className="sr-only">When</span>
            </dt>
            <dd className="min-w-0">
              {dates.machineValue ? (
                <time dateTime={dates.machineValue} title={dates.accessibleLabel}>
                  <span aria-hidden="true">{dates.label}</span>
                  <span className="sr-only">{dates.accessibleLabel}</span>
                </time>
              ) : (
                <span className="italic">{dates.label}</span>
              )}
            </dd>
          </div>

          {event.venueName || arrondissement ? (
            <div className="flex items-start gap-2">
              <dt className="mt-0.5">
                <MapPin aria-hidden="true" className="size-3.5" />
                <span className="sr-only">Where</span>
              </dt>
              <dd className="min-w-0 truncate">
                {[event.venueName, arrondissement].filter(Boolean).join(' · ')}
              </dd>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <dt className="mt-0.5">
                <MapPin aria-hidden="true" className="size-3.5" />
                <span className="sr-only">Where</span>
              </dt>
              <dd className="italic">Location not provided</dd>
            </div>
          )}
        </dl>
      </div>
    </li>
  )
})
