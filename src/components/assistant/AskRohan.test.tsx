import { createRef } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { localAssistantAdapter } from '../../assistant/localAdapter'
import type { AssistantAdapter, AssistantReply } from '../../assistant/types'
import { portfolioContent } from '../../content/portfolio-content'
import { useCaseHistory } from '../../hooks/useCaseHistory'
import { AskRohan } from './AskRohan'
import type { AskRohanHandle } from './AskRohan'
import { CaseStudyDialog } from '../CaseStudyDialog'
import '../../styles/assistant.css'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  document.getElementById('page-shell')?.removeAttribute('inert')
  document.getElementById('page-shell')?.removeAttribute('aria-hidden')
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  history.replaceState(null, '', '/')
})

function fixedAdapter(...replies: AssistantReply[]): AssistantAdapter {
  let index = 0
  return {
    capabilities: { generative: false, network: false, persistent: false },
    disclosure: 'Grounded locally in approved public portfolio content.',
    reply: async () => replies[Math.min(index++, replies.length - 1)]
  }
}

const contextAwareAdapter: AssistantAdapter = {
  capabilities: { generative: false, network: false, persistent: false },
  disclosure: 'Grounded locally in approved public portfolio content.',
  reply: async ({ input, history }) => {
    const latestTopic = [...history].reverse().find((item) => item.topicId)?.topicId
    const topicId = input.includes('career path') ? 'career-path' : latestTopic ?? 'missing'
    return {
      kind: 'answer',
      text: `Resolved topic: ${topicId}`,
      topicId,
      citations: [{ sectionId: '#work', label: 'Work' }]
    }
  }
}

function renderAssistant(adapter: AssistantAdapter = localAssistantAdapter, onRequestCase = vi.fn()) {
  return render(
    <>
      <div id="page-shell"><button type="button">Outside</button></div>
      <AskRohan adapter={adapter} onRequestCase={onRequestCase} />
    </>
  )
}

interface HandoffSnapshot {
  slug: string
  trigger: HTMLButtonElement
  bodyOverflow: string
  shellInert: boolean
  assistantDialogCount: number
  ordinaryLauncherFocused: boolean
}

function CaseHandoffHarness({ observe }: { observe(snapshot: HandoffSnapshot): void }) {
  const { activeCase, openCase, closeCase } = useCaseHistory(portfolioContent.work)

  return (
    <>
      <div id="page-shell"><button type="button">Outside</button></div>
      <AskRohan
        adapter={localAssistantAdapter}
        onRequestCase={(slug, trigger) => {
          observe({
            slug,
            trigger,
            bodyOverflow: document.body.style.overflow,
            shellInert: document.getElementById('page-shell')?.hasAttribute('inert') ?? false,
            assistantDialogCount: document.querySelectorAll(
              '[role="dialog"][aria-labelledby="ask-rohan-title"]'
            ).length,
            ordinaryLauncherFocused: document.activeElement?.classList.contains(
              'ask-rohan-launcher__button'
            ) ?? false
          })
          openCase(slug, trigger)
        }}
      />
      {activeCase && (
        <CaseStudyDialog item={activeCase} onClose={closeCase} onOpenAssistant={() => {}} />
      )}
    </>
  )
}

