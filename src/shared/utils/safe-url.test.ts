import { describe, expect, it } from 'vitest'

import { buildMapSearchUrl, safeExternalUrl } from './safe-url'

describe('safeExternalUrl', () => {
  it('allows https and http', () => {
    expect(safeExternalUrl('https://example.org/a')).toBe('https://example.org/a')
    expect(safeExternalUrl('http://example.org/a')).toBe('http://example.org/a')
  })

  it('rejects dangerous protocols', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(safeExternalUrl('JavaScript:alert(1)')).toBeNull()
    expect(safeExternalUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull()
    expect(safeExternalUrl('vbscript:msgbox(1)')).toBeNull()
    expect(safeExternalUrl('file:///etc/passwd')).toBeNull()
  })

  it('rejects unparseable and empty values', () => {
    expect(safeExternalUrl('not a url')).toBeNull()
    expect(safeExternalUrl('/relative/path')).toBeNull()
    expect(safeExternalUrl('')).toBeNull()
    expect(safeExternalUrl('   ')).toBeNull()
    expect(safeExternalUrl(null)).toBeNull()
    expect(safeExternalUrl(undefined)).toBeNull()
  })
})

describe('buildMapSearchUrl', () => {
  it('prefers coordinates', () => {
    const url = buildMapSearchUrl({ latitude: 48.8631, longitude: 2.3708 })
    expect(url).toContain('mlat=48.8631')
    expect(url).toContain('mlon=2.3708')
  })

  it('falls back to the address when coordinates are missing', () => {
    const url = buildMapSearchUrl({
      latitude: null,
      longitude: null,
      addressParts: ['Le Bataclan', '50 Boulevard Voltaire', '75011', 'Paris'],
    })
    expect(url).toContain('search?query=')
    expect(url).toContain('Bataclan')
  })

  it('rejects out-of-range coordinates and falls through', () => {
    expect(buildMapSearchUrl({ latitude: 999, longitude: 2 })).toBeNull()
    expect(buildMapSearchUrl({ latitude: Number.NaN, longitude: 2 })).toBeNull()
  })

  it('returns null when there is nothing usable', () => {
    expect(buildMapSearchUrl({})).toBeNull()
    expect(buildMapSearchUrl({ addressParts: [null, '  ', undefined] })).toBeNull()
  })
})
