import { describe, expect, it } from 'vitest'

import { safeExternalUrl } from './safe-url'

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
