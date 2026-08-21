import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { portfolioContent } from '../content/portfolio-content'
import { SelectedWork } from './SelectedWork'

afterEach(cleanup)

describe('SelectedWork', () => {
  it('shows seven approved cases followed by Personal projects inside Selected work', () => {
    render(<SelectedWork items={portfolioContent.work} projects={portfolioContent.personalProjects} onOpenCase={vi.fn()} />)

    expect(screen.getAllByRole('button', { name: /Open case study:/i })).toHaveLength(7)
    expect(screen.queryByRole('button', { name: 'See all work' })).not.toBeInTheDocument()

    const tech = screen.getByRole('group', { name: 'Tech × AI × Growth' })
    const operations = screen.getByRole('group', {
      name: 'Operations × Large-scale transformations'
    })
    const projects = screen.getByRole('group', { name: 'Personal projects' })
    expect(within(tech).getAllByRole('article').map((card) => card.getAttribute('aria-labelledby')))
      .toEqual([
        'work-end-to-end-parts-buyer-experience-heading',
        'work-omnichannel-payments-strategy-heading',
        'work-buy-side-commercial-diligence-heading',
        'work-talent-acquisition-operating-model-heading'
      ])
    expect(within(operations).getAllByRole('article').map((card) => card.getAttribute('aria-labelledby')))
      .toEqual([
        'work-workforce-operations-transformation-heading',
        'work-performance-and-value-realization-program-heading',
        'work-pharma-life-sciences-growth-transformation-heading'
      ])
    expect(within(projects).getAllByRole('article')).toHaveLength(2)
  })

  it('leads with CV-grounded outcomes, industries, and technical transformation skills', () => {
    render(<SelectedWork items={portfolioContent.work} projects={portfolioContent.personalProjects} onOpenCase={vi.fn()} />)

    const ebay = screen.getByRole('article', { name: "Reimagining eBay's parts buyer experience" })
    expect(within(ebay).getByText('eBay · Global marketplace')).toBeVisible()
    expect(ebay).toHaveTextContent('~$XXM incremental GMV opportunity')
    expect(ebay).toHaveTextContent('Buyer-experience strategy')

    const payments = screen.getByRole('article', { name: 'Omnichannel payments growth strategy' })
    expect(within(payments).getByText(/India's largest payments platform/)).toBeVisible()
    expect(payments).toHaveTextContent('$150M+ realized GMV uplift')

    const talent = screen.getByRole('article', { name: 'AI-led talent acquisition transformation' })
    expect(talent).toHaveTextContent('AI-tool integration')
    expect(talent).toHaveTextContent('15,000 recruiting hours saved annually')

    const diligence = screen.getByRole('article', { name: 'B2B SaaS & logistics investment diligence' })
    expect(within(diligence).getByText(/B2B SaaS and logistics/)).toBeVisible()
    expect(within(diligence).getByText('Market assessment')).toBeVisible()
    expect(diligence).toHaveTextContent('X buy-side investment theses')

    const pharma = screen.getByRole('article', { name: 'Pharma distribution & life-sciences growth' })
    expect(pharma).toHaveTextContent('30%+')
    expect(pharma).toHaveTextContent('expansion enabled across 200+ districts')
    expect(within(screen.getByRole('group', { name: 'Personal projects' }))
      .getByRole('article', { name: 'Trail Pulse' })).toBeVisible()
  })

  it('labels the impact on seven equally weighted cards', () => {
    const { container } = render(
      <SelectedWork items={portfolioContent.work} projects={portfolioContent.personalProjects} onOpenCase={vi.fn()} />
    )

    expect(screen.getAllByText(/^(In-flight impact|Investment decisions|Realized impact|Identified opportunity|Execution result)$/))
      .toHaveLength(7)

    const cases = [...container.querySelectorAll<HTMLElement>('.case-card')]
    expect(cases).toHaveLength(7)
    expect(cases.every((card) => card.dataset.emphasis === 'primary')).toBe(true)
    expect(container.querySelector('[data-featured]')).not.toBeInTheDocument()
  })

  it('exposes a unique slug-derived visual variant for every case', () => {
    const { container } = render(
      <SelectedWork items={portfolioContent.work} projects={portfolioContent.personalProjects} onOpenCase={vi.fn()} />
    )

    const variants = [...container.querySelectorAll<HTMLElement>('.case-card__visual')]
      .map((visual) => visual.dataset.visualVariant)

    expect(variants).toEqual([
      'end-to-end-parts-buyer-experience',
      'omnichannel-payments-strategy',
      'buy-side-commercial-diligence',
      'talent-acquisition-operating-model',
      'workforce-operations-transformation',
      'performance-and-value-realization-program',
      'pharma-life-sciences-growth-transformation'
    ])
    expect(new Set(variants)).toHaveProperty('size', 7)
  })
})
