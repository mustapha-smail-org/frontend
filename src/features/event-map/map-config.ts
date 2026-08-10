import { config } from '@/shared/config/env'

/** PRD FR-MAP-003: Paris city-level default viewport. */
export const PARIS_CENTER: [number, number] = [48.8566, 2.3522]
export const PARIS_DEFAULT_ZOOM = 12
export const MARKER_FOCUS_ZOOM = 15

export const MIN_ZOOM = 10
export const MAX_ZOOM = 18

/**
 * Tile configuration is environment-driven (PRD FR-MAP-006). The public OSM
 * endpoint is a development convenience only, never a production CDN.
 */
export const tileConfig = {
  url: config.mapTileUrl,
  darkUrl: config.mapTileUrlDark,
  attribution: config.mapAttribution,
} as const

/** True when the deployment ships a genuinely separate dark tile set. */
export const hasDedicatedDarkTiles = config.mapTileUrlDark !== config.mapTileUrl

/**
 * When only one tile set is configured, dark mode dims and inverts it rather
 * than leaving a glaring white rectangle in a dark page. Consumed by the
 * `.dark .leaflet-tile-pane` rule in globals.css.
 */
export const DARK_TILE_FILTER = 'invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.9)'

export function tileUrlFor(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? tileConfig.darkUrl : tileConfig.url
}
