import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { portfolioContent } from '../content/portfolio-content'
import { CaseArtifact } from './CaseArtifact'

afterEach(cleanup)

const expectedLabels = {
  'omnichannel-payments-strategy': ['Merchant segment', 'Activation & take rate', 'Margin & payback', 'Rollout phase'],
  'buy-side-commercial-diligence': ['Market attractiveness', 'Right to win', 'Value creation', 'Downside risk'],
  'talent-acquisition-operating-model': ['Apply', 'AI screening', 'Scheduling', 'Structured interview', 'Feedback loop'],
  'workforce-operations-transformation': ['Work demand', 'Planning', 'Crew schedule', 'Field execution', 'KPI loop'],
  'performance-and-value-realization-program': ['Sourcing', 'Footprint', 'Inventory', 'Logistics'],
  'pharma-life-sciences-growth-transformation': ['Retain', 'Improve', 'Exit', 'Expand']
} as const

describe('CaseArtifact', () => {
  for (const item of portfolioContent.work) {
    it(`renders the ${item.artifact.kind} decision model as semantic evidence`, () => {
      render(<CaseArtifact artifact={item.artifact} />)

      const figure = screen.getByRole('figure', { name: item.artifact.title })
      expect(figure).toHaveAttribute('data-artifact-kind', item.artifact.kind)
      expect(within(figure).getAllByRole('listitem').map((node) => (
        within(node).getByRole('heading', { level: 4 }).textContent
      ))).toEqual(expectedLabels[item.slug as keyof typeof expectedLabels])
      expect(figure).toHaveTextContent(item.artifact.decision)
    })
  }

  it('keeps every case on a distinct artifact geometry', () => {
    expect(new Set(portfolioContent.work.map(({ artifact }) => artifact.kind)).size).toBe(6)
  })
})
