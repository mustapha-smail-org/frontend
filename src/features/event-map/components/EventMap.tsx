import { Loader2, LocateFixed, Plus, Minus, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'

import 'leaflet/dist/leaflet.css'

import { Button } from '@/components/ui/button'
import type { EventMapMarker } from '@/shared/api/types'
import { describeError } from '@/shared/components/describe-error'

import {
  MARKER_FOCUS_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  PARIS_CENTER,
  PARIS_DEFAULT_ZOOM,
  tileConfig,
} from '../map-config'
import { createMarkerIcon } from './marker-icon'
import { MarkerPopup } from './MarkerPopup'

export interface EventMapProps {
  markers: EventMapMarker[]
  isInitialLoading: boolean
  isError: boolean
  error: unknown
  hasMore: boolean
  isLoadingMore: boolean
  nextPageError: unknown
  onLoadMore: () => void
  onRetry: () => void
  selectedEventId: string | null
  onSelect: (eventId: string | null) => void
  /** Event highlighted by list hover/focus — best effort (FR-MAP-004). */
  highlightedEventId: string | null
  /** True when the list returned results but none of them are mappable. */
  listHasResults: boolean
  onSwitchToList?: () => void
}

/** Imperative controls kept out of the render path. */
function MapControls({
  onRecenter,
  mapRef,
}: {
  onRecenter: () => void
  mapRef: React.MutableRefObject<LeafletMap | null>
}) {
  const map = useMap()

  useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])

  return (
    <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5">
      <div className="bg-card border-border overflow-hidden rounded-lg border shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          className="size-9 rounded-none"
          onClick={() => map.zoomIn()}
        >
          <Plus aria-hidden="true" className="size-4" />
        </Button>
        <div className="bg-border h-px" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Zoom out"
          className="size-9 rounded-none"
          onClick={() => map.zoomOut()}
        >
          <Minus aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Recentre on Paris"
        className="bg-card size-9 shadow-sm"
        onClick={onRecenter}
      >
        <LocateFixed aria-hidden="true" className="size-4" />
      </Button>
    </div>
  )
}

/** Pans to the selected marker without changing any filter (FR-MAP-003). */
function SelectionFocus({
  markers,
  selectedEventId,
}: {
  markers: EventMapMarker[]
  selectedEventId: string | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedEventId) return
    const marker = markers.find((candidate) => candidate.id === selectedEventId)
    if (!marker) return
    map.setView([marker.latitude, marker.longitude], Math.max(map.getZoom(), MARKER_FOCUS_ZOOM), {
      animate: true,
    })
  }, [map, markers, selectedEventId])

  return null
}

