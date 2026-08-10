/**
 * Theme plumbing, kept free of React so it can also run from the inline boot
 * script in index.html (which must apply the theme before first paint).
 */

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'citypulse.theme'

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

/** Reads the stored preference; falls back to `system` when unset or blocked. */
export function readStoredTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    // Private browsing or a partitioned storage context.
    return 'system'
  }
}

export function storeTheme(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Persistence is best effort and never blocks the UI.
  }
}

export function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference
}

/** The single place that mutates the document. */
export function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.style.colorScheme = resolved
}
