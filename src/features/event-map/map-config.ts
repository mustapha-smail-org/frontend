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
  attribution: config.mapAttribution,
} as const
