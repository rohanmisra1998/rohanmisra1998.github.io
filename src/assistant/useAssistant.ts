import { useCallback, useEffect, useReducer, useRef } from 'react'
import type {
  AssistantAdapter,
  AssistantHistoryItem,
  AssistantReply
} from './types'

export type AssistantView = 'closed' | 'compact' | 'expanded' | 'minimized'

export const approvedAssistantPrompts = [
  'What operating transformations has Rohan led?',
  "What is Rohan's private-equity diligence experience?",
  'How has he worked across product strategy and GTM?',
  'What marketplace experience does Rohan have?',
  'What is Trail Pulse, and how mature is it?',
  "What is Rohan's career path?"
] as const

const topicPrompts: Record<string, string> = {
  'operating-transformations': approvedAssistantPrompts[0],
  'private-equity-diligence': approvedAssistantPrompts[1],
  'product-and-gtm': approvedAssistantPrompts[2],
  marketplaces: approvedAssistantPrompts[3],
  'trail-pulse': approvedAssistantPrompts[4],
  'career-path': approvedAssistantPrompts[5]
}

export interface AssistantState {
  view: AssistantView
  messages: AssistantHistoryItem[]
  pending: boolean
  draft: string
  transcriptScrollTop: number
  topicId?: string
  suggestions: readonly string[]
  notice: string
}

export type AssistantAction =
  | { type: 'OPEN'; view?: 'compact' | 'expanded'; topicId?: string }
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE_TO_COMPACT' }
  | { type: 'CLOSE_PANEL' }
  | { type: 'HIDE_FOR_HANDOFF' }
  | { type: 'SET_DRAFT'; value: string }
  | { type: 'SUBMIT'; message: AssistantHistoryItem }
  | { type: 'REPLY'; message: AssistantHistoryItem; suggestions?: readonly string[] }
  | { type: 'FAIL'; message: AssistantHistoryItem }
  | { type: 'CLEAR' }
  | { type: 'SAVE_SCROLL'; value: number }
  | { type: 'VALIDATION'; message: string }

export const assistantInitialState: AssistantState = {
  view: 'closed',
  messages: [],
  pending: false,
  draft: '',
  transcriptScrollTop: 0,
  suggestions: approvedAssistantPrompts,
  notice: ''
}

const newestMessages = (messages: AssistantHistoryItem[]): AssistantHistoryItem[] =>
  messages.slice(-24)

const promptsForTopic = (topicId?: string): readonly string[] => {
  const topicPrompt = topicId ? topicPrompts[topicId] : undefined
  if (!topicPrompt) return approvedAssistantPrompts
  return [topicPrompt, ...approvedAssistantPrompts.filter((prompt) => prompt !== topicPrompt)]
}

const hideOpenSurface = (state: AssistantState): AssistantState =>
  state.messages.length > 0
    ? { ...state, view: 'minimized' }
    : assistantInitialState

export function assistantReducer(
  state: AssistantState,
  action: AssistantAction
): AssistantState {
  switch (action.type) {
    case 'OPEN':
      return {
        ...state,
        view: action.view ?? 'compact',
        ...(action.topicId ? {
          topicId: action.topicId,
          suggestions: promptsForTopic(action.topicId)
        } : {})
      }
    case 'EXPAND':
      return { ...state, view: 'expanded' }
    case 'COLLAPSE_TO_COMPACT':
      return { ...state, view: 'compact' }
    case 'CLOSE_PANEL':
    case 'HIDE_FOR_HANDOFF':
      return hideOpenSurface(state)
    case 'SET_DRAFT':
      return { ...state, draft: action.value.slice(0, 300), notice: '' }
    case 'SUBMIT':
      return {
        ...state,
        messages: newestMessages([...state.messages, action.message]),
        pending: true,
        draft: '',
        notice: 'Looking through approved portfolio evidence.'
      }
    case 'REPLY':
      return {
        ...state,
        messages: newestMessages([...state.messages, action.message]),
        pending: false,
        topicId: action.message.topicId ?? state.topicId,
        suggestions: action.suggestions ?? [],
        notice: 'Answer added.'
      }
    case 'FAIL':
      return {
        ...state,
        messages: newestMessages([...state.messages, action.message]),
        pending: false,
        suggestions: [],
        notice: 'Answer unavailable.'
      }
    case 'CLEAR':
      return {
        ...assistantInitialState,
        view: state.view === 'minimized' ? 'closed' : state.view
      }
    case 'SAVE_SCROLL':
      return { ...state, transcriptScrollTop: Math.max(0, action.value) }
    case 'VALIDATION':
      return { ...state, notice: action.message }
  }
}

