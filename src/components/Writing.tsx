import type { PublicResearchItem, WritingItem } from '../content/portfolio-types'

interface WritingProps {
  items: WritingItem[]
  publicResearch: PublicResearchItem
}

export function Writing({ items, publicResearch }: WritingProps) {
  return (
    <section className="writing" id="writing" aria-labelledby="writing-heading">
      <div className="section-heading section-heading--writing">
        <p className="section-label">Published thinking</p>
        <h2 id="writing-heading">Writing</h2>
        <p className="section-heading__note">Three essays from the archive, in full on LinkedIn.</p>
      </div>

      <div className="writing__list">
        {items.map((item) => (
          <a
            className="writing-row"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title} — LinkedIn, opens in a new tab`}
            key={item.href}
          >
            <p className="writing-row__date">{item.published}</p>
            <div className="writing-row__body">
              <h3>{item.title}</h3>
              <p>{item.theme}</p>
            </div>
            <span className="writing-row__action">
              LinkedIn <span aria-hidden="true">↗</span>
            </span>
          </a>
        ))}
        <a
          className="writing-row writing-row--research"
          href={publicResearch.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${publicResearch.title} — public report PDF, opens in a new tab`}
        >
          <p className="writing-row__date">Public research</p>
          <div className="writing-row__body">
            <h3>{publicResearch.title}</h3>
            <p>{publicResearch.role} · {publicResearch.industry}</p>
            <p className="writing-row__summary">{publicResearch.summary}</p>
          </div>
          <span className="writing-row__action">
            Read PDF <span aria-hidden="true">↗</span>
          </span>
        </a>
      </div>
    </section>
  )
}
