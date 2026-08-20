import { useEffect, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'

const key = 'rohan-theme'
const order: Theme[] = ['system', 'light', 'dark']
const darkModeQuery = '(prefers-color-scheme: dark)'

function isTheme(value: string | null): value is Theme {
  return value !== null && order.includes(value as Theme)
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'

  try {
    const storedTheme = window.localStorage.getItem(key)
    return isTheme(storedTheme) ? storedTheme : 'system'
  } catch {
    return 'system'
  }
}

export function resolveTheme(theme: Theme, prefersDark: boolean) {
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    const mediaQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia(darkModeQuery)
      : null

    const applyTheme = (prefersDark: boolean) => {
      document.documentElement.dataset.theme = resolveTheme(theme, prefersDark)
    }

    applyTheme(mediaQuery?.matches ?? false)

    if (theme !== 'system' || !mediaQuery) return

    const handleSystemThemeChange = (event: MediaQueryListEvent) => applyTheme(event.matches)
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [theme])

  const cycleTheme = () => {
    const nextTheme = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(nextTheme)

    try {
      window.localStorage.setItem(key, nextTheme)
    } catch {
      // The visible selection still works when storage is unavailable.
    }
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={`Theme: ${theme}`}
      title={`Theme: ${theme}`}
      onClick={cycleTheme}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
      </svg>
    </button>
  )
}
