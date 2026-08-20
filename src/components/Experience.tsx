import type { EducationItem, ExperienceItem } from '../content/portfolio-types'

interface ExperienceProps {
  items: ExperienceItem[]
  education: EducationItem[]
}

export function Experience({ items, education }: ExperienceProps) {
  return (
    <section className="experience" id="experience" aria-labelledby="experience-heading">
      <div className="experience__intro">
        <p className="section-label">Where I’ve operated</p>
        <h2 id="experience-heading">Experience</h2>
        <p>Professional work first, followed by the education that shaped the toolkit.</p>
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

        <div className="education" aria-labelledby="education-heading">
          <h3 id="education-heading">Education</h3>
          <ol>
            {education.map((item) => (
              <li key={`${item.institution}-${item.year}`}>
                <div>
                  <h4>{item.institution}</h4>
                  <p>{item.credential}</p>
                </div>
                <div className="education__meta">
                  <p>{item.distinction}</p>
                  <p>{item.year}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
