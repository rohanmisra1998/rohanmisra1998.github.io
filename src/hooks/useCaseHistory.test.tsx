import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { portfolioContent } from '../content/portfolio-content'
import { useCaseHistory } from './useCaseHistory'

function HistoryHarness() {
  const { activeCase, openCase, closeCase, dismissCaseForHandoff } = useCaseHistory(
    portfolioContent.work
  )

  return (
    <div>
      <output aria-label="Active case">{activeCase?.slug ?? 'none'}</output>
      <button type="button" onClick={(event) => openCase('trail-pulse', event.currentTarget)}>
        Open valid
      </button>
      <button type="button" onClick={(event) => openCase('not-approved', event.currentTarget)}>
        Open invalid
      </button>
      <button type="button" onClick={closeCase}>Close</button>
      <button
        type="button"
        onClick={() => dismissCaseForHandoff(() => document.body.setAttribute('data-handoff', 'ready'))}
      >
        Handoff
      </button>
    </div>
  )
}

beforeEach(() => {
  history.replaceState(null, '', '/')
  document.body.removeAttribute('data-handoff')
})

afterEach(() => {
  cleanup()
  history.replaceState(null, '', '/')
  vi.restoreAllMocks()
})

describe('useCaseHistory', () => {
  it('parses a directly loaded valid query and replaces it on close', async () => {
    history.replaceState(null, '', '/?case=trail-pulse')
    const back = vi.spyOn(history, 'back')
    const user = userEvent.setup()

    render(<HistoryHarness />)
    expect(screen.getByLabelText('Active case')).toHaveTextContent('trail-pulse')

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(back).not.toHaveBeenCalled()
    expect(location.pathname).toBe('/')
    expect(location.search).toBe('')
    expect(screen.getByLabelText('Active case')).toHaveTextContent('none')
  })

  it('removes an invalid query immediately and rejects an invalid open request', async () => {
    history.replaceState(null, '', '/?case=private-client-name')
    const user = userEvent.setup()

    render(<HistoryHarness />)

    expect(location.search).toBe('')
    expect(screen.getByLabelText('Active case')).toHaveTextContent('none')
    await user.click(screen.getByRole('button', { name: 'Open invalid' }))
    expect(location.search).toBe('')
    expect(screen.getByLabelText('Active case')).toHaveTextContent('none')
  })

  it('pushes an approved query and Back closes it without leaving the page', async () => {
    const user = userEvent.setup()
    render(<HistoryHarness />)

    await user.click(screen.getByRole('button', { name: 'Open valid' }))
    expect(location.search).toBe('?case=trail-pulse')
    expect(history.state).toEqual({ portfolioCase: 'trail-pulse' })

    history.back()
    await waitFor(() => expect(screen.getByLabelText('Active case')).toHaveTextContent('none'))
    expect(location.pathname).toBe('/')
  })

  it('replaces the query and invokes a handoff callback only after the case closes', async () => {
    const user = userEvent.setup()
    render(<HistoryHarness />)
    await user.click(screen.getByRole('button', { name: 'Open valid' }))

    await user.click(screen.getByRole('button', { name: 'Handoff' }))

    expect(location.search).toBe('')
    expect(screen.getByLabelText('Active case')).toHaveTextContent('none')
    expect(document.body).toHaveAttribute('data-handoff', 'ready')
  })
})
