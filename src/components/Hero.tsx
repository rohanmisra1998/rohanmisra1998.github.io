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
    <section id="overview" aria-labelledby="hero-headline">
      <div>
        <p>Tech-first operator · San Jose</p>
        <h1 id="hero-headline">{content.headline}</h1>
        <p>{content.subhead}</p>
        <p>
          <a href="#work">See what I’m building</a>
          <a href="#writing">Read my thinking</a>
        </p>
      </div>
      <picture>
        <img
          src="/images/rohan-portrait.png"
          alt="Portrait of Rohan Misra"
          width="920"
          height="1150"
        />
      </picture>
    </section>
  )
}
