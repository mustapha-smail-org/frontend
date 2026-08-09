/**
 * Date formatting (PRD FR-LIST-003).
 *
 * All output is rendered in Europe/Paris via `Intl.DateTimeFormat`. Offsets are
 * never added or subtracted by hand, so DST transitions are handled by the
 * platform. A missing timestamp is never replaced with a guess.
 */

export const PARIS_TIME_ZONE = 'Europe/Paris'
const LOCALE = 'en-GB'

function formatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: PARIS_TIME_ZONE, ...options })
}

const dayMonth = formatter({ day: 'numeric', month: 'short' })
const dayMonthYear = formatter({ day: 'numeric', month: 'short', year: 'numeric' })
const weekdayDayMonth = formatter({ weekday: 'short', day: 'numeric', month: 'short' })
const fullDate = formatter({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const timeOnly = formatter({ hour: '2-digit', minute: '2-digit', hour12: false })

export function parseInstant(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Calendar day in Paris, as `YYYY-MM-DD`, used for same-day comparisons. */
export function parisDayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  return parts
}

function isSameParisDay(a: Date, b: Date): boolean {
  return parisDayKey(a) === parisDayKey(b)
}

function isSameParisYear(a: Date, b: Date): boolean {
  return parisDayKey(a).slice(0, 4) === parisDayKey(b).slice(0, 4)
}

export interface DateRangeLabel {
  /** Concise label for scanning, e.g. "Today, 20:30" or "Sat 12 Sep, 14:00 – 18:00". */
  label: string
  /** Verbose, unambiguous label for screen readers and `title`. */
  accessibleLabel: string
  /** `datetime` attribute value, or null when there is nothing to anchor to. */
  machineValue: string | null
}

export const MISSING_DATE_LABEL = 'Date not provided'

/**
 * Builds a human label for a start/end pair.
 *
 * @param now Injected so tests can pin "today"/"tomorrow" deterministically.
 */
export function formatEventDateRange(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  now: Date = new Date()
): DateRangeLabel {
  const start = parseInstant(startAt)
  const end = parseInstant(endAt)

  if (!start) {
    if (!end) {
      return {
        label: MISSING_DATE_LABEL,
        accessibleLabel: MISSING_DATE_LABEL,
        machineValue: null,
      }
    }
    return {
      label: `Until ${weekdayDayMonth.format(end)}, ${timeOnly.format(end)}`,
      accessibleLabel: `Until ${fullDate.format(end)} at ${timeOnly.format(end)} Paris time`,
      machineValue: end.toISOString(),
    }
  }

  const dayLabel = relativeDayLabel(start, now)
  const startTime = timeOnly.format(start)
  const accessibleStart = `${fullDate.format(start)} at ${startTime} Paris time`

  if (!end || end.getTime() <= start.getTime()) {
    return {
      label: `${dayLabel}, ${startTime}`,
      accessibleLabel: accessibleStart,
      machineValue: start.toISOString(),
    }
  }

  if (isSameParisDay(start, end)) {
    return {
      label: `${dayLabel}, ${startTime} – ${timeOnly.format(end)}`,
      accessibleLabel: `${accessibleStart}, until ${timeOnly.format(end)}`,
      machineValue: start.toISOString(),
    }
  }

  const endLabel = isSameParisYear(start, end) ? dayMonth.format(end) : dayMonthYear.format(end)

  return {
    label: `${dayLabel}, ${startTime} → ${endLabel}`,
    accessibleLabel: `${accessibleStart}, until ${fullDate.format(end)} at ${timeOnly.format(end)}`,
    machineValue: start.toISOString(),
  }
}

function relativeDayLabel(date: Date, now: Date): string {
  if (isSameParisDay(date, now)) return 'Today'

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  if (isSameParisDay(date, tomorrow)) return 'Tomorrow'

  return isSameParisYear(date, now) ? weekdayDayMonth.format(date) : dayMonthYear.format(date)
}

/** Long, unambiguous single-instant label used on the detail page. */
export function formatFullDateTime(value: string | null | undefined): string | null {
  const date = parseInstant(value)
  if (!date) return null
  return `${fullDate.format(date)}, ${timeOnly.format(date)}`
}

export function formatTime(value: string | null | undefined): string | null {
  const date = parseInstant(value)
  return date ? timeOnly.format(date) : null
}

export function formatOccurrence(
  start: string | null,
  end: string | null
): { label: string; machineValue: string | null } {
  const startDate = parseInstant(start)
  const endDate = parseInstant(end)

  if (!startDate) {
    return endDate
      ? {
          label: `Ends ${fullDate.format(endDate)}, ${timeOnly.format(endDate)}`,
          machineValue: endDate.toISOString(),
        }
      : { label: MISSING_DATE_LABEL, machineValue: null }
  }

  const base = `${fullDate.format(startDate)}, ${timeOnly.format(startDate)}`

  if (!endDate || endDate.getTime() <= startDate.getTime()) {
    return { label: base, machineValue: startDate.toISOString() }
  }

  if (isSameParisDay(startDate, endDate)) {
    return { label: `${base} – ${timeOnly.format(endDate)}`, machineValue: startDate.toISOString() }
  }

  return {
    label: `${base} → ${fullDate.format(endDate)}, ${timeOnly.format(endDate)}`,
    machineValue: startDate.toISOString(),
  }
}
