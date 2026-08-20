import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { createPortal } from 'react-dom'
import type { AssistantAdapter } from '../../assistant/types'
import { useAssistant } from '../../assistant/useAssistant'
import { suppressNextModalFocusRestore, useModalLayer } from '../../hooks/useModalLayer'
import { publicAsset } from '../../lib/publicAsset'
import { AssistantComposer } from './AssistantComposer'
import { AssistantDisclosure, assistantDisclosureId } from './AssistantDisclosure'
import { AssistantTranscript } from './AssistantTranscript'

export interface AskRohanOpenOptions {
  mode?: 'compact' | 'expanded'
  topicId?: string
}

export interface AskRohanHandle {
  open(trigger: HTMLElement, options?: AskRohanOpenOptions): void
  hideForHandoff(options?: { restoreFocus?: boolean }): void
  getLauncher(): HTMLButtonElement | null
}

export interface AskRohanProps {
  adapter: AssistantAdapter
  onLauncherRequest?(trigger: HTMLButtonElement): void
  onRequestCase?(slug: string, trigger: HTMLButtonElement): void
  onViewChange?(view: 'closed' | 'compact' | 'expanded' | 'minimized'): void
}

const controlSize = { minWidth: '44px', minHeight: '44px' }

function useMobileAssistant(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches
  )

  useEffect(() => {
    const query = window.matchMedia?.('(max-width: 767px)')
    if (!query) return
    const update = () => setMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return mobile
}

export const AskRohan = forwardRef<AskRohanHandle, AskRohanProps>(function AskRohan(
  { adapter, onLauncherRequest, onRequestCase, onViewChange },
  forwardedRef
) {
  const assistant = useAssistant(adapter)
  const { state } = assistant
  const mobile = useMobileAssistant()
  const launcherRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const alignedMessageRef = useRef<string | null>(null)
  const [caseRequest, setCaseRequest] = useState<{
    slug: string
    trigger: HTMLButtonElement
  } | null>(null)
  const [citationRequest, setCitationRequest] = useState<string | null>(null)
  const openSurface = state.view === 'compact' || state.view === 'expanded'
  const modal = openSurface && (mobile || state.view === 'expanded')
  const latestMessageId = state.messages.at(-1)?.id

  const openFrom = useCallback((trigger: HTMLElement, options?: AskRohanOpenOptions) => {
    restoreFocusRef.current = trigger
    assistant.open(options)
  }, [assistant.open])

  const focusRestoreTarget = useCallback(() => {
    const target = restoreFocusRef.current?.isConnected
      ? restoreFocusRef.current
      : launcherRef.current
    restoreFocusRef.current = target
    target?.focus()
  }, [])

  const closePanel = useCallback(() => {
    if (!modal) focusRestoreTarget()
    else if (!restoreFocusRef.current?.isConnected) restoreFocusRef.current = launcherRef.current
    assistant.closePanel()
  }, [assistant.closePanel, focusRestoreTarget, modal])

  const hideForHandoff = useCallback((options?: { restoreFocus?: boolean }) => {
    const restoreFocus = options?.restoreFocus ?? true
    if (!restoreFocus && modal) suppressNextModalFocusRestore()
    if (restoreFocus && !modal) focusRestoreTarget()
    assistant.hideForHandoff()
  }, [assistant.hideForHandoff, focusRestoreTarget, modal])

  useImperativeHandle(forwardedRef, () => ({
    open: openFrom,
    hideForHandoff,
    getLauncher: () => launcherRef.current
  }), [hideForHandoff, openFrom])

  useEffect(() => {
    onViewChange?.(state.view)
  }, [onViewChange, state.view])

  useModalLayer({
    open: modal,
    dialogRef: panelRef,
    initialFocusRef: textareaRef,
    restoreFocusRef,
    backgroundId: 'page-shell',
    onEscape: closePanel
  })

  useLayoutEffect(() => {
    if (openSurface && !modal) textareaRef.current?.focus()
  }, [modal, openSurface])

  useLayoutEffect(() => {
    if (openSurface && transcriptRef.current) {
      transcriptRef.current.scrollTop = state.transcriptScrollTop
    }
  }, [openSurface, state.transcriptScrollTop])

  useLayoutEffect(() => {
    const transcript = transcriptRef.current
    if (
      !openSurface
      || !transcript
      || !latestMessageId
      || alignedMessageRef.current === latestMessageId
    ) return

    const latestMessage = transcript.querySelectorAll<HTMLElement>('.ask-rohan__message').item(
      transcript.querySelectorAll('.ask-rohan__message').length - 1
    )
    if (!latestMessage) return
    alignedMessageRef.current = latestMessageId
    const transcriptBox = transcript.getBoundingClientRect()
    const messageBox = latestMessage.getBoundingClientRect()
    const paddingTop = Number.parseFloat(getComputedStyle(transcript).paddingTop)
    transcript.scrollTop = Math.max(
      0,
      transcript.scrollTop + messageBox.top - transcriptBox.top - paddingTop
    )
  }, [latestMessageId, openSurface])

  useEffect(() => {
    if (!openSurface || modal) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closePanel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [closePanel, modal, openSurface])

  useEffect(() => {
    if (!caseRequest || modal) return
    setCaseRequest(null)
    onRequestCase?.(caseRequest.slug, caseRequest.trigger)
  }, [caseRequest, modal, onRequestCase])

  useEffect(() => {
    if (!citationRequest || modal) return
    const section = document.querySelector<HTMLElement>(citationRequest)
    setCitationRequest(null)
    if (!section) return
    history.pushState(null, '', citationRequest)
    section.scrollIntoView?.({ block: 'start' })
    const heading = section.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6')
    if (!heading) return
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
    heading.focus()
  }, [citationRequest, modal])

  const submit = useCallback((prompt?: string) => {
    void assistant.submit(prompt).then(() => textareaRef.current?.focus())
  }, [assistant.submit])

  const clear = useCallback(() => {
    assistant.clearConversation()
    textareaRef.current?.focus()
  }, [assistant.clearConversation])

  const requestCase = useCallback((slug: string, trigger: HTMLButtonElement) => {
    if (modal) suppressNextModalFocusRestore()
    setCaseRequest({ slug, trigger })
    assistant.hideForHandoff()
  }, [assistant.hideForHandoff, modal])

  const navigateCitation = useCallback((sectionId: string) => {
    if (modal) suppressNextModalFocusRestore()
    setCitationRequest(sectionId)
    assistant.hideForHandoff()
  }, [assistant.hideForHandoff, modal])

  const surface = openSurface ? (
    <section
      className={`ask-rohan ask-rohan--${state.view}${mobile ? ' ask-rohan--mobile' : ''}`}
      ref={panelRef}
      role={modal ? 'dialog' : 'complementary'}
      aria-modal={modal ? 'true' : undefined}
      aria-labelledby="ask-rohan-title"
      aria-describedby={assistantDisclosureId}
      tabIndex={-1}
    >
      <header className="ask-rohan__header">
        <div>
          <span className="ask-rohan__eyebrow">Evidence desk</span>
          <h2 id="ask-rohan-title">Ask Rohan AI</h2>
        </div>
        <div className="ask-rohan__controls">
          {state.view === 'compact' && (
            <button
              type="button"
              aria-label="Expand assistant"
              title="Expand"
              onClick={assistant.expand}
              style={controlSize}
            >
              <span aria-hidden="true">↗</span>
            </button>
          )}
          {state.view === 'expanded' && (
            <button
              type="button"
              aria-label="Collapse to compact assistant"
              title="Collapse"
              onClick={assistant.collapseToCompact}
              style={controlSize}
            >
              <span aria-hidden="true">↙</span>
            </button>
          )}
          <button
            type="button"
            aria-label="Clear conversation"
            title="Clear"
            onClick={clear}
            style={controlSize}
          >
            <span aria-hidden="true">↺</span>
          </button>
          <button
            type="button"
            aria-label="Close assistant panel"
            title="Close"
            onClick={closePanel}
            style={controlSize}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </header>
      <AssistantDisclosure disclosure={adapter.disclosure} />
      <AssistantTranscript
        messages={state.messages}
        pending={state.pending}
        suggestions={state.suggestions}
        transcriptRef={transcriptRef}
        onScroll={assistant.saveScroll}
        onPrompt={submit}
        onRequestCase={onRequestCase ? requestCase : undefined}
        onNavigateCitation={navigateCitation}
      />
      <AssistantComposer
        draft={state.draft}
        pending={state.pending}
        notice={state.notice}
        textareaRef={textareaRef}
        onDraftChange={assistant.setDraft}
        onSubmit={() => submit()}
      />
    </section>
  ) : null

  return (
    <>
      <div className={`ask-rohan-launcher${state.view === 'minimized' ? ' is-minimized' : ''}`}>
        <button
          ref={launcherRef}
          className="ask-rohan-launcher__button"
          type="button"
          aria-label={state.view === 'minimized' ? 'Reopen Ask Rohan AI' : 'Ask Rohan AI'}
          aria-expanded={openSurface}
          onClick={(event) => {
            if (onLauncherRequest) onLauncherRequest(event.currentTarget)
            else openFrom(event.currentTarget)
          }}
          style={{ width: '56px', height: '56px' }}
        >
          <img
            src={publicAsset('images/rohan-launcher.png')}
            alt=""
            width="48"
            height="48"
          />
          <span className="ask-rohan-launcher__badge" aria-hidden="true">Ask</span>
        </button>
      </div>
      {surface && createPortal(surface, document.body)}
    </>
  )
})
