import { describe, expect, it } from 'vitest'

import {
  arrondissementBadgeLabel,
  arrondissementLabel,
  ordinal,
  PRICING_BADGE_VARIANT,
  pricingCategoryLabel,
  pricingFilterLabel,
} from './labels'

describe('ordinal', () => {
  it('uses the correct English suffixes', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(4)).toBe('4th')
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
    expect(ordinal(13)).toBe('13th')
    expect(ordinal(20)).toBe('20th')
  })
})

describe('arrondissementLabel', () => {
  it('renders numeric values as ordinals', () => {
    expect(arrondissementLabel('1')).toBe('1st arrondissement')
    expect(arrondissementLabel('20')).toBe('20th arrondissement')
  })

  it('renders the non-numeric values in plain language', () => {
    expect(arrondissementLabel('OUTSIDE_PARIS')).toBe('Outside Paris')
    expect(arrondissementLabel('UNKNOWN')).toBe('Location unknown')
  })

  it('returns null for a missing badge value rather than a placeholder', () => {
    expect(arrondissementBadgeLabel(null)).toBeNull()
    expect(arrondissementBadgeLabel(11)).toBe('Paris 11th')
  })
})

describe('pricing labels', () => {
  it('never describes an unspecified price as free', () => {
    expect(pricingCategoryLabel('NOT_SPECIFIED')).toBe('Price not specified')
    expect(pricingFilterLabel('NOT_SPECIFIED')).toBe('Price not specified')
    expect(pricingCategoryLabel('NOT_SPECIFIED')).not.toMatch(/free/i)
  })

  it('maps each pricing category to a distinct badge variant', () => {
    const variants = Object.values(PRICING_BADGE_VARIANT)
    expect(new Set(variants).size).toBe(variants.length)
    expect(PRICING_BADGE_VARIANT.FREE).not.toBe(PRICING_BADGE_VARIANT.NOT_SPECIFIED)
  })
})
