import type { CaseArtifact as CaseArtifactData } from '../content/portfolio-types'

interface CaseArtifactProps {
  artifact: CaseArtifactData
}

export function CaseArtifact({ artifact }: CaseArtifactProps) {
  const titleId = `artifact-${artifact.kind}-title`

  return (
    <figure
      className="case-artifact"
      data-artifact-kind={artifact.kind}
      role="figure"
      aria-labelledby={titleId}
    >
      <figcaption>
        <span>Decision model</span>
        <strong id={titleId}>{artifact.title}</strong>
      </figcaption>
      <ol className="case-artifact__nodes">
        {artifact.nodes.map((node, index) => (
          <li key={node.label} style={{ '--node-index': index } as React.CSSProperties}>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <h4>{node.label}</h4>
            <p>{node.detail}</p>
          </li>
        ))}
      </ol>
      <p className="case-artifact__decision">
        <span>Call</span>
        {artifact.decision}
      </p>
    </figure>
  )
}
