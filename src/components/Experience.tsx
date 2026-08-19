import type { ExperienceItem } from '../content/types'

interface ExperienceProps {
  items: ExperienceItem[]
}

export function Experience({ items }: ExperienceProps) {
  return (
    <section className="experience" id="experience" aria-labelledby="experience-heading">
      <div className="section-heading">
        <p className="section-label">Where I’ve operated</p>
        <h2 id="experience-heading">Experience</h2>
        <p className="section-heading__note">Recent first. Select a role for its public scope.</p>
      </div>

      <ol className="experience__list">
        {items.map((item, index) => (
          <li key={`${item.organization}-${item.location}-${item.period}`}>
            <article className="experience-row">
              <p className="experience-row__index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </p>
              <div className="experience-row__identity">
                <p className="experience-row__organization">{item.organization}</p>
                <h3>{item.role}</h3>
              </div>
              <div className="experience-row__meta">
                <p>{item.location}</p>
                <p>{item.period}</p>
              </div>
              <details className="experience-row__detail" open>
                <summary>Public scope</summary>
                <p>{item.summary}</p>
              </details>
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}
