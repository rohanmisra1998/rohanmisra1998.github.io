import { describe, expect, it } from 'vitest'
import { portfolioContent } from './portfolio-content'

const serialized = JSON.stringify(portfolioContent)

describe('approved public portfolio content', () => {
  it('uses the binding chronology and complete career path', () => {
    expect(portfolioContent.experience.map(({ organization, period }) => [organization, period]))
      .toEqual([
        ['eBay', 'July 2025–present'],
        ['Bain & Company', '2024–July 2025'],
        ['Legacy Pursuit', 'Summer 2024'],
        ['Bain & Company', '2019–2023']
      ])
  })

  it('publishes six CV-grounded cases in the approved technology-first order', () => {
    expect(portfolioContent.work.map(({ slug }) => slug)).toEqual([
      'omnichannel-payments-strategy',
      'buy-side-commercial-diligence',
      'talent-acquisition-operating-model',
      'workforce-operations-transformation',
      'performance-and-value-realization-program',
      'pharma-life-sciences-growth-transformation'
    ])
    expect(portfolioContent.work.map((item) => (item as unknown as { group?: string }).group))
      .toEqual([
        'tech-ai-growth',
        'tech-ai-growth',
        'tech-ai-growth',
        'operations-transformations',
        'operations-transformations',
        'operations-transformations'
      ])

    for (const item of portfolioContent.work) {
      expect(item.industry).not.toBe('')
      expect(item.capabilities.length).toBeGreaterThanOrEqual(4)
      expect(item.thesis).not.toBe('')
      expect(item.challenge).not.toBe('')
      expect(item.approach).not.toBe('')
      expect(item.outcome).not.toBe('')
      expect(item.scale).not.toBe('')
      expect(item.impactType).not.toBe('')
      expect(item.role.position).not.toBe('')
      expect(item.role.owned).not.toBe('')
      expect(item.role.partneredWith).not.toBe('')
      expect(item.keyDecision).not.toBe('')
      expect(item.artifact.title).not.toBe('')
      expect(item.artifact.nodes.length).toBeGreaterThanOrEqual(4)
    }

    expect(new Set(portfolioContent.work.map(({ artifact }) => artifact.kind)).size).toBe(6)
  })

  it('uses the approved scale, impact classes, and outcomes', () => {
    const [payments, diligence, talent, utilities, automotive, pharma] = portfolioContent.work

    expect(payments.industry).toContain("India's largest payments platform")
    expect(payments).toMatchObject({
      scale: "India's largest payments platform · Four-year roadmap",
      impactType: 'Modeled opportunity',
      outcome: '$150M+ value-uplift path.'
    })
    expect(diligence).toMatchObject({
      scale: 'Multiple buy-side diligences · B2B SaaS and logistics',
      impactType: 'Decision impact',
      outcome: 'Informed X buy-side investment theses.'
    })
    expect(talent).toMatchObject({
      scale: 'Close to 1M applicants annually',
      impactType: 'Implementation target',
      outcome: '~15,000 hours of annual recruiting and talent-team capacity.'
    })
    expect(utilities).toMatchObject({
      scale: '~$9B enterprise · 10+ operating centers',
      impactType: 'Realized impact',
      outcome: '$20M+ delivered savings · 8%+ productivity improvement.'
    })
    expect(automotive).toMatchObject({
      scale: '~$15B enterprise · Five regions · 10+ levers',
      impactType: 'Validated opportunity',
      outcome: '$40M+ savings identified across five regions.'
    })
    expect(pharma).toMatchObject({
      scale: '~$4B enterprise · 700+ districts assessed',
      impactType: 'Execution result',
      outcome: '30%+ distributor rationalization · ~200 priority markets.'
    })
  })

  it('keeps personal builds separate and frames Trail Pulse as technical agency', () => {
    const personalProjects = portfolioContent.personalProjects

    expect(portfolioContent.work.filter(({ category }) => category === 'diligence')
      .every((item) => !('maturityNote' in item))).toBe(true)
    expect(personalProjects?.find(({ slug }) => slug === 'trail-pulse')?.honestyNote)
      .toBe('An early AI-assisted prototype built end-to-end to learn modern product development and demonstrate technical agency.')
    expect(portfolioContent.work.find(({ slug }) => slug === 'trail-pulse')).toBeUndefined()
    expect(serialized).not.toMatch(/No target|Target identities|transaction detail is disclosed/i)
    expect(serialized).not.toMatch(/vibe-coded/i)
  })

  it('shows exactly the two approved Bain proof points', () => {
    expect(portfolioContent.about.achievements).toEqual([
      {
        metric: '5 promotions',
        detail: 'Five promotions in under four years at Bain on a top-rated, accelerated trajectory.'
      },
      {
        metric: '~$250M',
        detail: '~$250M in value across Bain engagements.'
      }
    ])
    expect(serialized).not.toMatch(/Youngest student|\$210M\+/i)
  })

  it('publishes only the approved direct email action and no private phone data', () => {
    expect(portfolioContent.publicResearch.href).toBe(
      'https://www.laureatesandleaders.org/_files/ugd/811759_44700bb3bf134c7fa1e15adade4daa51.pdf'
    )
    expect(serialized).not.toContain('laureatesandleaders.org/a-fair-share-for-children')
    expect(serialized.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g)).toEqual([
      'misrarohan619@gmail.com',
      'misrarohan619@gmail.com'
    ])
    expect(serialized).not.toMatch(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/)
    expect(portfolioContent.contact).toEqual({
      linkedinHref: 'https://www.linkedin.com/in/rohan-misra-mba/',
      emailAddress: 'misrarohan619@gmail.com',
      mailtoHref: 'mailto:misrarohan619@gmail.com'
    })
    expect(serialized).not.toMatch(/resumeHref|CV · updating/i)
  })
})
