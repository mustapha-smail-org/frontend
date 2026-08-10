/**
 * "Open in Maps" link construction (PRD FR-DETAIL-003).
 *
 * The provider is a variable, not a hardcoded choice: set
 * `VITE_MAP_LINK_PROVIDER` to `google` (default), `apple`, `openstreetmap` or
 * `bing`. Callers may also override per call site.
 *
 * Coordinates are preferred over the address because they are unambiguous; the
 * address is a fallback. When neither is usable the function returns null so
 * the caller can omit the action rather than render a dead control.
 */

import { config, DEFAULT_MAP_LINK_PROVIDER, type MapLinkProvider } from '@/shared/config/env'

export interface MapTarget {
  latitude?: number | null
  longitude?: number | null
  /** Ordered address fragments; blanks are dropped. */
  addressParts?: Array<string | null | undefined>
  /** Venue name, used as the pin label where the provider supports one. */
  label?: string | null
}

const PROVIDER_NAMES: Record<MapLinkProvider, string> = {
  google: 'Google Maps',
  apple: 'Apple Maps',
  openstreetmap: 'OpenStreetMap',
  bing: 'Bing Maps',
}

export function mapProviderName(provider: MapLinkProvider = config.mapLinkProvider): string {
  return PROVIDER_NAMES[provider] ?? PROVIDER_NAMES[DEFAULT_MAP_LINK_PROVIDER]
}

function hasValidCoordinates(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

function joinAddress(parts: Array<string | null | undefined> | undefined): string {
  return (parts ?? [])
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part !== '')
    .join(', ')
}

function byCoordinates(
  provider: MapLinkProvider,
  latitude: number,
  longitude: number,
  label: string
): string {
  const pair = `${latitude},${longitude}`

  switch (provider) {
    case 'google':
      // `search/?api=1` is the documented, platform-neutral entry point: it
      // opens the native app on mobile and the web map on desktop.
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pair)}`
    case 'apple':
      return label === ''
        ? `https://maps.apple.com/?ll=${encodeURIComponent(pair)}&q=${encodeURIComponent(pair)}`
        : `https://maps.apple.com/?ll=${encodeURIComponent(pair)}&q=${encodeURIComponent(label)}`
    case 'bing':
      return `https://www.bing.com/maps?cp=${encodeURIComponent(
        `${latitude}~${longitude}`
      )}&lvl=17&sp=${encodeURIComponent(`point.${latitude}_${longitude}_${label || 'Event'}`)}`
    case 'openstreetmap':
      return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`
  }
}

function byAddress(provider: MapLinkProvider, address: string): string {
  const query = encodeURIComponent(address)

  switch (provider) {
    case 'google':
      return `https://www.google.com/maps/search/?api=1&query=${query}`
    case 'apple':
      return `https://maps.apple.com/?q=${query}`
    case 'bing':
      return `https://www.bing.com/maps?q=${query}`
    case 'openstreetmap':
      return `https://www.openstreetmap.org/search?query=${query}`
  }
}

export function buildMapSearchUrl(
  target: MapTarget,
  provider: MapLinkProvider = config.mapLinkProvider
): string | null {
  const { latitude, longitude, addressParts, label } = target

  if (hasValidCoordinates(latitude, longitude)) {
    return byCoordinates(provider, latitude as number, longitude as number, (label ?? '').trim())
  }

  const address = joinAddress(addressParts)
  if (address === '') return null

  return byAddress(provider, address)
}
