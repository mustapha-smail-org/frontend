/**
 * External URL safety (PRD 11.4).
 * Backend-supplied links are parsed and protocol-checked before they can ever
 * become an interactive control. Anything unsafe is simply omitted.
 */

const ALLOWED_PROTOCOLS = new Set(['https:', 'http:'])

export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null

  const trimmed = value.trim()
  if (trimmed === '') return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null

  return url.toString()
}

/**
 * Provider-neutral "Open in Maps" link (PRD FR-DETAIL-003).
 * Prefers exact coordinates, otherwise falls back to a complete-enough address.
 * Returns null when neither is usable, so no dead control is rendered.
 */
export function buildMapSearchUrl(input: {
  latitude?: number | null
  longitude?: number | null
  addressParts?: Array<string | null | undefined>
}): string | null {
  const { latitude, longitude, addressParts } = input

  if (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  ) {
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`
  }

  const address = (addressParts ?? [])
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part !== '')
    .join(', ')

  if (address === '') return null

  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`
}
