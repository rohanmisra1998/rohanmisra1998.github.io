import { useState } from 'react'
import type { WorkItem } from '../content/portfolio-types'
import { WorkCard } from './WorkCard'

interface SelectedWorkProps {
  items: WorkItem[]
  onOpenCase: (slug: string, trigger: HTMLButtonElement) => void
}

export function SelectedWork({ items, onOpenCase }: SelectedWorkProps) {
  const [showAll, setShowAll] = useState(false)
  const homeItems = items.filter((item) => item.homeVisible)
  const visibleItems = showAll ? items : homeItems

  return (
    <section className="selected-work" id="work" aria-labelledby="selected-work-heading">
      <div className="selected-work__header">
        <p className="section-label">Selected evidence</p>
        <div>
          <h2 id="selected-work-heading">Selected work</h2>
          <p>Operating transformations, product strategy, and diligence—shown through approved evidence.</p>
        </div>
      </div>

      <div className="selected-work__grid">
        {visibleItems.map((item) => (
          <WorkCard item={item} onOpen={onOpenCase} key={item.slug} />
        ))}
      </div>

      {!showAll && items.length > homeItems.length && (
        <button className="selected-work__reveal" type="button" onClick={() => setShowAll(true)}>
          See all work
          <span aria-hidden="true">+{items.length - homeItems.length}</span>
        </button>
      )}
    </section>
  )
}
