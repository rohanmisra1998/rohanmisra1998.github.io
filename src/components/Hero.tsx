import type { PortfolioContent } from '../content/portfolio-types'
import { publicAsset } from '../lib/publicAsset'

export interface HeroProps {
  content: PortfolioContent['hero']
  onOpenAssistant(trigger: HTMLButtonElement): void
}

export function Hero({ content, onOpenAssistant }: HeroProps) {
  return (
    <section className="hero" id="overview" aria-labelledby="hero-headline">
      <div className="hero__copy reveal">
        <p className="hero__eyebrow">{content.eyebrow}</p>
        <h1 id="hero-headline">{content.headline}</h1>
        <p className="hero__current">{content.current}</p>
        <div className="hero__actions" aria-label="Explore Rohan's portfolio">
          <a className="action action--primary" href="#work">
            Explore selected work
          </a>
          <button
            className="action action--assistant"
            type="button"
            onClick={(event) => onOpenAssistant(event.currentTarget)}
          >
            Ask Rohan AI <span aria-hidden="true">✦</span>
          </button>
          <a className="action action--quiet" href="#writing">Read my writing</a>
        </div>
        <ul className="hero__chips" aria-label="Areas of expertise">
          {content.chips.map((chip) => <li key={chip}>{chip}</li>)}
        </ul>
      </div>
      <figure className="hero__portrait reveal">
        <div className="hero__portrait-card">
          <picture>
            <source srcSet={publicAsset('images/rohan-portrait.webp')} type="image/webp" />
            <img
              src={publicAsset('images/rohan-portrait.png')}
              alt="Rohan Misra in a modern office setting"
              width="920"
              height="1150"
            />
          </picture>
          <figcaption className="hero__portrait-caption">
            Operator, strategist, and hands-on builder.
          </figcaption>
        </div>
      </figure>
    </section>
  )
}
