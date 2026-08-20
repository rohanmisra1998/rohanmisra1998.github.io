import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { portfolioContent } from '../content/portfolio-content'
import { SelectedWork } from './SelectedWork'

afterEach(cleanup)

describe('SelectedWork', () => {
  it('shows six home-visible cases and reveals all eight in place', async () => {
    const user = userEvent.setup()
    render(<SelectedWork items={portfolioContent.work} onOpenCase={vi.fn()} />)

    expect(screen.getAllByRole('button', { name: /Open case study:/i })).toHaveLength(6)
    expect(screen.queryByText('Performance and value-realization program')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'See all work' }))

    expect(screen.getAllByRole('button', { name: /Open case study:/i })).toHaveLength(8)
    expect(screen.getByText('Performance and value-realization program')).toBeVisible()
  })

  it('keeps Trail Pulse last and visually secondary in the initial collection', () => {
    render(<SelectedWork items={portfolioContent.work} onOpenCase={vi.fn()} />)

    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(6)
    expect(cards.at(-1)).toHaveAccessibleName('Trail Pulse')
    expect(cards.at(-1)).toHaveAttribute('data-emphasis', 'secondary')
  })

  it('shows approved evidence, industries, capability limits, and diligence disclosures', () => {
    render(<SelectedWork items={portfolioContent.work} onOpenCase={vi.fn()} />)

    const workforce = screen.getByRole('article', { name: 'Workforce operations transformation' })
    expect(within(workforce).getByText('Utilities')).toBeVisible()
    expect(within(workforce).getByText('10+ pilots implemented · 8%+ workforce-productivity improvement')).toBeVisible()
    expect(within(workforce).getAllByRole('listitem')).toHaveLength(3)

    const diligence = screen.getByRole('article', { name: 'Buy-side commercial diligence' })
    expect(diligence).toHaveTextContent('3+ buy-side diligences informing investor decisions')
    expect(diligence).toHaveTextContent(
      'Target identities, recommendations, conclusions, and transaction details remain private.'
    )
  })

  it('exposes a unique slug-derived visual variant for every case', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <SelectedWork items={portfolioContent.work} onOpenCase={vi.fn()} />
    )
    await user.click(screen.getByRole('button', { name: 'See all work' }))

    const variants = [...container.querySelectorAll<HTMLElement>('.case-card__visual')]
      .map((visual) => visual.dataset.visualVariant)

    expect(variants).toEqual([
      'workforce-operations-transformation',
      'buy-side-commercial-diligence',
      'omnichannel-payments-strategy',
      'talent-acquisition-operating-model',
      'life-sciences-sector-and-value-creation-scan',
      'trail-pulse',
      'performance-and-value-realization-program',
      'distribution-transformation-and-growth'
    ])
    expect(new Set(variants)).toHaveProperty('size', 8)
  })
})
