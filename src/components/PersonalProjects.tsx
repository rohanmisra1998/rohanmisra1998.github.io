import type { PersonalProjectItem } from '../content/portfolio-types'

interface PersonalProjectsProps {
  items: PersonalProjectItem[]
}

export function PersonalProjects({ items }: PersonalProjectsProps) {
  return (
    <div
      className="selected-work__group selected-work__group--projects"
      id="personal-projects"
      role="group"
      aria-labelledby="personal-projects-heading"
    >
      <div className="selected-work__group-heading">
        <span aria-hidden="true" />
        <div>
          <h3 id="personal-projects-heading">Personal projects</h3>
          <p className="selected-work__group-note">
            A bias to action, made tangible: self-directed builds where I learn fast, get technical, and ship working systems.
          </p>
        </div>
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
    </div>
  )
}
