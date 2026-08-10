import { ExternalLink, Globe, Map as MapIcon, Ticket } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { EventDetail } from '@/shared/api/types'
import { buildMapSearchUrl, mapProviderName } from '@/shared/utils/map-links'
import { safeExternalUrl } from '@/shared/utils/safe-url'

/**
 * PRD FR-DETAIL-003.
 * Every action is derived from a validated URL; an unavailable action is simply
 * not rendered, never rendered as an enabled-but-dead control.
 */
export function EventActions({ event }: { event: EventDetail }) {
  const bookingUrl = safeExternalUrl(event.pricing?.bookingUrl)
  const officialUrl = safeExternalUrl(event.officialUrl)

  const bookingLabelSource = event.pricing?.bookingLinkText?.trim()
  const bookingLabel =
    bookingLabelSource && bookingLabelSource.length > 0 && bookingLabelSource.length <= 40
      ? bookingLabelSource
      : 'Book'

  const mapsUrl = buildMapSearchUrl({
    latitude: event.location?.latitude ?? null,
    longitude: event.location?.longitude ?? null,
    addressParts: [
      event.location?.name,
      event.location?.street,
      event.location?.zipcode,
      event.location?.city,
    ],
    label: event.location?.name ?? event.title,
  })

  if (!bookingUrl && !officialUrl && !mapsUrl) return null

  return (
    <div className="flex flex-wrap gap-2">
      {bookingUrl ? (
        <Button asChild className="h-11">
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
            <Ticket aria-hidden="true" className="size-4" />
            {bookingLabel}
            <ExternalLink aria-hidden="true" className="size-3.5 opacity-70" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      ) : null}

      {officialUrl ? (
        <Button asChild variant="outline" className="h-11">
          <a href={officialUrl} target="_blank" rel="noopener noreferrer">
            <Globe aria-hidden="true" className="size-4" />
            Official website
            <ExternalLink aria-hidden="true" className="size-3.5 opacity-70" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      ) : null}

      {mapsUrl ? (
        <Button asChild variant="outline" className="h-11">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" data-testid="open-in-maps">
            <MapIcon aria-hidden="true" className="size-4" />
            {/* Names the destination so the user knows where they are going. */}
            Open in {mapProviderName()}
            <ExternalLink aria-hidden="true" className="size-3.5 opacity-70" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      ) : null}
    </div>
  )
}
