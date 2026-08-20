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
  it('portals outside the shell and presents the approved case hierarchy', () => {
    const item = portfolioContent.work.find(({ slug }) => slug === 'trail-pulse')!
    render(
      <>
        <div id="page-shell">Portfolio shell</div>
        <CaseStudyDialog item={item} onClose={() => {}} onOpenAssistant={() => {}} />
      </>
    )

    const dialog = screen.getByRole('dialog', { name: 'Trail Pulse' })
    expect(document.getElementById('page-shell')).not.toContainElement(dialog)
    expect(document.body).toContainElement(dialog)
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription(item.thesis)

    const orderedCopy = [
      item.title,
      item.industry,
      item.thesis,
      item.role,
      'Challenge',
      item.challenge,
      'Approach',
      item.approach,
      'Evidence',
      item.evidence,
      item.disclosure!
    ]
    let lastPosition = -1
    for (const copy of orderedCopy) {
      const position = dialog.textContent!.indexOf(copy)
      expect(position).toBeGreaterThan(lastPosition)
      lastPosition = position
    }

    const externalAction = within(dialog).getByRole('link', { name: /Try Trail Pulse/i })
    expect(externalAction).toHaveAttribute('href', 'https://trail-pulse-alpha.vercel.app/')
    expect(externalAction).toHaveAttribute('target', '_blank')
    expect(externalAction.getAttribute('rel')).toMatch(/noopener/)
    expect(externalAction.getAttribute('rel')).toMatch(/noreferrer/)
  })

  it('exposes the integrated assistant action for the current work', () => {
    const item = portfolioContent.work[0]
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

    await user.click(screen.getByRole('button', { name: /Open case study: Workforce/i }))
    expect(location.search).toBe('?case=workforce-operations-transformation')
    expect(
      screen.getByRole('dialog', { name: 'Workforce operations transformation' })
    ).toBeVisible()

    history.back()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(location.pathname).toBe('/')
  })

  it('starts on the heading, preserves natural Tab order, traps boundaries, and restores focus', async () => {
    const user = userEvent.setup()
    render(<App />)
    const trigger = screen.getByRole('button', { name: /Open case study: Trail Pulse/i })

    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Trail Pulse' })
    const heading = within(dialog).getByRole('heading', {
      level: 2,
      name: 'Trail Pulse'
    })
    const close = within(dialog).getByRole('button', { name: 'Close case study' })
    const external = within(dialog).getByRole('link', { name: 'Try Trail Pulse' })
    const assistantAction = within(dialog).getByRole('button', {
      name: 'Ask Rohan AI about this work'
    })
    expect(document.getElementById('page-shell')).toHaveAttribute('inert')
    expect(document.getElementById('page-shell')).toHaveAttribute('aria-hidden', 'true')
    expect(dialog).not.toHaveAttribute('inert')
    expect(heading).toHaveAttribute('tabindex', '-1')
    expect(heading).toHaveFocus()

    await user.keyboard('{Tab}')
    expect(external).toHaveFocus()

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

  it('labels builder maturity separately from diligence confidentiality', () => {
    const builder = portfolioContent.work.find(({ slug }) => slug === 'trail-pulse')!
    const diligence = portfolioContent.work.find(
      ({ slug }) => slug === 'buy-side-commercial-diligence'
    )!
    const { rerender } = render(
      <>
        <div id="page-shell">Portfolio shell</div>
        <CaseStudyDialog item={builder} onClose={() => {}} onOpenAssistant={() => {}} />
      </>
    )

    expect(screen.getByRole('complementary', { name: 'Maturity disclosure' }))
      .toHaveTextContent(builder.disclosure!)

    rerender(
      <>
        <div id="page-shell">Portfolio shell</div>
        <CaseStudyDialog item={diligence} onClose={() => {}} onOpenAssistant={() => {}} />
      </>
    )

    expect(screen.getByRole('complementary', { name: 'Confidentiality disclosure' }))
      .toHaveTextContent(diligence.disclosure!)
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
