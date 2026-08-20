import type { PortfolioContent } from '../content/portfolio-types'

interface AboutProps { content: PortfolioContent['about'] }

export function About({ content }: AboutProps) {
  return (
    <section className="about" id="about" aria-labelledby="about-heading">
      <div className="about__heading">
        <p className="section-label">Beyond the résumé</p>
        <h2 id="about-heading">About</h2>
      </div>
      <div className="about__body">
        <p className="about__statement">{content.statement}</p>
        <aside
          className="about__assistant"
          id="about-assistant"
          aria-labelledby="about-assistant-heading"
        >
          <p className="section-label">Trust note</p>
          <h3 id="about-assistant-heading">About this assistant</h3>
          <p>
            Ask Rohan AI uses deterministic retrieval from approved public portfolio
            content. It is not a generative model or a virtual twin. Questions are
            processed locally and are not sent over the network or saved in browser storage.
          </p>
        </aside>
      </div>
    </section>
  )
}
