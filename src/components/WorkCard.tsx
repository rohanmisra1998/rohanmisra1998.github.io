import type { WorkItem } from '../content/portfolio-types'

interface WorkCardProps {
  item: WorkItem
  onOpen: (slug: string, trigger: HTMLButtonElement) => void
}

export function WorkCard({ item, onOpen }: WorkCardProps) {
  const headingId = `work-${item.slug}-heading`
  const isSecondary = item.slug === 'trail-pulse'

  return (
    <article
      className={`case-card case-card--${item.category}`}
      data-emphasis={isSecondary ? 'secondary' : 'primary'}
      aria-labelledby={headingId}
    >
      <div
        className="case-card__visual"
        data-visual-variant={item.slug}
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </div>
      <div className="case-card__body">
        <p className="case-card__industry">{item.industry}</p>
        <h3 id={headingId}>{item.title}</h3>
        <p className="case-card__evidence">{item.evidence}</p>
        <div
          className="case-card__details"
          role="group"
          aria-label={isSecondary ? 'What Trail Pulse does' : `${item.title} evidence`}
        >
          <ul className="case-card__capabilities" aria-label="Capabilities">
            {item.capabilities.slice(0, 3).map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
          {item.disclosure && <p className="case-card__disclosure">{item.disclosure}</p>}
        </div>
        <button
          className="case-card__open"
          type="button"
          aria-label={`Open case study: ${item.title}`}
          onClick={(event) => onOpen(item.slug, event.currentTarget)}
        >
          <span>Open case study</span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  )
}
