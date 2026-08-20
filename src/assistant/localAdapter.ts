import { defaultKnowledgeAccess, type KnowledgeAccess } from '../content/assistant-knowledge'
import { createRetriever, defaultPortfolioRetriever, normalize, type Retriever } from './retrieval'
import type { AssistantAdapter, AssistantCitation, AssistantReply, AssistantRequest, ReadonlyAssistantCitation } from './types'

const unsupportedText = 'I can only answer from approved public content on this portfolio. Try Work, Experience, Writing, or Personal projects.'
const privateDetailText = "That detail isn't part of the approved public profile."
const allowedSectionIds = new Set(['#work', '#experience', '#education', '#personal-projects', '#writing', '#profile', '#about', '#about-assistant', '#contact', '#outside-work'])
const fallbackSuggestions = ['What operating transformations has Rohan led?', 'What is Rohan’s career path?', 'What does Rohan write about?', 'What is Trail Pulse, and how mature is it?']
const unavailableCitations: AssistantCitation[] = [
  { sectionId: '#work', label: 'Work' },
  { sectionId: '#experience', label: 'Experience' },
  { sectionId: '#writing', label: 'Writing' },
  { sectionId: '#contact', label: 'Contact' }
]
const baseGuardGroups = [
  ['private', 'equity', 'target'],
  ['private', 'equity', 'recommendation'],
  ['confidential', 'project'],
  ['ignore', 'instruction'],
  ['hidden', 'context']
]

const singular = (token: string): string => {
  if (token.endsWith('ies') && token.length > 3) return `${token.slice(0, -3)}y`
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1)
  return token
}

const normalizedTokens = (input: string): Set<string> => new Set(normalize(input).split(' ').filter(Boolean).map(singular))

const isGuarded = (input: string, knowledge: KnowledgeAccess): boolean => {
  const inputTokens = normalizedTokens(input)
  const recordGuardGroups = knowledge.records.flatMap((record) => (record.guardedTerms ?? []).map((term) => normalize(term).split(' ').filter(Boolean).map(singular)))
  return [...baseGuardGroups, ...recordGuardGroups].some((group) => group.every((token) => inputTokens.has(singular(token))))
}

const fallback = (text = unsupportedText): AssistantReply => ({ kind: 'fallback', text, suggestions: fallbackSuggestions })

const assertGrounded = (citations: readonly ReadonlyAssistantCitation[]): void => {
  if (citations.length === 0 || citations.some((citation) => !allowedSectionIds.has(citation.sectionId))) {
    throw new Error('Assistant answer does not have allowlisted citations')
  }
}

const createReply = (knowledge: KnowledgeAccess, retriever: Retriever = createRetriever(knowledge.records)) => {
  return async (request: AssistantRequest, _signal: AbortSignal): Promise<AssistantReply> => {
    try {
      if (knowledge.initializationError) throw knowledge.initializationError
      const input = request.input.trim()
      if (!input || input.length > 300) return fallback()
      if (isGuarded(input, knowledge)) return fallback(privateDetailText)

      const result = retriever.retrieve(input, request.history.slice(-24))
      if (result.kind === 'fallback') return fallback()
      if (result.kind === 'clarification') {
        const suggestions = result.recordIds.map((id) => knowledge.getRecord(id)?.canonicalQuestions[0]).filter((value): value is string => Boolean(value))
        return { kind: 'clarification', text: 'I found two close topics. Which one would you like to explore?', suggestions }
      }

      const record = knowledge.getRecord(result.recordId)
      if (!record) throw new Error('Retrieved record is missing')
      assertGrounded(record.citations)
      return {
        kind: 'answer',
        text: record.answer,
        topicId: record.id,
        citations: record.citations.map((citation) => ({ ...citation })),
        ...(record.caseSlug ? { caseSlug: record.caseSlug } : {})
      }
    } catch {
      return {
        kind: 'unavailable',
        text: 'The approved portfolio answers are temporarily unavailable. You can still explore these sections.',
        citations: unavailableCitations.map((citation) => ({ ...citation }))
      }
    }
  }
}

export const createLocalAssistantAdapter = (knowledge: KnowledgeAccess): AssistantAdapter => ({
  capabilities: { generative: false, network: false, persistent: false },
  disclosure: 'Grounded locally in approved public portfolio content.',
  reply: createReply(knowledge)
})

export const localAssistantAdapter = {
  capabilities: { generative: false, network: false, persistent: false },
  disclosure: 'Grounded locally in approved public portfolio content.',
  reply: createReply(defaultKnowledgeAccess, defaultPortfolioRetriever)
} as const satisfies AssistantAdapter
