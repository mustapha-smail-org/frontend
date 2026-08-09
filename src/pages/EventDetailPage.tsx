import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { AccessibilityPanel } from '@/features/event-detail/components/AccessibilityPanel'
import { DetailMiniMap } from '@/features/event-detail/components/DetailMiniMap'
import { DetailSkeleton } from '@/features/event-detail/components/DetailSkeleton'
import { EventActions } from '@/features/event-detail/components/EventActions'
import { EventUnavailable } from '@/features/event-detail/components/EventUnavailable'
import { OccurrenceList } from '@/features/event-detail/components/OccurrenceList'
import { PlainTextBlock } from '@/features/event-detail/components/PlainTextBlock'
import { PricingPanel } from '@/features/event-detail/components/PricingPanel'
import { useBackToResults } from '@/features/event-detail/hooks/use-back-to-results'
import { useEventDetail } from '@/features/event-detail/hooks/use-event-detail'
import { isNotFound } from '@/shared/api/errors'
import { ErrorState } from '@/shared/components/ErrorState'
import { formatEventDateRange, formatFullDateTime } from '@/shared/formatters/date'
import { arrondissementBadgeLabel } from '@/shared/formatters/labels'
import { useDocumentMetadata } from '@/shared/hooks/use-document-metadata'
import { getCategoryAccent } from '@/shared/utils/category-accent'

function hasValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): latitude is number {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  )
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { to: backTo, isRestoredSearch } = useBackToResults()
  const { data: event, isPending, isError, error, refetch } = useEventDetail(eventId)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useDocumentMetadata({
    title: event?.title ?? null,
    description: event?.description ?? null,
    canonicalPath: eventId ? `/events/${encodeURIComponent(eventId)}` : null,
  })

  // PRD 13.1: a route change moves focus to the new page heading.
  useEffect(() => {
    if (event) headingRef.current?.focus()
  }, [event])

  if (isPending) return <DetailSkeleton />

  if (isError) {
    if (isNotFound(error)) return <EventUnavailable backTo={backTo} />

    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <ErrorState
          error={error}
          onRetry={() => void refetch()}
          title="Could not load this event"
        />
        <Link to={backTo} className="text-primary mt-4 inline-block text-sm hover:underline">
          Back to results
        </Link>
      </div>
    )
  }

  const dates = formatEventDateRange(event.startAt, event.endAt)
  const exactStart = formatFullDateTime(event.startAt)
  const exactEnd = formatFullDateTime(event.endAt)
  const location = event.location
  const addressLine = [location?.street, location?.zipcode, location?.city]
    .filter((part) => part && part.trim() !== '')
    .join(', ')
  const arrondissement = arrondissementBadgeLabel(location?.arrondissement ?? null)
  const showMiniMap = hasValidCoordinates(location?.latitude, location?.longitude)

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <Link
        to={backTo}
        className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center gap-1.5 text-sm"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {isRestoredSearch ? 'Back to results' : 'Back to discovery'}
      </Link>

      <header className="mt-2">
        {event.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {event.categories.map((category) => (
              <Badge key={category} variant="category" style={getCategoryAccent(category).style}>
                {category}
              </Badge>
            ))}
          </div>
        ) : null}

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-3 text-2xl leading-tight font-semibold sm:text-3xl"
        >
          {event.title}
        </h1>
      </header>

      <section aria-label="Key details" className="mt-5 space-y-3.5">
        <div className="flex items-start gap-2.5">
          <CalendarDays aria-hidden="true" className="text-muted-foreground mt-1 size-4 shrink-0" />
          <div className="min-w-0">
            {dates.machineValue ? (
              <p>
                <time dateTime={dates.machineValue} className="font-medium">
                  {exactStart ?? dates.label}
                </time>
                {exactEnd && exactEnd !== exactStart ? (
                  <span className="text-muted-foreground"> — until {exactEnd}</span>
                ) : null}
              </p>
            ) : (
              <p className="text-muted-foreground italic">Date not provided</p>
            )}
            <p className="text-muted-foreground text-xs">Times shown in Paris time.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <MapPin aria-hidden="true" className="text-muted-foreground mt-1 size-4 shrink-0" />
          <div className="min-w-0">
            {location?.name ? <p className="font-medium">{location.name}</p> : null}
            {addressLine !== '' ? (
              <p className="text-muted-foreground text-sm">{addressLine}</p>
            ) : null}
            {arrondissement ? (
              <p className="text-muted-foreground text-sm">{arrondissement}</p>
            ) : null}
            {!location?.name && addressLine === '' && !arrondissement ? (
              <p className="text-muted-foreground text-sm italic">Location not provided</p>
            ) : null}
          </div>
        </div>

        <PricingPanel pricing={event.pricing} />
      </section>

      <div className="mt-6">
        <EventActions event={event} />
      </div>

      {event.description ? (
        <section aria-labelledby="description-heading" className="border-border mt-8 border-t pt-6">
          <h2 id="description-heading" className="text-lg font-semibold">
            About this event
          </h2>
          <PlainTextBlock
            text={event.description}
            className="text-foreground/90 mt-3 text-[0.95rem]"
          />
        </section>
      ) : null}

      <div className="mt-8 space-y-8">
        <OccurrenceList occurrences={event.occurrences} />

        <AccessibilityPanel accessibility={event.accessibility} />

        {showMiniMap && location ? (
          <section aria-labelledby="location-heading" className="border-border border-t pt-6">
            <h2 id="location-heading" className="text-lg font-semibold">
              Where it is
            </h2>
            <div className="mt-3">
              <DetailMiniMap
                latitude={location.latitude as number}
                longitude={location.longitude as number}
                title={event.title}
              />
            </div>
          </section>
        ) : null}
      </div>
    </article>
  )
}
