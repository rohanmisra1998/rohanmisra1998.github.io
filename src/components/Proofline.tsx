interface ProoflineProps {
  variant: 'hero' | 'timeline'
}

export function Proofline({ variant }: ProoflineProps) {
  const path = variant === 'hero'
    ? 'M12 118 C110 18 184 174 292 76 S480 18 620 92'
    : 'M24 8 C80 96 12 188 88 270 S46 430 110 520'

  return (
    <svg
      className={`proofline proofline--${variant}`}
      data-testid="proofline"
      aria-hidden="true"
      viewBox={variant === 'hero' ? '0 0 640 150' : '0 0 140 540'}
    >
      <path className="proofline__ghost" d={path} />
      <path className="proofline__signal" d={path} pathLength="1" />
      <circle cx="292" cy="76" r="6" className="proofline__node" />
    </svg>
  )
}
