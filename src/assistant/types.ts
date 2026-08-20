export interface AssistantCitation {
  sectionId: string
  label: string
}

export interface AssistantHistoryItem {
  id: string
  role: 'user' | 'assistant'
  text: string
  topicId?: string
  citations?: AssistantCitation[]
  caseSlug?: string
}

export interface AssistantRequest {
  input: string
  history: AssistantHistoryItem[]
}

export type AssistantReply =
  | { kind: 'answer'; text: string; topicId: string; citations: AssistantCitation[]; caseSlug?: string }
  | { kind: 'clarification'; text: string; suggestions: string[] }
  | { kind: 'fallback'; text: string; suggestions: string[] }
  | { kind: 'unavailable'; text: string; citations: AssistantCitation[] }

export interface AssistantAdapter {
  capabilities: { generative: boolean; network: boolean; persistent: boolean }
  disclosure: string
  reply(request: AssistantRequest, signal: AbortSignal): Promise<AssistantReply>
}

export interface KnowledgeRecord {
  id: string
  canonicalQuestions: string[]
  entities: string[]
  aliases: string[]
  keywords: string[]
  answer: string
  citations: AssistantCitation[]
  caseSlug?: string
  guardedTerms?: string[]
}

export interface ReadonlyAssistantCitation {
  readonly sectionId: string
  readonly label: string
}

export interface ReadonlyKnowledgeRecord {
  readonly id: string
  readonly canonicalQuestions: readonly string[]
  readonly entities: readonly string[]
  readonly aliases: readonly string[]
  readonly keywords: readonly string[]
  readonly answer: string
  readonly citations: readonly ReadonlyAssistantCitation[]
  readonly caseSlug?: string
  readonly guardedTerms?: readonly string[]
}
