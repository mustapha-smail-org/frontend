import { useEffect, useState } from 'react'

/** PRD FR-FILTER-005: text search commits 350 ms after the last keystroke. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (Object.is(debounced, value)) return undefined

    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs, debounced])

  return debounced
}
