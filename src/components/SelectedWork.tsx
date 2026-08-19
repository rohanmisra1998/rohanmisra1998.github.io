import type { WorkItem } from '../content/types'
import { publicAsset } from '../lib/publicAsset'

interface SelectedWorkProps {
  projects: WorkItem[]
}

function ExternalArrow() {
  return <span aria-hidden="true">↗</span>
}

export function SelectedWork({ projects }: SelectedWorkProps) {
  const transformation = projects.find(({ slug }) => slug === 'transformation-at-scale')
  const trailPulse = projects.find(({ slug }) => slug === 'trail-pulse')
  const socialImpact = projects.find(({ slug }) => slug === 'a-fair-share-for-children')

  if (!transformation || !trailPulse || !socialImpact) {
    return null
  }

  const reportLink = socialImpact.links[0]
  const trailPulseLink = trailPulse.links[0]

  return (
    <section className="selected-work" id="work" aria-labelledby="selected-work-heading">
      <div className="selected-work__header">
        <p className="section-label">Selected evidence</p>
        <h2 id="selected-work-heading">Selected work</h2>
      </div>

      <article
        className="work-card work-card--primary"
        data-emphasis={transformation.emphasis}
        aria-labelledby={`${transformation.slug}-heading`}
      >
        <div className="operator-proof__intro">
          <p className="work-card__eyebrow">{transformation.eyebrow}</p>
          <h3 id={`${transformation.slug}-heading`}>{transformation.title}</h3>
          <p className="operator-proof__summary">{transformation.summary}</p>
        </div>

        <div className="operator-proof__evidence" aria-label="Verified transformation evidence">
          {transformation.capabilities.map((capability) => (
            <div className="operator-proof__evidence-item" key={capability.title}>
              <h4>{capability.title}</h4>
              <p>{capability.description}</p>
            </div>
          ))}
        </div>

        <aside className="social-proof" aria-labelledby={`${socialImpact.slug}-heading`}>
          <div>
            <p className="work-card__eyebrow">{socialImpact.eyebrow}</p>
            <h4 id={`${socialImpact.slug}-heading`}>{socialImpact.title}</h4>
          </div>
          <p>{socialImpact.summary}</p>
          {reportLink && (
            <a href={reportLink.href} target="_blank" rel="noreferrer">
              {reportLink.label} <ExternalArrow />
            </a>
          )}
        </aside>
      </article>

      <article
        className="work-card builder-lab"
        data-emphasis={trailPulse.emphasis}
        aria-labelledby={`${trailPulse.slug}-heading`}
      >
        <figure className="builder-lab__image">
          <img
            src={publicAsset(trailPulse.image.src)}
            alt={trailPulse.image.alt}
            width="1440"
            height="900"
            loading="lazy"
            decoding="async"
          />
        </figure>

        <div className="builder-lab__body">
          <p className="work-card__eyebrow">{trailPulse.eyebrow}</p>
          <h3 id={`${trailPulse.slug}-heading`}>{trailPulse.title}</h3>
          <p className="builder-lab__summary">{trailPulse.summary}</p>
          {trailPulse.honestyNote && (
            <p className="builder-lab__honesty">{trailPulse.honestyNote}</p>
          )}

          <details className="builder-lab__details">
            <summary>What Trail Pulse does</summary>
            <div className="builder-lab__capabilities">
              {trailPulse.capabilities.map((capability) => (
                <article key={capability.title}>
                  <h4>{capability.title}</h4>
                  <p>{capability.description}</p>
                </article>
              ))}
            </div>
          </details>

          {trailPulseLink && (
            <a
              className="builder-lab__action"
              href={trailPulseLink.href}
              target="_blank"
              rel="noreferrer"
            >
              {trailPulseLink.label} <ExternalArrow />
            </a>
          )}
        </div>
      </article>
    </section>
  )
}
