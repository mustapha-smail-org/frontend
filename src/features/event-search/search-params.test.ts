import { describe, expect, it } from 'vitest'

import {
  countActiveFilters,
  DEFAULT_FILTERS,
  filtersKey,
  filtersToSearchString,
  isDefaultFilters,
  parseFilters,
  serialiseFilters,
} from './search-params'

const parse = (search: string) => parseFilters(new URLSearchParams(search))

describe('parseFilters', () => {
  it('returns defaults for an empty URL', () => {
    expect(parse('')).toEqual(DEFAULT_FILTERS)
  })

  it('reads every supported parameter', () => {
    expect(
      parse('period=TODAY&category=Concert&pricing=FREE&arrondissement=11&query=jazz')
    ).toEqual({
      period: 'TODAY',
      category: 'Concert',
      pricing: 'FREE',
      arrondissement: '11',
      query: 'jazz',
    })
  })

  it('falls back to the default for an invalid known value', () => {
    expect(parse('period=NEXT_YEAR').period).toBe('THIS_WEEK')
    expect(parse('pricing=CHEAP').pricing).toBe('ALL')
    expect(parse('arrondissement=42').arrondissement).toBeNull()
    expect(parse('arrondissement=0').arrondissement).toBeNull()
    expect(parse('arrondissement=01').arrondissement).toBeNull()
  })

  it('accepts the non-numeric arrondissement values', () => {
    expect(parse('arrondissement=OUTSIDE_PARIS').arrondissement).toBe('OUTSIDE_PARIS')
    expect(parse('arrondissement=unknown').arrondissement).toBe('UNKNOWN')
  })

  it('treats empty and whitespace-only values as absent', () => {
    expect(parse('query=%20%20&category=%20&arrondissement=')).toEqual(DEFAULT_FILTERS)
  })

  it('ignores unknown parameters', () => {
    expect(parse('cursor=abc&utm_source=x&selectedMarker=evt-1')).toEqual(DEFAULT_FILTERS)
  })

  it('preserves category case because it originates from the backend', () => {
    expect(parse('category=Arts%20de%20la%20rue').category).toBe('Arts de la rue')
  })

  it('caps the query at 200 characters', () => {
    const long = 'a'.repeat(250)
    expect(parse(`query=${long}`).query).toHaveLength(200)
  })

  it('is case-insensitive for enum parameters', () => {
    expect(parse('period=today&pricing=free').period).toBe('TODAY')
    expect(parse('period=today&pricing=free').pricing).toBe('FREE')
  })
})

describe('serialiseFilters', () => {
  it('omits every default so a default search is a bare path', () => {
    expect(filtersToSearchString(DEFAULT_FILTERS)).toBe('')
    expect(isDefaultFilters(DEFAULT_FILTERS)).toBe(true)
  })

  it('emits only the non-default filters', () => {
    const search = serialiseFilters({
      period: 'TODAY',
      category: 'Concert',
      pricing: 'ALL',
      arrondissement: null,
      query: '  jazz  ',
    })
    expect(search.get('period')).toBe('TODAY')
    expect(search.get('category')).toBe('Concert')
    expect(search.get('pricing')).toBeNull()
    expect(search.get('arrondissement')).toBeNull()
    expect(search.get('query')).toBe('jazz')
  })

  it('round-trips through parse without drift', () => {
    const filters = {
      period: 'THIS_MONTH' as const,
      category: 'Théâtre',
      pricing: 'NOT_SPECIFIED' as const,
      arrondissement: '20' as const,
      query: 'danse contemporaine',
    }
    expect(parseFilters(serialiseFilters(filters))).toEqual(filters)
  })

  it('never puts the cursor in the URL', () => {
    expect(serialiseFilters(DEFAULT_FILTERS).has('cursor')).toBe(false)
  })
})

describe('filtersKey', () => {
  it('is stable regardless of parameter order', () => {
    const a = parse('period=TODAY&category=Concert')
    const b = parse('category=Concert&period=TODAY')
    expect(filtersKey(a)).toBe(filtersKey(b))
  })

  it('changes when a filter changes', () => {
    expect(filtersKey(parse('period=TODAY'))).not.toBe(filtersKey(parse('period=TOMORROW')))
  })
})

describe('countActiveFilters', () => {
  it('counts only non-default filters', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0)
    expect(countActiveFilters(parse('period=TODAY&pricing=FREE&query=x'))).toBe(3)
    expect(countActiveFilters(parse('query=%20'))).toBe(0)
  })
})
