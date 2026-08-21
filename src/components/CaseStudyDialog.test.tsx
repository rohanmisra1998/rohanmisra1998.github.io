import { useLayoutEffect, useState } from 'react'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { portfolioContent } from '../content/portfolio-content'
import { useCaseHistory } from '../hooks/useCaseHistory'
import { CaseStudyDialog } from './CaseStudyDialog'

interface HandoffHarnessProps {
  exposeHandoff: (handoff: () => void) => void
}

function HandoffHarness({ exposeHandoff }: HandoffHarnessProps) {
  const [callbackCount, setCallbackCount] = useState(0)
  const [cleanupState, setCleanupState] = useState('pending')
  const { activeCase, openCase, closeCase, dismissCaseForHandoff } = useCaseHistory(
    portfolioContent.work
  )

  useLayoutEffect(() => {
    exposeHandoff(() => dismissCaseForHandoff(() => {
      const shell = document.getElementById('page-shell')
      setCleanupState([
        shell?.hasAttribute('inert') ?? false,
        shell?.getAttribute('aria-hidden') ?? 'none',
        document.body.style.overflow || 'unlocked'
      ].join('|'))
      setCallbackCount((count) => count + 1)
    }))
  }, [dismissCaseForHandoff, exposeHandoff])

  return (
    <>
      <div id="page-shell">
        <button
          type="button"
          onClick={(event) => openCase('buy-side-commercial-diligence', event.currentTarget)}
        >
          Open diligence
        </button>
        <output aria-label="Handoff callback count">{callbackCount}</output>
        <output aria-label="Handoff cleanup state">{cleanupState}</output>
      </div>
      {activeCase && (
        <CaseStudyDialog
          item={activeCase}
          onClose={closeCase}
          onOpenAssistant={() => {}}
        />
      )}
    </>
  )
}

beforeEach(() => {
  history.replaceState(null, '', '/')
})

afterEach(() => {
  cleanup()
  history.replaceState(null, '', '/')
  document.body.style.overflow = ''
  document.getElementById('page-shell')?.removeAttribute('inert')
  document.getElementById('page-shell')?.removeAttribute('aria-hidden')
  vi.restoreAllMocks()
})

