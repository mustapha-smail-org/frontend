import { MapContainer, Marker, TileLayer } from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import { createMarkerIcon } from '@/features/event-map/components/marker-icon'
import {
  DARK_TILE_FILTER,
  hasDedicatedDarkTiles,
  MARKER_FOCUS_ZOOM,
  MAX_ZOOM,
  tileConfig,
  tileUrlFor,
} from '@/features/event-map/map-config'
import { useTheme } from '@/shared/theme/use-theme'

interface MiniMapCanvasProps {
  latitude: number
  longitude: number
  title: string
}

/**
 * A static, non-interactive locator map. Panning and zooming are disabled so it
 * never competes with page scrolling on touch devices, and the address text
 * above it remains the accessible source of truth (PRD 13.5).
 */
export default function MiniMapCanvas({ latitude, longitude, title }: MiniMapCanvasProps) {
  const { resolved: theme } = useTheme()
  const needsTileFilter = theme === 'dark' && !hasDedicatedDarkTiles

  return (
    <div
      className="border-border h-56 w-full overflow-hidden rounded-xl border"
      style={
        needsTileFilter
          ? ({ '--cp-tile-filter': DARK_TILE_FILTER } as React.CSSProperties)
          : undefined
      }
      aria-hidden="true"
      data-testid="detail-mini-map"
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={MARKER_FOCUS_ZOOM}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        attributionControl
        className="h-full w-full"
      >
        <TileLayer
          key={theme}
          url={tileUrlFor(theme)}
          attribution={tileConfig.attribution}
          maxZoom={MAX_ZOOM}
        />
        <Marker
          position={[latitude, longitude]}
          icon={createMarkerIcon('NOT_SPECIFIED', true)}
          title={title}
          interactive={false}
        />
      </MapContainer>
    </div>
  )
}
