import { useState } from 'react'
import type { PortfolioContent } from '../content/portfolio-types'

interface ProfileProps {
  content: PortfolioContent['about']
}

export function Profile({ content }: ProfileProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section
      className="profile"
      id="profile"
      aria-labelledby="profile-heading"
      data-open={isOpen}
    >
      <h2
        className="profile__toggle-heading"
        id="profile-heading"
        aria-label="Read more about me"
      >
        <button
          className="profile__toggle"
          type="button"
          aria-label="Read more about me"
          aria-expanded={isOpen}
          aria-controls="profile-details"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span>
            <span className="section-label">The longer version</span>
            <span className="profile__toggle-label">Read more about me</span>
          </span>
          <span className="profile__toggle-mark" aria-hidden="true">{isOpen ? '×' : '+'}</span>
        </button>
      </h2>
      <div
        className="profile__details"
        id="profile-details"
        aria-hidden={isOpen ? undefined : true}
      >
        <div className="profile__details-inner">
          <div className="profile__story">
            <p>{content.statement}</p>
            <ul className="profile__proof" aria-label="Career highlights">
              {content.achievements.map(({ metric, detail }) => (
                <li key={metric}>
                  <strong>{metric}</strong>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
