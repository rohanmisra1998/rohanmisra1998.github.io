import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SelectedWork } from './SelectedWork'
import { siteContent } from '../content/site-content'

afterEach(cleanup)

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

  it('renders every approved proof and the qualified Trail Pulse capabilities', () => {
    render(<SelectedWork projects={siteContent.work} />)
    const transformation = screen.getByRole('article', { name: 'Transformation at scale' })
    for (const proof of [
      '10+ pilots implemented',
      '8%+ productivity improvement',
      '~15K hours saved annually',
      'Multi-year roadmaps'
    ]) {
      expect(within(transformation).getByText(proof)).toBeInTheDocument()
    }

    const trailPulse = screen.getByRole('article', { name: 'Trail Pulse' })
    for (const capability of [
      'Discovery + recommendations',
      'Trail intelligence',
      'Logistics',
      'Exact navigation'
    ]) {
      expect(within(trailPulse).getByText(capability, { selector: 'h4' })).toBeInTheDocument()
    }
    expect(trailPulse).toHaveTextContent(
      'When actual trail geometry passes strict validation, Trail Pulse exports the complete route as GPX/KML so the trail a user discovers is the trail they can navigate. Routes without defensible geometry remain honestly trailhead-only.'
    )
  })

  it('keeps both external work actions exact and isolated from the opener', () => {
    render(<SelectedWork projects={siteContent.work} />)
    const report = screen.getByRole('link', { name: 'Read the report' })
    expect(report).toHaveAttribute(
      'href',
      'https://laureatesandleaders.org/a-fair-share-for-children-preventing-the-loss-of-a-generation-to-covid-19/'
    )

    for (const link of [report, screen.getByRole('link', { name: 'Try Trail Pulse' })]) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')?.split(/\s+/)).toEqual(
        expect.arrayContaining(['noopener', 'noreferrer'])
      )
    }
  })
})