describe('CaseStudyDialog', () => {
  it('portals outside the shell and leads with impact, ownership, and judgment', () => {
    const item = portfolioContent.work.find(({ slug }) => slug === 'omnichannel-payments-strategy')!
    render(
      <>
        <div id="page-shell">Portfolio shell</div>
        <CaseStudyDialog item={item} onClose={() => {}} onOpenAssistant={() => {}} />
      </>
    )

    const dialog = screen.getByRole('dialog', { name: 'Omnichannel payments growth strategy' })
    expect(document.getElementById('page-shell')).not.toContainElement(dialog)
    expect(document.body).toContainElement(dialog)
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription(item.thesis)

    const orderedCopy = [
      item.title,
      item.industry,
      item.scale,
      item.impactType,
      item.outcome,
      item.thesis,
      'My role',
      'Position',
      item.role.position,
      'Owned',
      item.role.owned,
      'Partnered with',
      item.role.partneredWith,
      'Key decision',
      item.keyDecision,
      'Challenge',
      item.challenge,
      'Approach',
      item.approach
    ]
    let lastPosition = -1
    for (const copy of orderedCopy) {
      const position = dialog.textContent!.indexOf(copy)
      expect(position).toBeGreaterThan(lastPosition)
      lastPosition = position
    }

    expect(dialog).not.toHaveTextContent('Capabilities')
    expect(dialog).not.toHaveTextContent('Evidence')
    expect(dialog.querySelector('figure')).not.toBeInTheDocument()
    expect(dialog.querySelector('[data-artifact-kind]')).not.toBeInTheDocument()
  })

  it('shows a complete My role block and key decision for every case', () => {
    for (const item of portfolioContent.work) {
      const { unmount } = render(
        <>
          <div id="page-shell">Portfolio shell</div>
          <CaseStudyDialog item={item} onClose={() => {}} onOpenAssistant={() => {}} />
        </>
      )

      const dialog = screen.getByRole('dialog', { name: item.title })
      const role = within(dialog).getByRole('region', { name: 'My role' })
      expect(role).toHaveTextContent(item.role.position)
      expect(role).toHaveTextContent(item.role.owned)
      expect(role).toHaveTextContent(item.role.partneredWith)
      expect(within(dialog).getByRole('region', { name: 'Key decision' }))
        .toHaveTextContent(item.keyDecision)
      expect(dialog.querySelector('figure')).not.toBeInTheDocument()
      expect(dialog.querySelector('[data-artifact-kind]')).not.toBeInTheDocument()
      expect(dialog).not.toHaveTextContent('Decision model')
      unmount()
    }
  })

  it('exposes the integrated assistant action for the current work', () => {
    const item = portfolioContent.work.find(
      ({ slug }) => slug === 'omnichannel-payments-strategy'
    )!
    render(
      <>
        <div id="page-shell">Portfolio shell</div>
        <CaseStudyDialog item={item} onClose={() => {}} onOpenAssistant={() => {}} />
      </>
    )

    expect(screen.getByRole('button', { name: 'Ask Rohan AI about this work' })).toBeVisible()
  })

  it('omits the assistant action when the case has no approved assistant topic', () => {
    const item = portfolioContent.work.find(
      ({ slug }) => slug === 'talent-acquisition-operating-model'
    )!
    render(
      <>
        <div id="page-shell">Portfolio shell</div>
        <CaseStudyDialog item={item} onClose={() => {}} onOpenAssistant={() => {}} />
      </>
    )

    expect(screen.queryByRole('button', { name: 'Ask Rohan AI about this work' }))
      .not.toBeInTheDocument()
  })

  it('opens the approved query and Back closes without leaving the page', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Open case study: Utilities/i }))
    expect(location.search).toBe('?case=workforce-operations-transformation')
    expect(
      screen.getByRole('dialog', { name: 'Utilities field-operations transformation' })
    ).toBeVisible()

    history.back()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(location.pathname).toBe('/')
  })

  it('starts on the heading, preserves natural Tab order, traps boundaries, and restores focus', async () => {
    const user = userEvent.setup()
    render(<App />)
    const trigger = screen.getByRole('button', { name: /Open case study: Omnichannel payments/i })

    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Omnichannel payments growth strategy' })
    const heading = within(dialog).getByRole('heading', {
      level: 2,
      name: 'Omnichannel payments growth strategy'
    })
    const close = within(dialog).getByRole('button', { name: 'Close case study' })
    const assistantAction = within(dialog).getByRole('button', {
      name: 'Ask Rohan AI about this work'
    })
    expect(document.getElementById('page-shell')).toHaveAttribute('inert')
    expect(document.getElementById('page-shell')).toHaveAttribute('aria-hidden', 'true')
    expect(dialog).not.toHaveAttribute('inert')
    expect(heading).toHaveAttribute('tabindex', '-1')
    expect(heading).toHaveFocus()

    await user.keyboard('{Tab}')
    expect(assistantAction).toHaveFocus()

    heading.focus()
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(close).toHaveFocus()

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(assistantAction).toHaveFocus()
    await user.keyboard('{Tab}')
    expect(close).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
    expect(document.getElementById('page-shell')).not.toHaveAttribute('inert')
    expect(document.getElementById('page-shell')).not.toHaveAttribute('aria-hidden')
    expect(document.body.style.overflow).toBe('')
  })

  it('omits diligence process notes while preserving industry and ownership', () => {
    const diligence = portfolioContent.work.find(
      ({ slug }) => slug === 'buy-side-commercial-diligence'
    )!
    render(
      <>
        <div id="page-shell">Portfolio shell</div>
        <CaseStudyDialog item={diligence} onClose={() => {}} onOpenAssistant={() => {}} />
      </>
    )

    const dialog = screen.getByRole('dialog', { name: 'B2B SaaS & logistics investment diligence' })
    expect(within(dialog).getByText(/Private equity · B2B SaaS and logistics/))
      .toBeVisible()
    expect(within(dialog).getByText('Commercial diligence workstream lead')).toBeVisible()
    expect(dialog.querySelector('.case-dialog__disclosure')).not.toBeInTheDocument()
    expect(dialog.querySelector('.case-dialog__maturity')).not.toBeInTheDocument()
    expect(dialog).not.toHaveTextContent(/target identities|transaction detail is disclosed/i)
  })

  it('cleans the real modal layer before one handoff callback without restoring trigger focus', async () => {
    const user = userEvent.setup()
    let handoff: () => void = () => {
      throw new Error('Handoff was not exposed')
    }
    const exposeHandoff = (handler: () => void) => {
      handoff = handler
    }
    render(<HandoffHarness exposeHandoff={exposeHandoff} />)
    const trigger = screen.getByRole('button', { name: 'Open diligence' })
    await user.click(trigger)
    expect(location.search).toBe('?case=buy-side-commercial-diligence')
    expect(document.getElementById('page-shell')).toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('hidden')
    const replaceState = vi.spyOn(history, 'replaceState')

    act(() => handoff())

    expect(replaceState).toHaveBeenCalledOnce()
    expect(replaceState).toHaveBeenCalledWith(null, '', '/')
    expect(location.search).toBe('')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Handoff cleanup state')).toHaveTextContent(
      'false|none|unlocked'
    )
    expect(screen.getByLabelText('Handoff callback count')).toHaveTextContent('1')
    expect(trigger).not.toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Ask Rohan AI about this work' }))
      .not.toBeInTheDocument()
  })

})
