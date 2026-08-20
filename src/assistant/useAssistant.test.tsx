import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AssistantAdapter, AssistantHistoryItem } from './types'
import {
  assistantInitialState,
  assistantReducer,
  useAssistant
} from './useAssistant'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const message = (id: string, role: AssistantHistoryItem['role']): AssistantHistoryItem => ({
  id,
  role,
  text: id
})

describe('assistantReducer', () => {
  it('keeps collapse, panel close, handoff hiding, reopen, and clear semantically distinct', () => {
    const withHistory = assistantReducer(assistantInitialState, {
      type: 'SUBMIT',
      message: message('question', 'user')
    })
    const populated = {
      ...withHistory,
      view: 'expanded' as const,
      pending: false,
      topicId: 'trail-pulse',
      transcriptScrollTop: 137
    }

    expect(assistantReducer(assistantInitialState, { type: 'OPEN' }).view).toBe('compact')
    expect(assistantReducer(assistantInitialState, { type: 'OPEN', view: 'expanded' }).view)
      .toBe('expanded')
    expect(assistantReducer({ ...populated, view: 'compact' }, { type: 'EXPAND' }).view)
      .toBe('expanded')
    expect(assistantReducer(populated, { type: 'COLLAPSE_TO_COMPACT' })).toMatchObject({
      view: 'compact',
      messages: populated.messages,
      topicId: 'trail-pulse',
      transcriptScrollTop: 137
    })
    expect(assistantReducer(populated, { type: 'CLOSE_PANEL' })).toMatchObject({
      view: 'minimized',
      messages: populated.messages,
      topicId: 'trail-pulse',
      transcriptScrollTop: 137
    })
    expect(assistantReducer(populated, { type: 'HIDE_FOR_HANDOFF' })).toMatchObject({
      view: 'minimized',
      messages: populated.messages,
      topicId: 'trail-pulse',
      transcriptScrollTop: 137
    })
    expect(assistantReducer({ ...assistantInitialState, view: 'compact' }, {
      type: 'CLOSE_PANEL'
    })).toEqual(assistantInitialState)
    expect(assistantReducer({ ...assistantInitialState, view: 'expanded' }, {
      type: 'HIDE_FOR_HANDOFF'
    })).toEqual(assistantInitialState)
    expect(assistantReducer({ ...populated, view: 'minimized' }, { type: 'OPEN' }))
      .toMatchObject({
        view: 'compact',
        messages: populated.messages,
        topicId: 'trail-pulse',
        transcriptScrollTop: 137
      })
  })

  it('makes clear conversation the only history-erasing action and never retains history closed', () => {
    const populated = {
      ...assistantInitialState,
      view: 'expanded' as const,
      topicId: 'trail-pulse',
      messages: [message('answer', 'assistant')]
    }

    const cleared = assistantReducer(populated, { type: 'CLEAR' })
    expect(cleared).toMatchObject({
      view: 'expanded',
      messages: []
    })
    expect(cleared.topicId).toBeUndefined()
    const clearedMinimized = assistantReducer({ ...populated, view: 'minimized' }, {
      type: 'CLEAR'
    })
    expect(clearedMinimized).toEqual(assistantInitialState)
    expect(clearedMinimized.messages).toEqual([])
    expect(clearedMinimized.topicId).toBeUndefined()
    expect(clearedMinimized.transcriptScrollTop).toBe(0)
  })

  it('keeps the newest 24 messages and preserves grounded reply metadata', () => {
    let state = assistantInitialState
    for (let index = 0; index < 26; index += 1) {
      state = assistantReducer(state, {
        type: index % 2 === 0 ? 'SUBMIT' : 'REPLY',
        message: {
          ...message(`message-${index}`, index % 2 === 0 ? 'user' : 'assistant'),
          ...(index === 25 ? {
            topicId: 'trail-pulse',
            citations: [{ sectionId: '#personal-projects', label: 'Personal projects' }],
            caseSlug: 'trail-pulse'
          } : {})
        }
      })
    }

    expect(state.messages).toHaveLength(24)
    expect(state.messages[0].id).toBe('message-2')
    expect(state.messages.at(-1)).toMatchObject({
      topicId: 'trail-pulse',
      citations: [{ sectionId: '#personal-projects', label: 'Personal projects' }],
      caseSlug: 'trail-pulse'
    })
  })
})

describe('useAssistant', () => {
  it('makes a newly opened topic win over an older topic for a generic follow-up', async () => {
    const contextAdapter: AssistantAdapter = {
      capabilities: { generative: false, network: false, persistent: false },
      disclosure: 'Grounded locally in approved public portfolio content.',
      reply: async ({ input, history }) => {
        const latestTopic = [...history].reverse().find((item) => item.topicId)?.topicId
        const topicId = input.includes('career path') ? 'career-path' : latestTopic ?? 'missing'
        return {
          kind: 'answer',
          text: `Resolved topic: ${topicId}`,
          topicId,
          citations: [{ sectionId: '#work', label: 'Work' }]
        }
      }
    }
    const { result } = renderHook(() => useAssistant(contextAdapter))

    act(() => result.current.setDraft("What is Rohan's career path?"))
    act(() => { void result.current.submit() })
    await waitFor(() => expect(result.current.state.pending).toBe(false))
    expect(result.current.state.messages.at(-1)?.topicId).toBe('career-path')

    act(() => result.current.open({ topicId: 'trail-pulse' }))
    act(() => result.current.setDraft('tell me more'))
    act(() => { void result.current.submit() })
    await waitFor(() => expect(result.current.state.pending).toBe(false))

    expect(result.current.state.messages.at(-1)).toMatchObject({
      topicId: 'trail-pulse',
      text: 'Resolved topic: trail-pulse'
    })
  })

  it('aborts superseded work and ignores the stale reply', async () => {
    const resolvers: Array<(text: string) => void> = []
    const signals: AbortSignal[] = []
    const adapter: AssistantAdapter = {
      capabilities: { generative: false, network: false, persistent: false },
      disclosure: 'Grounded locally in approved public portfolio content.',
      reply: (_request, signal) => {
        signals.push(signal)
        return new Promise((resolve) => {
          resolvers.push((text) => resolve({
            kind: 'answer',
            text,
            topicId: 'trail-pulse',
            citations: [{ sectionId: '#personal-projects', label: 'Personal projects' }]
          }))
        })
      }
    }
    const { result } = renderHook(() => useAssistant(adapter))

    act(() => result.current.setDraft('first question'))
    act(() => { void result.current.submit() })
    act(() => result.current.setDraft('second question'))
    act(() => { void result.current.submit() })

    expect(signals[0].aborted).toBe(true)
    act(() => resolvers[0]('stale answer'))
    act(() => resolvers[1]('current answer'))
    await waitFor(() => expect(result.current.state.pending).toBe(false))
    expect(result.current.state.messages.map(({ text }) => text)).not.toContain('stale answer')
    expect(result.current.state.messages.map(({ text }) => text)).toContain('current answer')
  })

  it('aborts pending work when unmounted', () => {
    let signal: AbortSignal | undefined
    const adapter: AssistantAdapter = {
      capabilities: { generative: false, network: false, persistent: false },
      disclosure: 'Grounded locally in approved public portfolio content.',
      reply: (_request, nextSignal) => {
        signal = nextSignal
        return new Promise(() => {})
      }
    }
    const { result, unmount } = renderHook(() => useAssistant(adapter))
    act(() => result.current.setDraft('pending question'))
    act(() => { void result.current.submit() })

    unmount()
    expect(signal?.aborted).toBe(true)
  })
})
