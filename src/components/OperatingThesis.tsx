interface OperatingThesisProps {
  copy: string
}

export function OperatingThesis({ copy }: OperatingThesisProps) {
  return (
    <section aria-labelledby="operating-thesis-heading">
      <h2 id="operating-thesis-heading">From ambiguity to execution</h2>
      <p>{copy}</p>
    </section>
  )
}