let messageSequence = 0

const historyItem = (
  role: AssistantHistoryItem['role'],
  text: string,
  reply?: AssistantReply
): AssistantHistoryItem => {
  messageSequence += 1
  const base = { id: `assistant-message-${messageSequence}`, role, text }
  if (!reply || reply.kind !== 'answer') {
    return reply?.kind === 'unavailable'
      ? { ...base, citations: reply.citations.map((citation) => ({ ...citation })) }
      : base
  }
  return {
    ...base,
    topicId: reply.topicId,
    citations: reply.citations.map((citation) => ({ ...citation })),
    ...(reply.caseSlug ? { caseSlug: reply.caseSlug } : {})
  }
}

export function useAssistant(adapter: AssistantAdapter) {
  const [state, dispatch] = useReducer(assistantReducer, assistantInitialState)
  const abortRef = useRef<AbortController | null>(null)
  const requestSequence = useRef(0)

  useEffect(() => () => abortRef.current?.abort(), [])

  const open = useCallback((options?: { mode?: 'compact' | 'expanded'; topicId?: string }) => {
    dispatch({ type: 'OPEN', view: options?.mode, topicId: options?.topicId })
  }, [])

  const submit = useCallback(async (inputOverride?: string) => {
    const input = (inputOverride ?? state.draft).trim()
    if (!input) {
      dispatch({ type: 'VALIDATION', message: 'Enter a question first.' })
      return false
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    requestSequence.current += 1
    const requestId = requestSequence.current
    const userMessage = historyItem('user', input)
    dispatch({ type: 'SUBMIT', message: userMessage })

    const retrievalContext = state.topicId
      ? [{
          id: `topic-context-${state.topicId}`,
          role: 'assistant' as const,
          text: '',
          topicId: state.topicId
        }]
      : []

    try {
      const reply = await adapter.reply({
        input,
        history: [...state.messages, ...retrievalContext, userMessage].slice(-24)
      }, controller.signal)
      if (controller.signal.aborted || requestId !== requestSequence.current) return false
      const suggestions = reply.kind === 'clarification' || reply.kind === 'fallback'
        ? reply.suggestions
        : []
      dispatch({
        type: 'REPLY',
        message: historyItem('assistant', reply.text, reply),
        suggestions
      })
      return true
    } catch {
      if (controller.signal.aborted || requestId !== requestSequence.current) return false
      dispatch({
        type: 'FAIL',
        message: historyItem(
          'assistant',
          'The approved portfolio answers are temporarily unavailable. You can still explore the portfolio sections.'
        )
      })
      return false
    }
  }, [adapter, state.draft, state.messages, state.topicId])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    dispatch({ type: 'CLEAR' })
  }, [])

  return {
    state,
    open,
    expand: useCallback(() => dispatch({ type: 'EXPAND' }), []),
    collapseToCompact: useCallback(() => dispatch({ type: 'COLLAPSE_TO_COMPACT' }), []),
    closePanel: useCallback(() => dispatch({ type: 'CLOSE_PANEL' }), []),
    hideForHandoff: useCallback(() => dispatch({ type: 'HIDE_FOR_HANDOFF' }), []),
    setDraft: useCallback((value: string) => dispatch({ type: 'SET_DRAFT', value }), []),
    submit,
    clearConversation: clear,
    saveScroll: useCallback((value: number) => dispatch({ type: 'SAVE_SCROLL', value }), [])
  }
}
