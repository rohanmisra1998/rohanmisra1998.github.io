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
    expect(siteContent.writing).toHaveLength(3)
    expect(siteContent.writing.every(({ href }) => href.startsWith('https://www.linkedin.com/pulse/'))).toBe(true)
  })

  it('does not enable the stale CV or a phone contact', () => {
    expect(siteContent.contact.resumeHref).toBeNull()
    expect(JSON.stringify(siteContent)).not.toMatch(/telephone|phone/i)
  })
})
