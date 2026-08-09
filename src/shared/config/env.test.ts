import { describe, expect, it } from 'vitest'

import { resolveConfig } from './env'

const VALID = {
  VITE_API_BASE_URL: 'https://gateway.example.org',
  VITE_MAP_TILE_URL: 'https://tiles.example.org/{z}/{x}/{y}.png',
  VITE_MAP_ATTRIBUTION: '© Example',
}

describe('resolveConfig', () => {
  it('accepts a complete configuration', () => {
    const { config, error } = resolveConfig(VALID, true)
    expect(error).toBeNull()
    expect(config.apiBaseUrl).toBe('https://gateway.example.org')
  })

  it('strips a trailing slash from the base URL', () => {
    expect(
      resolveConfig({ ...VALID, VITE_API_BASE_URL: 'https://x.org/' }, true).config.apiBaseUrl
    ).toBe('https://x.org')
  })

  it('treats "/" as same-origin', () => {
    expect(resolveConfig({ ...VALID, VITE_API_BASE_URL: '/' }, false).config.apiBaseUrl).toBe('')
  })

  it('allows an empty base URL outside production', () => {
    expect(resolveConfig({ ...VALID, VITE_API_BASE_URL: '' }, false).error).toBeNull()
  })

  it('requires an explicit base URL in production', () => {
    const { error } = resolveConfig({ ...VALID, VITE_API_BASE_URL: '' }, true)
    expect(error?.missing).toContain('VITE_API_BASE_URL')
  })

  it('rejects a tile URL missing its placeholders', () => {
    const { error, config } = resolveConfig(
      { ...VALID, VITE_MAP_TILE_URL: 'https://x/tiles.png' },
      false
    )
    expect(error?.missing).toContain('VITE_MAP_TILE_URL')
    // A safe fallback is still produced so the app can start.
    expect(config.mapTileUrl).toContain('{z}')
  })

  it('requires attribution', () => {
    const { error } = resolveConfig({ ...VALID, VITE_MAP_ATTRIBUTION: '  ' }, false)
    expect(error?.missing).toContain('VITE_MAP_ATTRIBUTION')
  })

  it('produces a developer-readable message', () => {
    const { error } = resolveConfig({}, true)
    expect(error?.message).toContain('.env.example')
    expect(error?.message).toContain('VITE_API_BASE_URL')
  })
})
