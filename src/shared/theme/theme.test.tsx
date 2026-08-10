import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'
import { readStoredTheme, resolveTheme, THEME_STORAGE_KEY } from './theme'

/** Makes `prefers-color-scheme: dark` report the given value. */
function setSystemDark(isDark: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query.includes('prefers-color-scheme: dark') ? isDark : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList
  )
}

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  )
}

describe('theme storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults to following the system', () => {
    expect(readStoredTheme()).toBe('system')
  })

  it('ignores a corrupt stored value', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'chartreuse')
    expect(readStoredTheme()).toBe('system')
  })

  it('resolves system to the OS preference', () => {
    setSystemDark(true)
    expect(resolveTheme('system')).toBe('dark')
    setSystemDark(false)
    expect(resolveTheme('system')).toBe('light')
  })

  it('lets an explicit preference override the OS', () => {
    setSystemDark(true)
    expect(resolveTheme('light')).toBe('light')
  })
})

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
    setSystemDark(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.documentElement.classList.remove('dark')
  })

  it('is a switch with an accessible name', () => {
    renderToggle()
    const toggle = screen.getByTestId('theme-toggle')
    expect(toggle).toHaveRole('switch')
    expect(toggle).toHaveAccessibleName('Dark mode')
  })

  it('starts off when the system is light', () => {
    renderToggle()
    expect(screen.getByTestId('theme-toggle')).not.toBeChecked()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('starts on when the system is dark, with no stored preference', async () => {
    setSystemDark(true)
    renderToggle()

    await waitFor(() => expect(screen.getByTestId('theme-toggle')).toBeChecked())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    // Still following the OS: nothing has been pinned yet.
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('turns dark on and persists the choice', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByTestId('theme-toggle'))

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
    expect(screen.getByTestId('theme-toggle')).toBeChecked()
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('turns dark off again', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderToggle()

    await waitFor(() => expect(screen.getByTestId('theme-toggle')).toBeChecked())

    await user.click(screen.getByTestId('theme-toggle'))

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('lets an explicit light choice override a dark OS', async () => {
    const user = userEvent.setup()
    setSystemDark(true)
    renderToggle()

    await waitFor(() => expect(screen.getByTestId('theme-toggle')).toBeChecked())
    await user.click(screen.getByTestId('theme-toggle'))

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('restores the saved preference on a later visit', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderToggle()

    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true))
    expect(screen.getByTestId('theme-toggle')).toBeChecked()
  })

  it('is operable by keyboard', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.tab()
    expect(screen.getByTestId('theme-toggle')).toHaveFocus()

    await user.keyboard(' ')
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true))
  })

  it('survives blocked localStorage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByTestId('theme-toggle'))

    // The theme still applies even though it could not be persisted.
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true))
    setItem.mockRestore()
  })
})
