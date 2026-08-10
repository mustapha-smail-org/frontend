import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { ThemeContext, type ThemeContextValue } from './theme-context'
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  systemTheme,
  type ResolvedTheme,
  type ThemePreference,
} from './theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredTheme())
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(readStoredTheme()))

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    storeTheme(next)
    const nextResolved = resolveTheme(next)
    setResolved(nextResolved)
    applyTheme(nextResolved)
  }, [])

  // Follow the OS while the preference is `system`.
  useEffect(() => {
    if (preference !== 'system') return undefined

    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = systemTheme()
      setResolved(next)
      applyTheme(next)
    }

    onChange()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [preference])

  // Reconcile with whatever the pre-paint boot script already applied.
  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
