import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

beforeEach(() => {
  history.replaceState(null, '', '/')
})

afterEach(() => {
  cleanup()
  history.replaceState(null, '', '/')
  document.body.style.overflow = ''
  document.getElementById('page-shell')?.removeAttribute('inert')
  document.getElementById('page-shell')?.removeAttribute('aria-hidden')
})

describe('usePortfolioLayers integration', () => {
  it('owns a directly queried case and returns to none on Escape', async () => {
    history.replaceState({ portfolioCase: 'trail-pulse' }, '', '/?case=trail-pulse')
    render(<App />)

    expect(screen.getByRole('dialog', { name: 'Trail Pulse' })).toBeVisible()
    expect(screen.queryByRole('dialog', { name: 'Ask Rohan AI' })).not.toBeInTheDocument()
    await waitFor(() => expect(document.querySelector('.ask-rohan-launcher')).toBeInTheDocument())

    await userEvent.setup().keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('keeps ordinary case Escape focus restoration when no handoff occurs', async () => {
    const user = userEvent.setup()
    render(<App />)
    const trigger = screen.getByRole('button', { name: /Open case study: Trail Pulse/i })

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
