import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SelectedWork } from './SelectedWork'
import { siteContent } from '../content/site-content'

describe('SelectedWork', () => {
  it('keeps professional proof primary and Trail Pulse explicitly experimental', () => {
    render(<SelectedWork projects={siteContent.work} />)
    expect(screen.getByRole('article', { name: 'Transformation at scale' })).toHaveAttribute(
      'data-emphasis', 'primary'
    )
    const trailPulse = screen.getByRole('article', { name: 'Trail Pulse' })
    expect(trailPulse).toHaveAttribute('data-emphasis', 'secondary')
    expect(trailPulse).toHaveTextContent('Builder Lab · AI-assisted experiment')
    expect(trailPulse).toHaveTextContent('early vibe-coded product experiment')
    expect(screen.getByText('What Trail Pulse does')).toBeInTheDocument()
  })
})
