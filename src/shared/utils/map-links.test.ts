import { describe, expect, it } from 'vitest'

import { DEFAULT_MAP_LINK_PROVIDER, MAP_LINK_PROVIDERS } from '@/shared/config/env'

import { buildMapSearchUrl, mapProviderName } from './map-links'

const BATACLAN = { latitude: 48.8631, longitude: 2.3708, label: 'Le Bataclan' }
const ADDRESS = {
  latitude: null,
  longitude: null,
  addressParts: ['Le Bataclan', '50 Boulevard Voltaire', '75011', 'Paris'],
}

describe('buildMapSearchUrl', () => {
  it('defaults to Google Maps', () => {
    expect(DEFAULT_MAP_LINK_PROVIDER).toBe('google')
    const url = buildMapSearchUrl(BATACLAN)
    expect(url).toContain('google.com/maps')
    expect(url).toContain('48.8631%2C2.3708')
  })

  it('builds a coordinate link for every provider', () => {
    const urls = MAP_LINK_PROVIDERS.map((provider) => buildMapSearchUrl(BATACLAN, provider))
    expect(urls.every((url) => typeof url === 'string' && url.startsWith('https://'))).toBe(true)
    // Each provider must produce a distinct URL, or the switch is broken.
    expect(new Set(urls).size).toBe(MAP_LINK_PROVIDERS.length)
  })

  it("uses each provider's documented entry point", () => {
    expect(buildMapSearchUrl(BATACLAN, 'google')).toContain('google.com/maps/search/?api=1')
    expect(buildMapSearchUrl(BATACLAN, 'apple')).toContain('maps.apple.com/?ll=')
    expect(buildMapSearchUrl(BATACLAN, 'bing')).toContain('bing.com/maps')
    expect(buildMapSearchUrl(BATACLAN, 'openstreetmap')).toContain('openstreetmap.org/?mlat=')
  })

  it('passes the venue name as the pin label where supported', () => {
    expect(buildMapSearchUrl(BATACLAN, 'apple')).toContain(encodeURIComponent('Le Bataclan'))
  })

  it('falls back to the address when coordinates are missing', () => {
    for (const provider of MAP_LINK_PROVIDERS) {
      const url = buildMapSearchUrl(ADDRESS, provider)
      expect(url).toBeTruthy()
      expect(url).toContain('Bataclan')
      expect(url).toContain('75011')
    }
  })

  it('URL-encodes the address rather than interpolating it raw', () => {
    const url = buildMapSearchUrl({ addressParts: ['Café "Chez Moi" & Co', 'Paris'] }, 'google')
    expect(url).not.toContain('"')
    expect(url).not.toContain(' ')
    expect(url).toContain('%22')
  })

  it('prefers coordinates over the address', () => {
    const url = buildMapSearchUrl({ ...BATACLAN, addressParts: ['Somewhere else'] }, 'google')
    expect(url).toContain('48.8631')
    expect(url).not.toContain('Somewhere')
  })

  it('rejects out-of-range and non-finite coordinates, then falls through', () => {
    expect(buildMapSearchUrl({ latitude: 999, longitude: 2 })).toBeNull()
    expect(buildMapSearchUrl({ latitude: Number.NaN, longitude: 2 })).toBeNull()
    expect(buildMapSearchUrl({ latitude: 48, longitude: 181 })).toBeNull()
    // With an address available it degrades instead of returning null.
    expect(buildMapSearchUrl({ latitude: 999, longitude: 2, addressParts: ['Paris'] })).toContain(
      'Paris'
    )
  })

  it('returns null when nothing is usable, so no dead control is rendered', () => {
    expect(buildMapSearchUrl({})).toBeNull()
    expect(buildMapSearchUrl({ addressParts: [null, '  ', undefined] })).toBeNull()
  })
})

describe('mapProviderName', () => {
  it('names every provider', () => {
    expect(mapProviderName('google')).toBe('Google Maps')
    expect(mapProviderName('apple')).toBe('Apple Maps')
    expect(mapProviderName('openstreetmap')).toBe('OpenStreetMap')
    expect(mapProviderName('bing')).toBe('Bing Maps')
  })

  it('defaults to the configured provider', () => {
    expect(mapProviderName()).toBe('Google Maps')
  })
})
