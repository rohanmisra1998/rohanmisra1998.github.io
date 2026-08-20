import type { EducationItem } from '../content/portfolio-types'

interface EducationProps {
  items: EducationItem[]
}

export function Education({ items }: EducationProps) {
  return (
    <section className="education" id="education" aria-labelledby="education-heading">
      <div className="section-heading">
        <p className="section-label">Academic foundation</p>
        <h2 id="education-heading">Education</h2>
        <p className="section-heading__note">The analytical foundation behind the operating toolkit.</p>
      </div>
      <ol className="education__list">
        {items.map((item) => (
          <li key={`${item.institution}-${item.year}`}>
            <div>
              <h3>{item.institution}</h3>
              <p>{item.credential}</p>
            </div>
            <div className="education__meta">
              <p>{item.distinction}</p>
              <p>{item.year}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
