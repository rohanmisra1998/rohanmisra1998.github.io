import { assistantKnowledge } from '../content/assistant-knowledge'
import type { AssistantHistoryItem, ReadonlyKnowledgeRecord } from './types'

export type RetrievalResult =
  | { kind: 'match'; recordId: string; score: number }
  | { kind: 'clarification'; recordIds: [string, string] }
  | { kind: 'fallback' }

export interface RetrievalCandidate {
  id: string
  score: number
}

export interface Retriever {
  retrieve(input: string, history: AssistantHistoryItem[]): RetrievalResult
  scoreCandidates(input: string, history: AssistantHistoryItem[]): RetrievalCandidate[]
}

const synonymRules: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bprivate[\s-]+equity\b/g, 'private equity'],
  [/\bdue[\s-]+diligence\b/g, 'diligence'],
  [/\bgo[\s-]+to[\s-]+market\b/g, 'go to market'],
  [/\bpe\b/g, 'private equity'],
  [/\bgtm\b/g, 'go to market'],
  [/\bai\b/g, 'artificial intelligence']
]

const apostrophes = /[’‘‛`´]/g
const punctuation = /[^\p{L}\p{N}\s]+/gu
const combiningMarks = /\p{M}+/gu
const whitespace = /\s+/g
const explicitFollowUps = new Set(['tell me more', 'what else', 'how so'])
const followUpBonus = 0.18
const defaultCvRecordId = 'cv-status'
const cvDocumentSignals = new Set([
  'access', 'availability', 'available', 'copy', 'document', 'download', 'get', 'link',
  'obtain', 'pdf', 'send', 'share', 'status', 'view', 'where'
])

export function normalize(input: string): string {
  let normalized = input.normalize('NFKD').toLowerCase().replace(combiningMarks, '')
  normalized = normalized.replace(apostrophes, "'").replace(punctuation, ' ').replace(whitespace, ' ').trim()
  for (const [pattern, replacement] of synonymRules) normalized = normalized.replace(pattern, replacement)
  return normalized.replace(whitespace, ' ').trim()
}

const tokens = (normalizedValue: string): string[] => normalizedValue.split(' ').filter(Boolean)

const hasExplicitCvIntent = (normalizedInput: string): boolean => {
  const inputTokens = new Set(tokens(normalizedInput))
  if (inputTokens.has('cv')) return true
  if (!inputTokens.has('resume')) return false
  return [...cvDocumentSignals].some((signal) => inputTokens.has(signal))
}

export const containsNormalizedPhrase = (normalizedInput: string, normalizedPhrase: string): boolean => {
  const inputTokens = tokens(normalizedInput)
  const phraseTokens = tokens(normalizedPhrase)
  if (phraseTokens.length === 0 || phraseTokens.length > inputTokens.length) return false

  for (let start = 0; start <= inputTokens.length - phraseTokens.length; start += 1) {
    if (phraseTokens.every((token, offset) => inputTokens[start + offset] === token)) return true
  }
  return false
}

const fieldTokenWeights = (record: ReadonlyKnowledgeRecord, weight: number, values: readonly string[]): Map<string, number> => {
  const result = new Map<string, number>()
  for (const value of values) {
    for (const token of tokens(normalize(value))) result.set(token, Math.max(result.get(token) ?? 0, weight))
  }
  return result
}

const answerTokenWeights = (record: ReadonlyKnowledgeRecord): Map<string, number> => fieldTokenWeights(record, 1, [record.answer])

const scoreRecord = (record: ReadonlyKnowledgeRecord, normalizedInput: string, inputTokens: Set<string>): { matched: number; hasSignal: boolean } => {
  const signalWeights = new Map<string, number>()
  for (const [token, weight] of fieldTokenWeights(record, 4, record.entities)) signalWeights.set(token, weight)
  for (const [token, weight] of fieldTokenWeights(record, 2, record.keywords)) {
    signalWeights.set(token, Math.max(signalWeights.get(token) ?? 0, weight))
  }
  const weights = new Map(signalWeights)
  for (const [token, weight] of answerTokenWeights(record)) weights.set(token, Math.max(weights.get(token) ?? 0, weight))

  let matched = 0
  let hasSignal = false
  for (const token of inputTokens) {
    const weight = weights.get(token)
    if (weight) {
      matched += weight
      if (signalWeights.has(token)) hasSignal = true
    }
  }
  for (const alias of record.aliases) {
    if (containsNormalizedPhrase(normalizedInput, normalize(alias))) {
      matched += 3
      hasSignal = true
    }
  }
  return { matched, hasSignal }
}

const bestPossibleWeight = (records: readonly ReadonlyKnowledgeRecord[], normalizedInput: string, inputTokens: Set<string>): number => {
  const globalWeights = new Map<string, number>()
  for (const record of records) {
    for (const [token, weight] of fieldTokenWeights(record, 4, record.entities)) {
      globalWeights.set(token, Math.max(globalWeights.get(token) ?? 0, weight))
    }
    for (const [token, weight] of fieldTokenWeights(record, 2, record.keywords)) {
      globalWeights.set(token, Math.max(globalWeights.get(token) ?? 0, weight))
    }
    for (const [token, weight] of answerTokenWeights(record)) {
      globalWeights.set(token, Math.max(globalWeights.get(token) ?? 0, weight))
    }
  }

  let total = 0
  for (const token of inputTokens) total += globalWeights.get(token) ?? 0
  const matchedAliases = new Set<string>()
  for (const record of records) {
    for (const alias of record.aliases) {
      const normalizedAlias = normalize(alias)
      if (containsNormalizedPhrase(normalizedInput, normalizedAlias)) matchedAliases.add(normalizedAlias)
    }
  }
  return total + matchedAliases.size * 3
}

const latestGroundedTopic = (records: readonly ReadonlyKnowledgeRecord[], history: AssistantHistoryItem[]): string | undefined => {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index]
    if (item.role === 'assistant' && item.topicId && records.some((record) => record.id === item.topicId)) return item.topicId
  }
  return undefined
}

export function selectRetrievalResult(candidates: readonly RetrievalCandidate[]): RetrievalResult {
  const [first, second] = [...candidates].sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
  if (!first) return { kind: 'fallback' }
  if (second && first.score > 0.48 && second.score > 0.48 && first.score - second.score < 0.12) {
    return { kind: 'clarification', recordIds: [first.id, second.id] }
  }
  if (first.score >= 0.6 && (!second || first.score - second.score >= 0.12)) {
    return { kind: 'match', recordId: first.id, score: first.score }
  }
  return { kind: 'fallback' }
}

export function createRetriever(records: readonly ReadonlyKnowledgeRecord[]): Retriever {
  const scoreCandidates = (input: string, history: AssistantHistoryItem[]): RetrievalCandidate[] => {
    const normalizedInput = normalize(input)
    const inputTokens = new Set(tokens(normalizedInput))
    const maximumWeight = bestPossibleWeight(records, normalizedInput, inputTokens)
    const scored = records.map((record) => {
      const result = scoreRecord(record, normalizedInput, inputTokens)
      return { id: record.id, score: maximumWeight === 0 || !result.hasSignal ? 0 : result.matched / maximumWeight }
    })

    if (explicitFollowUps.has(normalizedInput)) {
      const topicId = latestGroundedTopic(records, history)
      const priorTopic = scored.find((record) => record.id === topicId)
      if (priorTopic) priorTopic.score = Math.min(1, priorTopic.score + followUpBonus)
    }
    return scored
  }

  const retrieveFromRecords = (input: string, history: AssistantHistoryItem[]): RetrievalResult => {
    const normalizedInput = normalize(input)
    if (!normalizedInput) return { kind: 'fallback' }
    for (const record of records) {
      if (record.canonicalQuestions.some((question) => normalize(question) === normalizedInput)) {
        return { kind: 'match', recordId: record.id, score: 1 }
      }
    }
    return selectRetrievalResult(scoreCandidates(normalizedInput, history))
  }

  return Object.freeze({ retrieve: retrieveFromRecords, scoreCandidates })
}

const defaultCvRecord = assistantKnowledge.find((record) => record.id === defaultCvRecordId)
if (!defaultCvRecord) throw new Error('Approved CV status record is missing')

const defaultGenericRetriever = createRetriever(
  assistantKnowledge.filter((record) => record.id !== defaultCvRecordId)
)

export const defaultPortfolioRetriever = Object.freeze({
  retrieve: (input: string, history: AssistantHistoryItem[]): RetrievalResult => {
    const normalizedInput = normalize(input)
    if (hasExplicitCvIntent(normalizedInput)) {
      return { kind: 'match', recordId: defaultCvRecordId, score: 1 }
    }
    return defaultGenericRetriever.retrieve(input, history)
  },
  scoreCandidates: (input: string, history: AssistantHistoryItem[]): RetrievalCandidate[] => {
    const candidates = defaultGenericRetriever.scoreCandidates(input, history)
    return hasExplicitCvIntent(normalize(input))
      ? [{ id: defaultCvRecordId, score: 1 }, ...candidates]
      : candidates
  }
}) satisfies Retriever

export const scoreRetrievalCandidates = (input: string, history: AssistantHistoryItem[]): RetrievalCandidate[] => defaultPortfolioRetriever.scoreCandidates(input, history)
export const retrieve = (input: string, history: AssistantHistoryItem[]): RetrievalResult => defaultPortfolioRetriever.retrieve(input, history)
