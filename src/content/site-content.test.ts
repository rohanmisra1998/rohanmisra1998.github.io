import { describe, expect, it } from 'vitest'
import { siteContent } from './site-content'

describe('siteContent', () => {
  it('uses the approved positioning and corrected chronology', () => {
    expect(siteContent.hero.headline).toBe(
      'I turn messy operations into scalable products and systems.'
    )
    expect(siteContent.experience[0]).toMatchObject({
      organization: 'eBay',
      location: 'San Jose, CA',
      period: 'July 2025–present'
    })
    expect(siteContent.experience[1]).toMatchObject({
      organization: 'Bain & Company',
      location: 'Chicago, IL',
      period: '2024–June 2025'
    })
    expect(siteContent.experience.slice(0, 2).map(({ period }) => period)).toEqual([
      'July 2025–present',
      '2024–June 2025'
    ])
    expect(siteContent.experience[0].summary).toBe(
      'Supporting strategy and operations in a global marketplace business.'
    )
    expect(JSON.stringify(siteContent)).not.toMatch(/Collectibles|Motors/i)
  })

  it('stores the approved Trail Pulse story and verified writing links', () => {
    const trailPulse = siteContent.work.find(({ title }) => title === 'Trail Pulse')
    expect(trailPulse).toMatchObject({
      eyebrow: 'Builder Lab · AI-assisted experiment',
      emphasis: 'secondary'
    })
    expect(trailPulse?.summary).toContain('hiking intelligence engine')
    expect(trailPulse?.capabilities.map(({ title }) => title)).toEqual([
      'Discovery + recommendations',
      'Trail intelligence',
      'Logistics',
      'Exact navigation'
    ])
    expect(siteContent.writing.map(({ title, published, href }) => ({
      title,
      published,
      href
    }))).toEqual([
      {
        title: 'Financialisation of Housing: An Imbroglio Decoded',
        published: 'August 14, 2018',
        href: 'https://www.linkedin.com/pulse/financialisation-housing-imbroglio-decoded-rohan-misra/'
      },
      {
        title: 'The Failed Promise of Pakistan',
        published: 'August 26, 2018',
        href: 'https://www.linkedin.com/pulse/failed-promise-pakistan-rohan-misra/'
      },
      {
        title: 'The Austrian School of Economic Thought: An Exposition',
        published: 'January 17, 2019',
        href: 'https://www.linkedin.com/pulse/austrian-school-economic-thought-exposition-rohan-misra/'
      }
    ])
  })

  it('does not enable the stale CV or a phone contact', () => {
    expect(siteContent.contact.resumeHref).toBeNull()
    expect(JSON.stringify(siteContent)).not.toMatch(/telephone|phone/i)
  })
})
