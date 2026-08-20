import type { PortfolioContent } from '../content/portfolio-types'

interface ProfileProps {
  content: PortfolioContent['about']
}

export function Profile({ content }: ProfileProps) {
  return (
    <section className="profile" id="profile" aria-labelledby="profile-heading">
      <div className="profile__intro">
        <p className="section-label">The longer version</p>
        <h2 id="profile-heading">Read more about me</h2>
      </div>
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
    </section>
  )
}
