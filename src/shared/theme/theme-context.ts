import { createContext } from 'react'

import type { ResolvedTheme, ThemePreference } from './theme'

export interface ThemeContextValue {
  /** What the user chose: light, dark, or follow the OS. */
  preference: ThemePreference
  /** What is actually rendered right now. */
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

// Kept in its own module so ThemeProvider.tsx exports only a component and
// stays Fast Refresh friendly.
export const ThemeContext = createContext<ThemeContextValue | null>(null)
