import type { ExpertiseGroup } from '../content/portfolio-types'

interface ExpertiseProps {
  groups: ExpertiseGroup[]
}

export function Expertise({ groups }: ExpertiseProps) {
  return (
    <section className="expertise" id="expertise" aria-labelledby="expertise-heading">
      <div className="section-heading">
        <p className="section-label">Working toolkit</p>
        <h2 id="expertise-heading">Expertise</h2>
        <p className="section-heading__note">Six practical groups built through operating, advising, and shipping.</p>
      </div>

      <div className="expertise__grid">
        {groups.map((group) => (
          <article className="expertise-group" key={group.title}>
            <h3>{group.title}</h3>
            <ul>
              {group.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
