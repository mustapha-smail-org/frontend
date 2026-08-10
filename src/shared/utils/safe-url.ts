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

// "Open in Maps" links moved to `./map-links.ts` when the provider became
// configurable; re-exported here so existing imports keep working.
export { buildMapSearchUrl, mapProviderName, type MapTarget } from './map-links'