export function EventMap({
  markers,
  isInitialLoading,
  isError,
  error,
  hasMore,
  isLoadingMore,
  nextPageError,
  onLoadMore,
  onRetry,
  selectedEventId,
  onSelect,
  highlightedEventId,
  listHasResults,
  onSwitchToList,
}: EventMapProps) {
  const mapRef = useRef<LeafletMap | null>(null)
  const [tilesFailed, setTilesFailed] = useState(false)
  const tileErrorCount = useRef(0)

  const recenter = useCallback(() => {
    mapRef.current?.setView(PARIS_CENTER, PARIS_DEFAULT_ZOOM, { animate: true })
    onSelect(null)
  }, [onSelect])

  const icons = useMemo(
    () =>
      new Map(
        markers.map((marker) => [
          marker.id,
          createMarkerIcon(
            marker.pricingCategory,
            marker.id === selectedEventId || marker.id === highlightedEventId
          ),
        ])
      ),
    [markers, selectedEventId, highlightedEventId]
  )

  if (isError) {
    const presentation = describeError(error)
    return (
      <div
        role="alert"
        className="bg-muted/40 grid h-full place-items-center p-6 text-center"
        data-testid="map-error"
      >
        <div className="max-w-sm">
          <TriangleAlert aria-hidden="true" className="text-destructive mx-auto size-6" />
          <p className="mt-2 font-semibold">{presentation.title}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {presentation.detail} The event list is still available.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" variant="outline" onClick={onRetry}>
              Try again
            </Button>
            {onSwitchToList ? (
              <Button size="sm" variant="ghost" onClick={onSwitchToList}>
                Back to list
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={PARIS_CENTER}
        zoom={PARIS_DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        zoomControl={false}
        scrollWheelZoom
        className="h-full w-full"
        // The list is the accessible alternative (PRD 13.5); the canvas itself is
        // not a tab stop, so keyboard users are never trapped in it.
        keyboard={false}
      >
        <TileLayer
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={MAX_ZOOM}
          eventHandlers={{
            tileerror: () => {
              tileErrorCount.current += 1
              // A handful of missing tiles is normal; a sustained run is not.
              if (tileErrorCount.current > 8) setTilesFailed(true)
            },
            tileload: () => {
              tileErrorCount.current = 0
              if (tilesFailed) setTilesFailed(false)
            },
          }}
        />

        <MapControls onRecenter={recenter} mapRef={mapRef} />
        <SelectionFocus markers={markers} selectedEventId={selectedEventId} />

        {markers.map((marker) => {
          const icon = icons.get(marker.id)
          return (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              {...(icon ? { icon } : {})}
              eventHandlers={{
                click: () => onSelect(marker.id),
                popupclose: () => onSelect(null),
              }}
            >
              <Popup autoPan closeButton>
                <MarkerPopup marker={marker} />
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* --- Overlays ------------------------------------------------------ */}

      {isInitialLoading ? (
        <div
          className="bg-background/70 absolute inset-0 z-[600] grid place-items-center"
          data-testid="map-loading"
        >
          <p className="text-muted-foreground flex items-center gap-2 text-sm" role="status">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Loading map events…
          </p>
        </div>
      ) : null}

      {/* FR-MAP-008: tiles failed but marker data is fine. */}
      {tilesFailed ? (
        <div
          role="status"
          className="bg-card/95 border-border absolute top-3 left-3 z-[600] max-w-[16rem] rounded-lg border p-3 text-xs shadow-sm"
          data-testid="map-tile-error"
        >
          <p className="font-semibold">Map background unavailable</p>
          <p className="text-muted-foreground mt-1">
            Event locations are still plotted. The list view is unaffected.
          </p>
        </div>
      ) : null}

      {/* FR-MAP-008: mappable events genuinely do not exist for these filters. */}
      {!isInitialLoading && markers.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[550] grid place-items-center p-6">
          <div
            className="bg-card/95 border-border pointer-events-auto max-w-sm rounded-xl border p-4 text-center shadow-sm"
            data-testid="map-empty"
          >
            <p className="text-sm font-semibold">No events to plot</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {listHasResults
                ? 'The matching events do not have map coordinates. They are all in the list.'
                : 'No events match these filters yet. Try widening your search.'}
            </p>
            {onSwitchToList ? (
              <Button size="sm" variant="outline" className="mt-3" onClick={onSwitchToList}>
                Show the list
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* FR-MAP-002: markers only ever advance on an explicit action. */}
      {markers.length > 0 && (hasMore || nextPageError) ? (
        <div className="absolute bottom-6 left-1/2 z-[600] -translate-x-1/2">
          <div className="bg-card/95 border-border flex items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-3 shadow-md backdrop-blur">
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {markers.length} shown
            </span>
            <Button
              size="sm"
              variant={nextPageError ? 'destructive' : 'default'}
              className="h-8 rounded-full"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              data-testid="load-more-markers"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                  Loading…
                </>
              ) : nextPageError ? (
                'Retry loading markers'
              ) : (
                'Load more markers'
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Never claim the map is exhaustive (FR-MAP-002 / FR-SYNC-003). */}
      {markers.length > 0 && !hasMore ? (
        <p className="bg-card/90 border-border text-muted-foreground absolute bottom-6 left-1/2 z-[600] -translate-x-1/2 rounded-full border px-3 py-1 text-xs shadow-sm">
          Showing all {markers.length} mapped events for these filters
        </p>
      ) : null}
    </div>
  )
}

export default EventMap
