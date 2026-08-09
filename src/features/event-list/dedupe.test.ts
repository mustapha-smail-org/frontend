import { describe, expect, it } from 'vitest'

import { dedupeById } from './dedupe'

describe('dedupeById', () => {
  it('keeps the first occurrence and preserves backend order', () => {
    const result = dedupeById([{ id: 'a' }, { id: 'b' }, { id: 'a' }, { id: 'c' }])
    expect(result.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('keeps the earlier object identity when an id repeats', () => {
    const first = { id: 'a', page: 1 }
    const later = { id: 'a', page: 2 }
    expect(dedupeById([first, later])[0]).toBe(first)
  })

  it('handles an empty list', () => {
    expect(dedupeById([])).toEqual([])
  })
})
