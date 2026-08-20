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
      expect((item as unknown as { outcome?: string }).outcome).not.toBe('')
      expect(item).not.toHaveProperty('role')
      expect(item).not.toHaveProperty('evidence')
    }
  })

  it('uses the approved CV scale and metrics while keeping personal builds separate', () => {
    const payments = portfolioContent.work[0] as unknown as { industry: string; outcome: string }
    const talent = portfolioContent.work[2] as unknown as { title: string; approach: string; outcome: string }
    const utilities = portfolioContent.work[3] as unknown as { outcome: string }
    const automotive = portfolioContent.work[4] as unknown as { outcome: string }
    const pharma = portfolioContent.work[5] as unknown as { challenge: string; approach: string; outcome: string }

    expect(payments.industry).toContain("India's largest payments platform")
    expect(payments.outcome).toContain('$150M+')
    expect(portfolioContent.work[1].outcome).toBe('Informed X buy-side investment theses.')
    expect(talent.title).toBe('AI-powered recruiting transformation')
    expect(talent.approach).toMatch(/AI-tool integrations.*Paradox/i)
    expect(talent.outcome).toBe('Built the AI-enabled recruiting transformation to unlock ~15,000 hours of annual recruiter and talent-team capacity.')
    expect(utilities.outcome).toMatch(/\$20M\+.*8%\+/)
    expect(automotive.outcome).toContain('$40M+')
    expect(pharma.approach).toMatch(/770\+ counties.*adult-vaccine/i)
    expect(pharma.challenge).toMatch(/^Across separate engagements,/i)
    expect(pharma.outcome).toMatch(/30%\+.*200\+ counties/i)

    expect(portfolioContent.work.filter(({ category }) => category === 'diligence')
      .every((item) => !('maturityNote' in item))).toBe(true)
    const personalProjects = (portfolioContent as unknown as {
      personalProjects?: typeof portfolioContent.personalProjects
    }).personalProjects
    expect(personalProjects?.find(({ slug }) => slug === 'trail-pulse')?.honestyNote)
      .toBe('An early AI-assisted, vibe-coded experiment built to learn and signal technical curiosity—not a flagship product.')
    expect(portfolioContent.work.find(({ slug }) => slug === 'trail-pulse')).toBeUndefined()
    expect(serialized).not.toMatch(/No target|Target identities|transaction detail is disclosed/i)
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
