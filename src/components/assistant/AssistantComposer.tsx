import type { KeyboardEvent } from 'react'

interface AssistantComposerProps {
  draft: string
  pending: boolean
  notice: string
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onDraftChange(value: string): void
  onSubmit(): void
}

const controlSize = { minWidth: '44px', minHeight: '44px' }

export function AssistantComposer({
  draft,
  pending,
  notice,
  textareaRef,
  onDraftChange,
  onSubmit
}: AssistantComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    onSubmit()
  }

  return (
    <form
      className="ask-rohan__composer"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <label htmlFor="ask-rohan-question">Ask a question</label>
      <div className="ask-rohan__composer-row">
        <textarea
          id="ask-rohan-question"
          ref={textareaRef}
          value={draft}
          maxLength={300}
          rows={2}
          placeholder="Ask about work, experience, or what Rohan builds…"
          onChange={(event) => onDraftChange(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="ask-rohan__send"
          type="submit"
          aria-label="Send question"
          disabled={pending}
          style={controlSize}
        >
          <span aria-hidden="true">↑</span>
        </button>
      </div>
      <div className="ask-rohan__composer-meta">
        <output className="ask-rohan__notice" role="status" aria-live="polite">
          {notice}
        </output>
        {draft.length >= 260 && (
          <output role="status" aria-label="Question length">
            {draft.length} / 300
          </output>
        )}
      </div>
    </form>
  )
}
