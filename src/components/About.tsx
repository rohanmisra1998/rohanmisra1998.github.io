interface AboutProps {
  interests: string[]
}

export function About({ interests }: AboutProps) {
  return (
    <section className="about" id="about" aria-labelledby="about-heading">
      <div className="about__heading">
        <p className="section-label">Beyond the résumé</p>
        <h2 id="about-heading">About</h2>
      </div>
      <div className="about__body">
        <p className="about__statement">
          The ambition is to keep getting closer to the technology, turn curiosity into useful
          things, and build toward something enduring.
        </p>
        <ul className="interest-list" aria-label="Interests">
          {interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
