import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { assistantTopicForCase } from '../content/assistant-topics'
import type { WorkItem } from '../content/portfolio-types'
import { useModalLayer } from '../hooks/useModalLayer'

interface CaseStudyDialogProps {
  item: WorkItem
  onClose: () => void
  onOpenAssistant?: (trigger: HTMLButtonElement) => void
}

export function CaseStudyDialog({ item, onClose, onOpenAssistant }: CaseStudyDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null
  )
  const titleId = `case-${item.slug}-title`
  const thesisId = `case-${item.slug}-thesis`
  const hasAssistantTopic = assistantTopicForCase(item.slug) !== undefined

  useModalLayer({
    open: true,
    dialogRef,
    initialFocusRef: titleRef,
    restoreFocusRef,
    backgroundId: 'page-shell',
    onEscape: onClose
  })

  return createPortal(
    <div
      className="case-dialog-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="case-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={thesisId}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="case-dialog__bar">
          <p>Case study</p>
          <button type="button" aria-label="Close case study" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="case-dialog__layout">
          <aside className="case-dialog__rail">
            <h2 id={titleId} ref={titleRef} tabIndex={-1}>{item.title}</h2>
            <p className="case-dialog__industry">{item.industry}</p>
            <p className="case-dialog__thesis" id={thesisId}>{item.thesis}</p>
            <div className="case-dialog__role">
              <p>Role</p>
              <p>{item.role}</p>
            </div>
            <div className="case-dialog__capability-group">
              <p>Capabilities</p>
              <ul>
                {item.capabilities.map((capability) => <li key={capability}>{capability}</li>)}
              </ul>
            </div>
          </aside>

          <div className="case-dialog__narrative">
            <section>
              <p>Challenge</p>
              <h3>{item.challenge}</h3>
            </section>
            <section>
              <p>Approach</p>
              <h3>{item.approach}</h3>
            </section>
            <section className="case-dialog__evidence">
              <p>Evidence</p>
              <h3>{item.evidence}</h3>
            </section>
            {item.maturityNote && (
              <aside
                className="case-dialog__maturity"
                aria-label="Maturity disclosure"
              >
                <p>{item.maturityNote}</p>
              </aside>
            )}
            {item.externalAction && (
              <a
                className="case-dialog__external"
                href={item.externalAction.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.externalAction.label}
                <span aria-hidden="true">↗</span>
              </a>
            )}
            {hasAssistantTopic && onOpenAssistant && (
              <button
                className="case-dialog__assistant"
                type="button"
                onClick={(event) => onOpenAssistant(event.currentTarget)}
              >
                Ask Rohan AI about this work
                <span aria-hidden="true">✦</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  )
}
