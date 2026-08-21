import type { WorkItem } from '../content/portfolio-types'

interface WorkCardProps {
  item: WorkItem
  onOpen: (slug: string, trigger: HTMLButtonElement) => void
}

const visualParts: Record<string, readonly [string, string, string]> = {
  'omnichannel-payments-strategy': ['online-channel', 'payment-hub', 'pos-channel'],
  'buy-side-commercial-diligence': ['market-evidence', 'investment-filter', 'risk-evidence'],
  'talent-acquisition-operating-model': ['candidate-flow', 'ai-orchestration', 'capacity-release'],
  'workforce-operations-transformation': ['crew-one', 'crew-two', 'crew-three'],
  'performance-and-value-realization-program': ['region-network', 'value-hub', 'savings-path'],
  'pharma-life-sciences-growth-transformation': ['therapy-product', 'distribution-hub', 'expansion-network']
}

export function WorkCard({ item, onOpen }: WorkCardProps) {
  const headingId = `work-${item.slug}-heading`
  const parts = visualParts[item.slug]

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
        {parts.map((part) => <span data-shape-role={part} key={part} />)}
      </div>
      <div className="case-card__body">
        <p className="case-card__industry">{item.industry}</p>
        <h4 id={headingId}>{item.title}</h4>
        <p className="case-card__impact-type">{item.impactType}</p>
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
