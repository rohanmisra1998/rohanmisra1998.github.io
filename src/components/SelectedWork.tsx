import type { PersonalProjectItem, WorkGroup, WorkItem } from '../content/portfolio-types'
import { PersonalProjects } from './PersonalProjects'
import { WorkCard } from './WorkCard'

interface SelectedWorkProps {
  items: WorkItem[]
  projects: PersonalProjectItem[]
  onOpenCase: (slug: string, trigger: HTMLButtonElement) => void
}

export function SelectedWork({ items, projects, onOpenCase }: SelectedWorkProps) {
  const groups: ReadonlyArray<{ id: WorkGroup; label: string }> = [
    { id: 'tech-ai-growth', label: 'Tech × AI × Growth' },
    { id: 'operations-transformations', label: 'Operations × Large-scale transformations' }
  ]

  return (
    <section className="selected-work" id="work" aria-labelledby="selected-work-heading">
      <div className="selected-work__header">
        <h2 id="selected-work-heading">Selected work</h2>
      </div>

      {groups.map((group) => {
        const headingId = `work-group-${group.id}`
        return (
          <div
            className="selected-work__group"
            role="group"
            aria-labelledby={headingId}
            key={group.id}
          >
            <div className="selected-work__group-heading">
              <span aria-hidden="true" />
              <h3 id={headingId}>{group.label}</h3>
            </div>
            <div className="selected-work__grid">
              {items.filter((item) => item.group === group.id).map((item) => (
                <WorkCard item={item} onOpen={onOpenCase} key={item.slug} />
              ))}
            </div>
          </div>
        )
      })}
      <PersonalProjects items={projects} />
    </section>
  )
}
