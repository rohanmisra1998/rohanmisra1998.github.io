import type { RefObject } from 'react'
import type { AssistantHistoryItem } from '../../assistant/types'

interface AssistantTranscriptProps {
  messages: AssistantHistoryItem[]
  pending: boolean
  suggestions: readonly string[]
  transcriptRef: RefObject<HTMLDivElement | null>
  onScroll(value: number): void
  onPrompt(prompt: string): void
  onRequestCase?(slug: string, trigger: HTMLButtonElement): void
  onNavigateCitation?(sectionId: string): void
}

const portfolioPageIds = new Set([
  '#work',
  '#experience',
  '#expertise',
  '#personal-projects',
  '#writing',
  '#about',
  '#about-assistant',
  '#contact'
])

const assistantCaseSlugs = new Set([
  'workforce-operations-transformation',
  'buy-side-commercial-diligence',
  'omnichannel-payments-strategy'
])

export function AssistantTranscript({
  messages,
  pending,
  suggestions,
  transcriptRef,
  onScroll,
  onPrompt,
  onRequestCase,
  onNavigateCitation
}: AssistantTranscriptProps) {
  return (
    <div
      className="ask-rohan__transcript"
      ref={transcriptRef}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Conversation"
      onScroll={(event) => onScroll(event.currentTarget.scrollTop)}
    >
      {messages.length === 0 && (
        <div className="ask-rohan__intro">
          <p>
            Explore Rohan's work through concise answers grounded in this portfolio.
          </p>
          <div className="ask-rohan__prompts" aria-label="Suggested questions">
            {suggestions.map((prompt) => (
              <button type="button" key={prompt} onClick={() => onPrompt(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((message) => (
        <article
          className={`ask-rohan__message ask-rohan__message--${message.role}`}
          key={message.id}
          aria-label={message.role === 'user' ? 'Your question' : 'Grounded answer'}
        >
          <p>{message.text}</p>
          {message.citations && message.citations.some(({ sectionId }) =>
            portfolioPageIds.has(sectionId)
          ) && (
            <nav className="ask-rohan__citations" aria-label="Sources">
              <span>Sources</span>
              {message.citations.filter(({ sectionId }) =>
                portfolioPageIds.has(sectionId)
              ).map((citation) => (
                <a
                  href={citation.sectionId}
                  key={`${message.id}-${citation.sectionId}`}
                  onClick={(event) => {
                    if (!onNavigateCitation) return
                    event.preventDefault()
                    onNavigateCitation(citation.sectionId)
                  }}
                >
                  {citation.label}
                </a>
              ))}
            </nav>
          )}
          {message.caseSlug && assistantCaseSlugs.has(message.caseSlug) && onRequestCase && (
            <button
              className="ask-rohan__case-link"
              type="button"
              onClick={(event) => onRequestCase(message.caseSlug!, event.currentTarget)}
            >
              View supporting case
            </button>
          )}
        </article>
      ))}

      {pending && <p className="ask-rohan__pending">Checking approved evidence…</p>}

      {messages.length > 0 && suggestions.length > 0 && (
        <div className="ask-rohan__follow-ups" aria-label="Suggested follow-up questions">
          {suggestions.map((prompt) => (
            <button type="button" key={prompt} onClick={() => onPrompt(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
