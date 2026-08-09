import { describe, expect, it } from 'vitest'

import {
  formatEventDateRange,
  formatFullDateTime,
  formatOccurrence,
  MISSING_DATE_LABEL,
} from './date'

// A fixed "now" so Today/Tomorrow labelling is deterministic.
const NOW = new Date('2026-09-12T09:00:00+02:00')

describe('formatEventDateRange', () => {
  it('labels the current Paris day as Today', () => {
    const result = formatEventDateRange('2026-09-12T20:30:00+02:00', null, NOW)
    expect(result.label).toBe('Today, 20:30')
    expect(result.accessibleLabel).toContain('12 September 2026')
    expect(result.accessibleLabel).toContain('Saturday')
    expect(result.accessibleLabel).toContain('Paris time')
  })

  it('labels the next Paris day as Tomorrow', () => {
    expect(formatEventDateRange('2026-09-13T21:00:00+02:00', null, NOW).label).toBe(
      'Tomorrow, 21:00'
    )
  })

  it('shows a start-to-end time range within one day', () => {
    expect(
      formatEventDateRange('2026-09-12T20:30:00+02:00', '2026-09-12T23:00:00+02:00', NOW).label
    ).toBe('Today, 20:30 – 23:00')
  })

  it('shows an end date when the event spans days', () => {
    const result = formatEventDateRange(
      '2026-09-12T20:30:00+02:00',
      '2026-09-15T10:00:00+02:00',
      NOW
    )
    expect(result.label).toBe('Today, 20:30 → 15 Sept')
  })

  it('states missing dates rather than inventing one', () => {
    const result = formatEventDateRange(null, null, NOW)
    expect(result.label).toBe(MISSING_DATE_LABEL)
    expect(result.machineValue).toBeNull()
  })

  it('handles an end without a start', () => {
    const result = formatEventDateRange(null, '2026-09-20T18:00:00+02:00', NOW)
    expect(result.label).toContain('Until')
    expect(result.machineValue).not.toBeNull()
  })

  it('ignores an end that is not after the start', () => {
    expect(
      formatEventDateRange('2026-09-12T20:30:00+02:00', '2026-09-12T20:30:00+02:00', NOW).label
    ).toBe('Today, 20:30')
  })

  it('rejects an unparseable timestamp instead of throwing', () => {
    expect(formatEventDateRange('not-a-date', null, NOW).label).toBe(MISSING_DATE_LABEL)
  })

  describe('daylight saving transitions', () => {
    // Paris moves CEST (+02:00) -> CET (+01:00) at 03:00 local on 25 Oct 2026.
    it('renders the pre-transition local time correctly', () => {
      // 00:30Z on the changeover day is still 02:30 CEST.
      expect(formatFullDateTime('2026-10-25T00:30:00Z')).toContain('02:30')
    })

    it('renders the post-transition local time correctly', () => {
      // 01:30Z is 02:30 again, this time CET — the platform resolves the offset.
      expect(formatFullDateTime('2026-10-25T01:30:00Z')).toContain('02:30')
    })

    it('renders a winter instant in CET', () => {
      expect(formatFullDateTime('2026-12-01T12:00:00Z')).toContain('13:00')
    })

    it('renders a summer instant in CEST', () => {
      expect(formatFullDateTime('2026-07-01T12:00:00Z')).toContain('14:00')
    })

    it('honours the offset supplied by the API rather than the local clock', () => {
      // Same instant expressed two ways must render identically.
      expect(formatFullDateTime('2026-09-12T20:30:00+02:00')).toBe(
        formatFullDateTime('2026-09-12T18:30:00Z')
      )
    })
  })
})

describe('formatOccurrence', () => {
  it('formats a same-day occurrence as a time range', () => {
    const result = formatOccurrence('2026-09-12T20:30:00+02:00', '2026-09-12T23:00:00+02:00')
    expect(result.label).toContain('20:30 – 23:00')
    expect(result.machineValue).not.toBeNull()
  })

  it('formats a multi-day occurrence with both dates', () => {
    const result = formatOccurrence('2026-09-12T20:30:00+02:00', '2026-09-14T02:00:00+02:00')
    expect(result.label).toContain('→')
  })

  it('reports a missing occurrence date honestly', () => {
    expect(formatOccurrence(null, null).label).toBe(MISSING_DATE_LABEL)
  })
})

describe('formatFullDateTime', () => {
  it('returns null rather than a placeholder for missing input', () => {
    expect(formatFullDateTime(null)).toBeNull()
    expect(formatFullDateTime('')).toBeNull()
    expect(formatFullDateTime('garbage')).toBeNull()
  })
})
