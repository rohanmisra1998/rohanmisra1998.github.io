import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('App', () => {
  it('renders the approved hero and semantic quick-scan navigation', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'I turn messy operations into scalable products and systems.'
    )
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('opens and closes the mobile navigation', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    )
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: 'Open navigation' })
    const navigation = document.getElementById('primary-navigation')
    expect(navigation).toHaveAttribute('hidden')
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(navigation).not.toHaveAttribute('hidden')
    await user.click(screen.getByRole('link', { name: 'Work' }))
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(navigation).toHaveAttribute('hidden')
  })

  it('keeps the Proofline decorative and the portrait descriptive', () => {
    render(<App />)
    expect(screen.getByTestId('proofline')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('img', { name: /Rohan Misra/i })).toBeInTheDocument()
  })
})
