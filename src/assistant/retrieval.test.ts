import { describe, expect, it } from 'vitest'
import { containsNormalizedPhrase, normalize, retrieve, scoreRetrievalCandidates, selectRetrievalResult } from './retrieval'
import type { AssistantHistoryItem } from './types'

const supported = [
  ['What operating transformations has Rohan led?', 'operating-transformations'],
  ['Tell me about his utility workforce work', 'operating-transformations'],
  ["What is Rohan's private-equity diligence experience?", 'private-equity-diligence'],
  ['Has he done commercial due diligence?', 'private-equity-diligence'],
  ['How has he worked across product strategy and GTM?', 'product-and-gtm'],
  ['What is Trail Pulse, and how mature is it?', 'trail-pulse'],
  ["What is Rohan's career path?", 'career-path'],
  ['What does Rohan write about?', 'writing'],
  ['How do I contact Rohan?', 'contact'],
  ['Is this assistant an LLM?', 'assistant-about']
] as const

describe('retrieve', () => {
  it.each(supported)('routes %s to %s', (prompt, expectedId) => {
    expect(retrieve(prompt, [])).toMatchObject({ kind: 'match', recordId: expectedId })
  })

  it('clarifies a close operations versus product match', () => {
    expect(retrieve('Tell me about strategy and operations', [])).toMatchObject({
      kind: 'clarification'
    })
  })

  it('keeps an explicit follow-up below the match threshold without fabricated history confidence', () => {
    const history: AssistantHistoryItem[] = [
      { id: '1', role: 'assistant', text: 'Earlier', topicId: 'writing' },
      { id: '2', role: 'user', text: 'Thanks' },
      { id: '3', role: 'assistant', text: 'Latest', topicId: 'trail-pulse' }
    ]

    expect(retrieve('tell me more', history)).toEqual({ kind: 'fallback' })
  })

  it('matches aliases only as contiguous ordered normalized phrases', () => {
    expect(containsNormalizedPhrase(normalize('Tell me about utility workforce operations'), normalize('utility workforce'))).toBe(true)
    expect(containsNormalizedPhrase(normalize('Tell me about workforce utility operations'), normalize('utility workforce'))).toBe(false)
  })

  it('adds exactly 0.18 to only the latest grounded topic for an explicit follow-up', () => {
    const history: AssistantHistoryItem[] = [
      { id: '1', role: 'assistant', text: 'Older', topicId: 'writing' },
      { id: '2', role: 'assistant', text: 'Latest', topicId: 'trail-pulse' }
    ]
    const withoutHistory = scoreRetrievalCandidates('tell me more', [])
    const withHistory = scoreRetrievalCandidates('tell me more', history)

    for (const candidate of withoutHistory) {
      const withTopic = withHistory.find(({ id }) => id === candidate.id)
      expect(withTopic).toBeDefined()
      expect(withTopic?.score).toBe(candidate.id === 'trail-pulse' ? candidate.score + 0.18 : candidate.score)
    }
  })

  it('clarifies before applying the match threshold when both topics are close', () => {
    expect(selectRetrievalResult([
      { id: 'first', score: 0.59 },
      { id: 'second', score: 0.5 }
    ])).toEqual({ kind: 'clarification', recordIds: ['first', 'second'] })
  })

  it('uses strict 0.48, 0.60, and 0.12 score boundaries', () => {
    expect(selectRetrievalResult([
      { id: 'first', score: 0.6 },
      { id: 'second', score: 0.48 }
    ])).toEqual({ kind: 'match', recordId: 'first', score: 0.6 })
    expect(selectRetrievalResult([
      { id: 'first', score: 0.6 },
      { id: 'second', score: 0.49 }
    ])).toEqual({ kind: 'clarification', recordIds: ['first', 'second'] })
    expect(selectRetrievalResult([
      { id: 'first', score: 0.59 },
      { id: 'second', score: 0.1 }
    ])).toEqual({ kind: 'fallback' })
  })

  it('returns fallback for low-confidence input', () => {
    expect(retrieve('What is the weather in San Jose?', [])).toEqual({ kind: 'fallback' })
  })

  it('is deeply deterministic across one hundred repetitions of every kernel fixture', () => {
    const history: AssistantHistoryItem[] = [{ id: '1', role: 'assistant', text: 'Latest', topicId: 'trail-pulse' }]
    const fixtures: ReadonlyArray<readonly [string, AssistantHistoryItem[]]> = [
      ...supported.map(([prompt]): [string, AssistantHistoryItem[]] => [prompt, []]),
      ['Tell me about strategy and operations', []],
      ['What is the weather in San Jose?', []],
      ['tell me more', history]
    ]
    for (const [prompt, fixtureHistory] of fixtures) {
      const expected = retrieve(prompt, fixtureHistory)
      for (let iteration = 0; iteration < 100; iteration += 1) {
        expect(retrieve(prompt, fixtureHistory)).toEqual(expected)
      }
    }
  })

  it('keeps one thousand local retrieval calls below a 20ms p95', () => {
    const samples = Array.from({ length: 1000 }, (_, index) => {
      const startedAt = performance.now()
      retrieve(supported[index % supported.length][0], [])
      return performance.now() - startedAt
    }).sort((left, right) => left - right)

    expect(samples[949]).toBeLessThan(20)
  })
})
