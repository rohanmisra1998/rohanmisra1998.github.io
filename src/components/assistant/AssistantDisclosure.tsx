interface AssistantDisclosureProps {
  disclosure: string
}

export const assistantDisclosureId = 'ask-rohan-disclosure'

export function AssistantDisclosure({ disclosure }: AssistantDisclosureProps) {
  return (
    <div className="ask-rohan__disclosure">
      <p id={assistantDisclosureId}><span aria-hidden="true">●</span> {disclosure}</p>
      <details>
        <summary>How this works</summary>
        <p>
          Deterministic retrieval from approved public portfolio content. This is not a
          generative model or a virtual twin. Questions are not sent or saved.
        </p>
      </details>
    </div>
  )
}
