import { describe, expect, it } from 'vitest'

import { getCategoryAccent, NEUTRAL_CATEGORY_ACCENT } from './category-accent'

describe('getCategoryAccent', () => {
  it('is deterministic for the same category', () => {
    expect(getCategoryAccent('Concert')).toEqual(getCategoryAccent('Concert'))
  })

  it('ignores case and surrounding whitespace', () => {
    expect(getCategoryAccent('  concert ')).toEqual(getCategoryAccent('Concert'))
  })

  it('falls back to neutral for missing input', () => {
    expect(getCategoryAccent(null)).toBe(NEUTRAL_CATEGORY_ACCENT)
    expect(getCategoryAccent('')).toBe(NEUTRAL_CATEGORY_ACCENT)
    expect(getCategoryAccent('   ')).toBe(NEUTRAL_CATEGORY_ACCENT)
  })

  it('only ever emits token references, never literal colours', () => {
    const { style } = getCategoryAccent('Théâtre')
    expect(style['--cp-accent']).toMatch(/^var\(--category-[a-f]\)$/)
    expect(style['--cp-accent-subtle']).toMatch(/^var\(--category-[a-f]-subtle\)$/)
  })
})
