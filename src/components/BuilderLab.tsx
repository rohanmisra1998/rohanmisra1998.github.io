import type { BuilderItem } from '../content/portfolio-types'

interface BuilderLabProps {
  items: BuilderItem[]
}

export function BuilderLab({ items }: BuilderLabProps) {
  return (
    <section className="builder-lab" id="builder-lab" aria-labelledby="builder-lab-heading">
      <div className="section-heading section-heading--compact">
        <p className="section-label">Smaller experiments</p>
        <h2 id="builder-lab-heading">Builder Lab</h2>
        <p className="section-heading__note">Hands-on builds that complement the professional work above.</p>
      </div>

      <div className="builder-lab__grid">
        {items.map((item) => {
          const headingId = `builder-${item.slug}-heading`
          return (
            <article className="builder-card" aria-labelledby={headingId} key={item.slug}>
              <p className="builder-card__index" aria-hidden="true">
                {item.slug === 'portfolio' ? 'Build 01' : 'Build 02'}
              </p>
              <h3 id={headingId}>{item.title}</h3>
              <p className="builder-card__description">{item.description}</p>
              <ul aria-label={`${item.title} capabilities`}>
                {item.capabilities.map((capability) => <li key={capability}>{capability}</li>)}
              </ul>
              {item.honestyNote && <p className="builder-card__honesty">{item.honestyNote}</p>}
              {item.href && (
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  Try Trail Pulse <span aria-hidden="true">↗</span>
                </a>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
