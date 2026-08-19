import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Proofline } from './Proofline'

describe('Proofline', () => {
  it.each(['hero', 'timeline'] as const)('keeps the %s proof node inside its viewBox', (variant) => {
    const { container } = render(<Proofline variant={variant} />)
    const svg = container.querySelector('svg')
    const node = container.querySelector('circle')
    const [x, y, width, height] = svg!.getAttribute('viewBox')!.split(' ').map(Number)
    const cx = Number(node!.getAttribute('cx'))
    const cy = Number(node!.getAttribute('cy'))
    const radius = Number(node!.getAttribute('r'))

    expect(cx - radius).toBeGreaterThanOrEqual(x)
    expect(cx + radius).toBeLessThanOrEqual(x + width)
    expect(cy - radius).toBeGreaterThanOrEqual(y)
    expect(cy + radius).toBeLessThanOrEqual(y + height)
  })
})
