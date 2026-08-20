import { useCallback, useMemo, useRef, useState } from 'react'
import type { WorkItem } from '../content/portfolio-types'
import { useCaseHistory } from './useCaseHistory'

export type PortfolioLayer =
  | { kind: 'none' }
  | { kind: 'case'; slug: string }
  | { kind: 'assistant'; view: 'compact' | 'expanded' }

export interface AssistantOpenOptions {
  mode?: 'compact' | 'expanded'
  topicId?: string
}

export interface AssistantSurfaceHandle {
  open(trigger: HTMLElement, options?: AssistantOpenOptions): void
  hideForHandoff(options?: { restoreFocus?: boolean }): void
  getLauncher(): HTMLButtonElement | null
}

export type AssistantSurfaceView = 'closed' | 'compact' | 'expanded' | 'minimized'

export interface AssistantFeatureController {
  attach(handle: AssistantSurfaceHandle | null): void
  onViewChange(view: AssistantSurfaceView): void
  onRequestAssistant(trigger: HTMLButtonElement): void
  onRequestCase(slug: string, trigger: HTMLButtonElement): void
}

export interface PortfolioLayers {
  layer: PortfolioLayer
  activeCase: WorkItem | null
  openCase(slug: string, trigger: HTMLButtonElement): void
  closeCase(): void
  openAssistant(trigger: HTMLElement, options?: AssistantOpenOptions): void
  assistantController: AssistantFeatureController
}

export function usePortfolioLayers(items: WorkItem[]): PortfolioLayers {
  const caseHistory = useCaseHistory(items)
  const [assistantView, setAssistantView] = useState<AssistantSurfaceView>('closed')
  const assistantRef = useRef<AssistantSurfaceHandle | null>(null)
  const pendingOpenRef = useRef<{ trigger: HTMLElement; options?: AssistantOpenOptions } | null>(null)
  const caseTriggerRef = useRef<HTMLButtonElement | null>(null)
  const activeCaseRef = useRef(caseHistory.activeCase)
  activeCaseRef.current = caseHistory.activeCase

  const performAssistantOpen = useCallback((trigger: HTMLElement, options?: AssistantOpenOptions) => {
    const assistant = assistantRef.current
    if (!assistant) {
      pendingOpenRef.current = { trigger, options }
      return
    }
    assistant.open(trigger, options)
  }, [])

  const openAssistant = useCallback((trigger: HTMLElement, options?: AssistantOpenOptions) => {
    if (!activeCaseRef.current) {
      performAssistantOpen(trigger, options)
      return
    }

    const assistant = assistantRef.current
    const workTrigger = caseTriggerRef.current
    caseHistory.dismissCaseForHandoff(() => {
      const restoreTarget = workTrigger?.isConnected
        ? workTrigger
        : assistant?.getLauncher() ?? trigger
      performAssistantOpen(restoreTarget, options)
    })
  }, [caseHistory.dismissCaseForHandoff, performAssistantOpen])

  const openCase = useCallback((slug: string, trigger: HTMLButtonElement) => {
    if (assistantView === 'compact' || assistantView === 'expanded') {
      assistantRef.current?.hideForHandoff({ restoreFocus: false })
    }
    caseTriggerRef.current = trigger
    caseHistory.openCase(slug, trigger)
  }, [assistantView, caseHistory.openCase])

  const closeCase = useCallback(() => {
    caseHistory.closeCase()
  }, [caseHistory.closeCase])

  const assistantController = useMemo<AssistantFeatureController>(() => ({
    attach(handle) {
      assistantRef.current = handle
      if (!handle || !pendingOpenRef.current) return
      const pending = pendingOpenRef.current
      pendingOpenRef.current = null
      queueMicrotask(() => handle.open(pending.trigger, pending.options))
    },
    onViewChange(view) {
      setAssistantView(view)
    },
    onRequestAssistant: openAssistant,
    onRequestCase: openCase
  }), [openAssistant, openCase])

  const layer: PortfolioLayer = caseHistory.activeCase
    ? { kind: 'case', slug: caseHistory.activeCase.slug }
    : assistantView === 'compact' || assistantView === 'expanded'
      ? { kind: 'assistant', view: assistantView }
      : { kind: 'none' }

  return {
    layer,
    activeCase: caseHistory.activeCase,
    openCase,
    closeCase,
    openAssistant,
    assistantController
  }
}
