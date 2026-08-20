import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

class ControllableMediaQueryList extends EventTarget {
  matches = false
  readonly media = '(prefers-color-scheme: dark)'
  onchange: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null = null
  activeChangeListeners = 0

  override addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean
  ) {
    super.addEventListener(type, callback, options)
    if (type === 'change' && callback) this.activeChangeListeners += 1
  }

  override removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ) {
    super.removeEventListener(type, callback, options)
    if (type === 'change' && callback) this.activeChangeListeners -= 1
  }

  setMatches(matches: boolean) {
    this.matches = matches
    const event = new Event('change')
    Object.defineProperty(event, 'matches', { value: matches })
    this.dispatchEvent(event)
  }
}

function installSystemThemeQuery(initialMatches = false) {
  const query = new ControllableMediaQueryList()
  query.matches = initialMatches
  vi.stubGlobal('matchMedia', () => query as unknown as MediaQueryList)
  return query
}

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
})

afterEach(() => {
  cleanup()
  delete document.documentElement.dataset.theme
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

it('cycles system, light, and dark themes with an accessible label', async () => {
  installSystemThemeQuery()
  const user = userEvent.setup()
  render(<ThemeToggle />)
  const toggle = screen.getByRole('button', { name: 'Theme: system' })
  await user.click(toggle)
  expect(toggle).toHaveAccessibleName('Theme: light')
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  await user.click(toggle)
  expect(toggle).toHaveAccessibleName('Theme: dark')
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
})

it('treats an invalid stored value as system theme', () => {
  localStorage.setItem('rohan-theme', 'sepia')
  installSystemThemeQuery(true)

  render(<ThemeToggle />)

  expect(screen.getByRole('button', { name: 'Theme: system' })).toBeVisible()
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
})

it('follows system media changes while system theme is selected', () => {
  const query = installSystemThemeQuery()
  render(<ThemeToggle />)

  query.setMatches(true)
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  query.setMatches(false)
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
})

it('stops following system changes after an explicit selection', async () => {
  const query = installSystemThemeQuery()
  const user = userEvent.setup()
  render(<ThemeToggle />)

  await user.click(screen.getByRole('button', { name: 'Theme: system' }))
  expect(query.activeChangeListeners).toBe(0)

  query.setMatches(true)
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
})

it('removes the system listener on unmount', () => {
  const query = installSystemThemeQuery()
  const { unmount } = render(<ThemeToggle />)
  expect(query.activeChangeListeners).toBe(1)

  unmount()
  expect(query.activeChangeListeners).toBe(0)

  query.setMatches(true)
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
})
