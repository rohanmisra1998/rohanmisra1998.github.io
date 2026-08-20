import type { PersonalProjectItem } from '../content/portfolio-types'

interface PersonalProjectsProps {
  items: PersonalProjectItem[]
}

export function PersonalProjects({ items }: PersonalProjectsProps) {
  return (
    <section className="builder-lab" id="personal-projects" aria-labelledby="personal-projects-heading">
      <div className="section-heading section-heading--compact">
        <p className="section-label">Built hands-on</p>
        <h2 id="personal-projects-heading">Personal projects</h2>
        <p className="section-heading__note">
          A bias to action, made tangible: self-directed builds where I learn fast, get technical, and ship working systems.
        </p>
      </div>

      <div className="builder-lab__grid">
        {items.map((item) => {
          const headingId = `project-${item.slug}-heading`
          return (
            <article className="builder-card" aria-labelledby={headingId} key={item.slug}>
              <p className="builder-card__index" aria-hidden="true">
                {item.slug === 'portfolio' ? 'Project 01' : 'Project 02'}
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
