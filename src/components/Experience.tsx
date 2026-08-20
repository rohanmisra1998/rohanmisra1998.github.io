import type { ExperienceItem } from '../content/portfolio-types'

interface ExperienceProps {
  items: ExperienceItem[]
}

export function Experience({ items }: ExperienceProps) {
  return (
    <section className="experience" id="experience" aria-labelledby="experience-heading">
      <div className="experience__intro">
        <p className="section-label">Where I’ve operated</p>
        <h2 id="experience-heading">Experience</h2>
        <p>Operating, transformation, and diligence work across technology and industry.</p>
      </div>

      <div className="experience__body">
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
                  <p>{item.period}</p>
                  <p>{item.location}</p>
                </div>
                <p className="experience-row__summary">{item.summary}</p>
              </article>
            </li>
          ))}
        </ol>

      </div>
    </section>
  )
}