describe('AskRohan', () => {
  it('collapses expanded, closes history to minimized, reopens compact, and clears explicitly', async () => {
    const user = userEvent.setup()
    renderAssistant()
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    await user.click(screen.getByRole('button', { name: /private-equity diligence/i }))
    expect(await screen.findByText(/X buy-side investment theses/i)).toBeVisible()
    const transcript = screen.getByRole('log')
    transcript.scrollTop = 137
    fireEvent.scroll(transcript)

    await user.click(screen.getByRole('button', { name: 'Expand assistant' }))
    await user.click(screen.getByRole('button', { name: 'Collapse to compact assistant' }))
    expect(screen.getByRole('complementary', { name: 'Ask Rohan AI' })).toBeVisible()
    expect(screen.getByText(/X buy-side investment theses/i)).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Close assistant panel' }))
    const reopen = screen.getByRole('button', { name: 'Reopen Ask Rohan AI' })
    expect(screen.queryByRole('complementary', { name: 'Ask Rohan AI' })).not.toBeInTheDocument()
    expect(within(document.querySelector('.ask-rohan-launcher')!).getAllByRole('button'))
      .toEqual([reopen])
    expect(reopen).toHaveFocus()

    await user.click(reopen)
    expect(screen.getByRole('complementary', { name: 'Ask Rohan AI' })).toBeVisible()
    expect(screen.getByText(/X buy-side investment theses/i)).toBeVisible()
    expect(screen.getByRole('log').scrollTop).toBe(137)

    await user.click(screen.getByRole('button', { name: 'Clear conversation' }))
    expect(screen.getByRole('log').querySelectorAll('article')).toHaveLength(0)
    expect(screen.getByRole('complementary', { name: 'Ask Rohan AI' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Close assistant panel' }))
    const closedLauncher = screen.getByRole('button', { name: 'Ask Rohan AI' })
    expect(closedLauncher).toHaveFocus()
    await user.click(closedLauncher)
    expect(screen.getByRole('log').querySelectorAll('article')).toHaveLength(0)
  })

  it('does not call network or storage APIs while answering', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'send')
    const user = userEvent.setup()
    renderAssistant()
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    await user.type(screen.getByLabelText('Ask a question'), 'What is Trail Pulse?')
    await user.keyboard('{Enter}')
    expect(await screen.findByText(/early AI-assisted/i)).toBeVisible()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(localStorageSpy).not.toHaveBeenCalled()
    expect(xhrSpy).not.toHaveBeenCalled()
  })

  it('uses a non-modal compact aside on desktop and reserves the 56px launcher', async () => {
    const user = userEvent.setup()
    renderAssistant()
    const launcher = screen.getByRole('button', { name: 'Ask Rohan AI' })
    expect(launcher).toHaveStyle({ width: '56px', height: '56px' })
    expect(launcher.querySelector('img')).toHaveAttribute(
      'src',
      '/images/rohan-portrait.webp'
    )
    await user.click(launcher)
    expect(screen.getByRole('complementary', { name: 'Ask Rohan AI' })).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Ask a question')).toHaveFocus()
  })

  it('returns focus to the opening trigger when the compact panel is closed', async () => {
    const user = userEvent.setup()
    renderAssistant()
    const launcher = screen.getByRole('button', { name: 'Ask Rohan AI' })
    await user.click(launcher)
    await user.click(screen.getByRole('button', { name: 'Close assistant panel' }))

    expect(screen.getByRole('button', { name: 'Ask Rohan AI' })).toBe(launcher)
    expect(launcher).toHaveFocus()
  })

  it('submits on Enter, inserts a line break on Shift+Enter, validates empty input, and counts near the limit', async () => {
    const user = userEvent.setup()
    renderAssistant()
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    const composer = screen.getByLabelText('Ask a question')

    await user.keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('Enter a question first.')
    expect(composer).toHaveFocus()
    await user.type(composer, 'line one{Shift>}{Enter}{/Shift}line two')
    expect(composer).toHaveValue('line one\nline two')
    expect(screen.queryByText('line one\nline two')).not.toBeInTheDocument()
    await user.clear(composer)
    await user.type(composer, 'x'.repeat(260))
    expect(screen.getByRole('status', { name: 'Question length' })).toHaveTextContent('260 / 300')
    expect(composer).toHaveAttribute('maxlength', '300')
  })

  it('renders citations, plain-text user content, and the case request contract', async () => {
    const onRequestCase = vi.fn()
    const user = userEvent.setup()
    renderAssistant(localAssistantAdapter, onRequestCase)
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    const composer = screen.getByLabelText('Ask a question')
    await user.type(composer, '<img src=x> What is Trail Pulse?')
    await user.keyboard('{Enter}')

    expect(await screen.findByText(/early AI-assisted/i)).toBeVisible()
    expect(screen.getByText('<img src=x> What is Trail Pulse?')).toBeVisible()
    expect(document.querySelector('.ask-rohan img[src="x"]')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Personal projects' }))
      .toHaveAttribute('href', '#personal-projects')
    expect(screen.queryByRole('button', { name: 'View supporting case' })).not.toBeInTheDocument()
    expect(onRequestCase).not.toHaveBeenCalled()
  })

  it('renders the supported Outside work citation for an interests answer', async () => {
    const user = userEvent.setup()
    renderAssistant()
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    await user.type(screen.getByLabelText('Ask a question'), 'What are Rohan’s interests?')
    await user.keyboard('{Enter}')

    expect(await screen.findByText(/Hiking, History, Travel, Scuba diving, Horse riding/i)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Outside work' }))
      .toHaveAttribute('href', '#outside-work')
  })

  it('presents clarification, fallback, and unavailable guidance as real transcript replies', async () => {
    const user = userEvent.setup()
    renderAssistant(fixedAdapter(
      { kind: 'clarification', text: 'Which evidence area?', suggestions: ['Work', 'Writing'] },
      { kind: 'fallback', text: 'Try a public portfolio topic.', suggestions: ['Career'] },
      {
        kind: 'unavailable',
        text: 'Approved answers are temporarily unavailable.',
        citations: [{ sectionId: '#contact', label: 'Contact' }]
      }
    ))
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    const composer = screen.getByLabelText('Ask a question')

    await user.type(composer, 'first')
    await user.keyboard('{Enter}')
    expect(await screen.findByText('Which evidence area?')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Work' })).toBeVisible()
    await user.type(composer, 'second')
    await user.keyboard('{Enter}')
    expect(await screen.findByText('Try a public portfolio topic.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Career' })).toBeVisible()
    await user.type(composer, 'third')
    await user.keyboard('{Enter}')
    expect(await screen.findByText('Approved answers are temporarily unavailable.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact')
  })

  it('clears transcript and leaves the open desk ready for another question', async () => {
    const user = userEvent.setup()
    renderAssistant()
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    await user.click(screen.getByRole('button', { name: /career path/i }))
    const answer = await screen.findByRole('article', { name: 'Grounded answer' })
    expect(answer).toHaveTextContent(/Rohan's career path:/i)
    await user.click(screen.getByRole('button', { name: 'Clear conversation' }))
    expect(screen.queryByText(/Rohan's career path:/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Ask a question')).toHaveFocus()
  })

  it('keeps natural composer Tab order and traps only modal boundaries', async () => {
    const user = userEvent.setup()
    renderAssistant()
    const launcher = screen.getByRole('button', { name: 'Ask Rohan AI' })
    await user.click(launcher)
    await user.click(screen.getByRole('button', { name: 'Expand assistant' }))

    const dialog = screen.getByRole('dialog', { name: 'Ask Rohan AI' })
    const composer = within(dialog).getByLabelText('Ask a question')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.getElementById('page-shell')).toHaveAttribute('inert')
    expect(composer).toHaveFocus()

    const send = within(dialog).getByRole('button', { name: 'Send question' })
    const first = within(dialog).getByRole('button', { name: 'Collapse to compact assistant' })
    const previous = within(dialog).getByRole('button', { name: /career path/i })
    await user.tab()
    expect(send).toHaveFocus()
    await user.tab({ shift: true })
    expect(composer).toHaveFocus()
    await user.tab({ shift: true })
    expect(previous).toHaveFocus()

    first.focus()
    await user.tab({ shift: true })
    expect(send).toHaveFocus()
    await user.tab()
    expect(first).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(launcher).toHaveFocus()
    expect(document.getElementById('page-shell')).not.toHaveAttribute('inert')
  })

  it('uses described modal mobile states with real expand and collapse controls', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })))
    const user = userEvent.setup()
    renderAssistant()
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    const dialog = screen.getByRole('dialog', { name: 'Ask Rohan AI' })
    const log = within(dialog).getByRole('log')
    expect(dialog).toHaveClass('ask-rohan--compact', 'ask-rohan--mobile')
    expect(dialog).toHaveAttribute('aria-describedby', 'ask-rohan-disclosure')
    expect(document.getElementById('ask-rohan-disclosure')).toHaveTextContent(
      'Grounded locally in approved public portfolio content.'
    )
    expect(log).toHaveAttribute('aria-live', 'polite')
    expect(log).toHaveAttribute('aria-relevant', 'additions')
    expect(within(dialog).getByRole('button', { name: 'Close assistant panel' }))
      .toHaveStyle({ minWidth: '44px', minHeight: '44px' })
    const composer = within(dialog).getByLabelText('Ask a question')
    await user.click(within(dialog).getByRole('button', { name: 'Expand assistant' }))
    expect(dialog).toHaveClass('ask-rohan--expanded', 'ask-rohan--mobile')
    expect(composer).toHaveFocus()
    await user.click(within(dialog).getByRole('button', {
      name: 'Collapse to compact assistant'
    }))
    expect(dialog).toHaveClass('ask-rohan--compact', 'ask-rohan--mobile')
    expect(composer).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('keeps the permanent disclosure and explanation visible', async () => {
    const user = userEvent.setup()
    renderAssistant()
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    expect(screen.getByText('Grounded locally in approved public portfolio content.')).toBeVisible()
    const disclosure = document.getElementById('ask-rohan-disclosure')
    expect(disclosure).toHaveTextContent('Grounded locally in approved public portfolio content.')
    const explanation = screen.getByText('How this works')
    const details = explanation.closest('details')
    expect(details).toBeInstanceOf(HTMLDetailsElement)
    expect(details).toHaveTextContent(/deterministic retrieval/i)
    expect(details).toHaveTextContent(/not a generative model or a virtual twin/i)
    expect(details).toHaveTextContent(/questions are not sent or saved/i)
  })

  it('keeps every assistant interaction class at least 44 by 44 pixels', async () => {
    const user = userEvent.setup()
    renderAssistant()
    const assertTargetSize = (targets: HTMLElement[]) => {
      for (const target of targets) {
        const style = getComputedStyle(target)
        expect(Number.parseFloat(style.minWidth), target.outerHTML).toBeGreaterThanOrEqual(44)
        expect(Number.parseFloat(style.minHeight), target.outerHTML).toBeGreaterThanOrEqual(44)
      }
    }

    const launcher = screen.getByRole('button', { name: 'Ask Rohan AI' })
    assertTargetSize([launcher])
    await user.click(launcher)
    const assistant = screen.getByRole('complementary', { name: 'Ask Rohan AI' })
    assertTargetSize([
      ...within(assistant).getAllByRole('button'),
      within(assistant).getByRole('textbox', { name: 'Ask a question' }),
      within(assistant).getByText('How this works')
    ])

    await user.click(within(assistant).getByRole('button', { name: /Trail Pulse, and how mature/i }))
    expect(await within(assistant).findByText(/early AI-assisted/i)).toBeVisible()
    assertTargetSize(within(assistant).getAllByRole('link'))

    await user.click(within(assistant).getByRole('button', { name: 'Clear conversation' }))
    await user.click(within(assistant).getByRole('button', { name: /private-equity diligence/i }))
    const caseAction = await within(assistant).findByRole('button', {
      name: 'View supporting case'
    })
    assertTargetSize([caseAction])

    await user.click(within(assistant).getByRole('button', { name: 'Close assistant panel' }))
    assertTargetSize([screen.getByRole('button', { name: 'Reopen Ask Rohan AI' })])
  })

  it('opens from the imperative handle without fabricating a topic message and restores that trigger', async () => {
    const ref = createRef<AskRohanHandle>()
    const user = userEvent.setup()
    render(
      <>
        <div id="page-shell"><button type="button">Case handoff</button></div>
        <AskRohan ref={ref} adapter={contextAwareAdapter} />
      </>
    )
    const trigger = screen.getByRole('button', { name: 'Case handoff' })
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    await user.click(screen.getByRole('button', { name: /career path/i }))
    expect(await screen.findByText('Resolved topic: career-path')).toBeVisible()

    act(() => ref.current?.open(trigger, { mode: 'expanded', topicId: 'trail-pulse' }))

    const dialog = screen.getByRole('dialog', { name: 'Ask Rohan AI' })
    expect(within(dialog).getAllByRole('button', { name: /Trail Pulse/i })[0]).toBeVisible()
    await user.type(within(dialog).getByLabelText('Ask a question'), 'tell me more')
    await user.keyboard('{Enter}')
    expect(await within(dialog).findByText('Resolved topic: trail-pulse')).toBeVisible()
    await user.click(within(dialog).getByRole('button', { name: 'Close assistant panel' }))
    expect(trigger).toHaveFocus()
  })

  it('refuses citations that are not valid portfolio page IDs', async () => {
    const user = userEvent.setup()
    renderAssistant(fixedAdapter({
      kind: 'unavailable',
      text: 'Use the approved navigation.',
      citations: [
        { sectionId: '#contact', label: 'Contact' },
        { sectionId: 'javascript:alert(1)', label: 'Unsafe source' }
      ]
    }))
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    await user.type(screen.getByLabelText('Ask a question'), 'contact')
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact')
    expect(screen.queryByRole('link', { name: 'Unsafe source' })).not.toBeInTheDocument()
  })

  it('does not expose a supporting-case action for a non-allowlisted slug', async () => {
    const user = userEvent.setup()
    renderAssistant(fixedAdapter({
      kind: 'answer',
      text: 'Grounded answer with an invalid case target.',
      topicId: 'career-path',
      citations: [{ sectionId: '#experience', label: 'Experience' }],
      caseSlug: 'private-client-name'
    }))
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI' }))
    await user.type(screen.getByLabelText('Ask a question'), 'career path')
    await user.keyboard('{Enter}')

    expect(await screen.findByText('Grounded answer with an invalid case target.')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'View supporting case' }))
      .not.toBeInTheDocument()
  })

  it.each([
    { viewport: 'expanded desktop', mobile: false },
    { viewport: 'compact mobile', mobile: true }
  ])('hands off $viewport case requests only after assistant modal cleanup', async ({ mobile }) => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
      matches: mobile,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })))
    const snapshots: HandoffSnapshot[] = []
    const user = userEvent.setup()
    render(<CaseHandoffHarness observe={(snapshot) => snapshots.push(snapshot)} />)

    const launcher = screen.getByRole('button', { name: 'Ask Rohan AI' })
    await user.click(launcher)
    await user.click(screen.getByRole('button', { name: /private-equity diligence/i }))
    expect(await screen.findByText(/X buy-side investment theses/i)).toBeVisible()
    if (!mobile) await user.click(screen.getByRole('button', { name: 'Expand assistant' }))

    const assistantDialog = screen.getByRole('dialog', { name: 'Ask Rohan AI' })
    const caseAction = within(assistantDialog).getByRole('button', {
      name: 'View supporting case'
    })
    expect(document.getElementById('page-shell')).toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('hidden')

    await user.click(caseAction)

    const caseDialog = await screen.findByRole('dialog', {
      name: 'B2B SaaS & logistics investment diligence'
    })
    expect(screen.getAllByRole('dialog')).toEqual([caseDialog])
    expect(screen.queryByRole('dialog', { name: 'Ask Rohan AI' })).not.toBeInTheDocument()
    expect(snapshots).toEqual([{
      slug: 'buy-side-commercial-diligence',
      trigger: caseAction,
      bodyOverflow: '',
      shellInert: false,
      assistantDialogCount: 0,
      ordinaryLauncherFocused: false
    }])
    expect(within(caseDialog).getByRole('heading', {
      level: 2,
      name: 'B2B SaaS & logistics investment diligence'
    }))
      .toHaveFocus()
  })
})
