import { describe, expect, it } from 'vitest'
import { portfolioContent } from './portfolio-content'

const serialized = JSON.stringify(portfolioContent)

describe('approved public portfolio content', () => {
  it('uses the binding chronology and complete career path', () => {
    expect(portfolioContent.experience.map(({ organization, period }) => [organization, period]))
      .toEqual([
        ['eBay', 'July 2025–present'],
        ['Bain & Company', '2024–June 2025'],
        ['Legacy Pursuit', 'Summer 2024'],
        ['Bain & Company', '2019–2023']
      ])
  })

  it('publishes eight complete anonymized work cases and shows six in the home grid', () => {
    expect(portfolioContent.work).toHaveLength(8)
    expect(portfolioContent.work.filter(({ homeVisible }) => homeVisible)).toHaveLength(6)
    for (const item of portfolioContent.work) {
      expect(item.industry).not.toBe('')
      expect(item.role).not.toBe('')
      expect(item.capabilities.length).toBeGreaterThanOrEqual(4)
      expect(item.thesis).not.toBe('')
      expect(item.challenge).not.toBe('')
      expect(item.approach).not.toBe('')
      expect(item.evidence).not.toBe('')
    }
  })

  it('keeps diligence confidential and Trail Pulse honest', () => {
    expect(portfolioContent.work.filter(({ category }) => category === 'diligence')
      .every(({ disclosure }) => /private|disclosed/i.test(disclosure ?? ''))).toBe(true)
    expect(portfolioContent.builderLab.find(({ slug }) => slug === 'trail-pulse')?.honestyNote)
      .toBe('An early AI-assisted, vibe-coded experiment built to learn and signal technical curiosity—not a flagship product.')
    expect(portfolioContent.work.filter(({ homeVisible }) => homeVisible).at(-1)?.slug)
      .toBe('trail-pulse')
  })

  it('contains only approved links and no private contact data', () => {
    expect(portfolioContent.publicResearch.href).toBe(
      'https://www.laureatesandleaders.org/_files/ugd/811759_44700bb3bf134c7fa1e15adade4daa51.pdf'
    )
    expect(serialized).not.toContain('laureatesandleaders.org/a-fair-share-for-children')
    expect(serialized).not.toMatch(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)
    expect(serialized).not.toMatch(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/)
    expect(portfolioContent.contact).toEqual({
      linkedinHref: 'https://www.linkedin.com/in/rohan-misra-mba/',
      resumeHref: null
    })
  })
})
