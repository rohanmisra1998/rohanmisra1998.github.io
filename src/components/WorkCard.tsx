import type { WorkItem } from '../content/portfolio-types'

interface WorkCardProps {
  item: WorkItem
  onOpen: (slug: string, trigger: HTMLButtonElement) => void
}

export function WorkCard({ item, onOpen }: WorkCardProps) {
  const headingId = `work-${item.slug}-heading`

  return (
    <article
      className={`case-card case-card--${item.category}`}
      data-emphasis="primary"
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
        <h4 id={headingId}>{item.title}</h4>
        <p className="case-card__outcome">{item.outcome}</p>
        <div
          className="case-card__details"
          role="group"
          aria-label={`${item.title} capabilities`}
        >
          <ul className="case-card__capabilities" aria-label="Capabilities">
            {item.capabilities.slice(0, 3).map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
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
