interface OutsideWorkProps {
  interests: string[]
}

export function OutsideWork({ interests }: OutsideWorkProps) {
  return (
    <section className="outside-work" id="outside-work" aria-labelledby="outside-work-heading">
      <div className="outside-work__heading">
        <p className="section-label">Beyond the operating model</p>
        <h2 id="outside-work-heading">Outside work</h2>
        <p>Usually outside, underwater, on the road—or halfway down a history rabbit hole.</p>
      </div>
      <ul className="outside-work__interests" aria-label="Interests">
        {interests.map((interest) => (
          <li key={interest}>
            {interest}
          </li>
        ))}
      </ul>
    </section>
  )
}
