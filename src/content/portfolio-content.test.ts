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
      expect(item).not.toHaveProperty('artifact')
    }
  })

  it('uses the approved scale, impact classes, and outcomes', () => {
    const [payments, diligence, talent, utilities, automotive, pharma] = portfolioContent.work

    expect(payments.industry).toContain("India's largest payments platform")
    expect(payments).toMatchObject({
      title: 'Omnichannel payments growth strategy',
      scale: "India's largest payments platform · Four-year product and GTM roadmap",
      impactType: 'Realized impact',
      outcome: '$150M+ realized GMV uplift.'
    })
    expect(diligence).toMatchObject({
      scale: 'X buy-side diligences · B2B SaaS and logistics',
      impactType: 'Investment decisions',
      outcome: 'X buy-side investment theses informed.'
    })
    expect(talent).toMatchObject({
      title: 'AI-led talent acquisition transformation',
      scale: '~1M applicants annually · Enterprise recruiting',
      impactType: 'Realized impact',
      outcome: '~15,000 recruiting hours saved annually.'
    })
    expect(utilities).toMatchObject({
      title: 'Utilities field-operations transformation',
      scale: '~$9B utility · 10+ operating centers',
      impactType: 'Realized impact',
      outcome: '$20M+ savings delivered · 8%+ workforce productivity improvement.'
    })
    expect(automotive).toMatchObject({
      title: 'Automotive supply-chain transformation',
      scale: '~$15B enterprise · Five regions · 10+ levers',
      impactType: 'Identified opportunity',
      outcome: '$40M+ savings identified across five regions.'
    })
    expect(pharma).toMatchObject({
      title: 'Pharma distribution & life-sciences growth',
      scale: '~$4B pharma enterprise · 770+ districts assessed',
      impactType: 'Execution result',
      outcome: '30%+ distributor-base reduction · expansion enabled across 200+ districts.'
    })
  })

  it('frames every consulting case around ownership and a consequential decision', () => {
    const copy = portfolioContent.work.map(({ role, keyDecision, challenge, approach }) => ({
      role: role.position,
      owned: role.owned,
      decision: keyDecision,
      challenge,
      approach
    }))

    expect(copy).toEqual([
      expect.objectContaining({
        role: 'Product strategy & GTM workstream lead',
        owned: expect.stringContaining('Core economics'),
        decision: expect.stringContaining('maximum transaction value')
      }),
      expect.objectContaining({
        role: 'Commercial diligence workstream lead',
        decision: expect.stringContaining('market conviction first')
      }),
      expect.objectContaining({
        role: 'Cross-functional transformation lead',
        owned: expect.stringContaining('AI workflow design'),
        approach: expect.stringContaining('AI screening and scheduling')
      }),
      expect.objectContaining({
        role: 'End-to-end transformation lead',
        decision: expect.stringContaining('frontline resistance')
      }),
      expect.objectContaining({
        role: 'Supply-chain transformation workstream lead',
        decision: expect.stringContaining('cross-border integration thesis')
      }),
      expect.objectContaining({
        role: 'Commercial growth & life-sciences strategy workstream lead',
        challenge: expect.stringContaining('life-sciences opportunities')
      })
    ])
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
