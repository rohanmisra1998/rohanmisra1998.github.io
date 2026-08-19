import { Proofline } from './Proofline'

interface HeroContent {
  headline: string
  subhead: string
  location: string
}

interface HeroProps {
  content: HeroContent
}

export function Hero({ content }: HeroProps) {
  return (
    <section className="hero" id="overview" aria-labelledby="hero-headline">
      <div className="hero__copy reveal">
        <p className="hero__eyebrow">
          <span>Tech-first operator</span>
          <span aria-hidden="true">/</span>
          <span>{content.location}</span>
        </p>
        <h1 id="hero-headline">{content.headline}</h1>
        <p className="hero__subhead">{content.subhead}</p>
        <div className="hero__actions" aria-label="Explore Rohan's work">
          <a className="action action--primary" href="#work">
            See what I’m building <span aria-hidden="true">↘</span>
          </a>
          <a className="action action--quiet" href="#writing">
            Read my thinking <span aria-hidden="true">↘</span>
          </a>
        </div>
        <dl className="hero__scope" aria-label="Current focus">
          <div>
            <dt>Working across</dt>
            <dd>Marketplaces + operational scale</dd>
          </div>
          <div>
            <dt>Growing focus</dt>
            <dd>Applied AI</dd>
          </div>
        </dl>
      </div>
      <figure className="hero__portrait reveal">
        <picture>
          <source srcSet="/images/rohan-portrait.avif" type="image/avif" />
          <source srcSet="/images/rohan-portrait.webp" type="image/webp" />
          <img
            src="/images/rohan-portrait.png"
            alt="Rohan Misra in a modern office setting"
            width="920"
            height="1150"
          />
        </picture>
        <figcaption>
          <span>Strategy as a toolkit.</span>
          <span>Building as the goal.</span>
        </figcaption>
      </figure>
      <div className="hero__proofline">
        <Proofline variant="hero" />
      </div>
    </section>
  )
}
