import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { WorkItem } from '../content/portfolio-types'
import { suppressNextModalFocusRestore } from './useModalLayer'

interface CaseHistory {
  activeCase: WorkItem | null
  openCase: (slug: string, trigger: HTMLButtonElement) => void
  closeCase: () => void
  dismissCaseForHandoff: (afterCleanup: () => void) => void
}

function querySlug(): string | null {
  return new URLSearchParams(location.search).get('case')
}

function clearQuery(): void {
  history.replaceState(null, '', `${location.pathname}${location.hash}`)
}

export function useCaseHistory(items: WorkItem[]): CaseHistory {
  const itemBySlug = useMemo(() => new Map(items.map((item) => [item.slug, item])), [items])
  const [activeCase, setActiveCase] = useState<WorkItem | null>(() => {
    const slug = querySlug()
    return slug ? itemBySlug.get(slug) ?? null : null
  })
  const [handoffVersion, setHandoffVersion] = useState(0)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const entryWasPushedRef = useRef(false)
  const suppressRestoreRef = useRef(false)
  const pendingHandoffRef = useRef<(() => void) | null>(null)
  const previouslyOpenRef = useRef(activeCase !== null)

  const parseLocation = useCallback((state: unknown = history.state) => {
    const slug = querySlug()
    if (!slug) {
      entryWasPushedRef.current = false
      setActiveCase(null)
      return
    }

    const item = itemBySlug.get(slug)
    if (!item) {
      clearQuery()
      entryWasPushedRef.current = false
      setActiveCase(null)
      return
    }

    entryWasPushedRef.current = Boolean(
      state && typeof state === 'object' && 'portfolioCase' in state && state.portfolioCase === slug
    )
    setActiveCase(item)
  }, [itemBySlug])

  useLayoutEffect(() => {
    const slug = querySlug()
    if (slug && !itemBySlug.has(slug)) {
      clearQuery()
    }
  }, [itemBySlug])

  useLayoutEffect(() => {
    const handlePopState = (event: PopStateEvent) => parseLocation(event.state)
    addEventListener('popstate', handlePopState)
    return () => removeEventListener('popstate', handlePopState)
  }, [parseLocation])

  useLayoutEffect(() => {
    if (activeCase) {
      previouslyOpenRef.current = true
      return
    }

    if (previouslyOpenRef.current) {
      previouslyOpenRef.current = false
      if (!suppressRestoreRef.current) {
        triggerRef.current?.focus()
      }
      suppressRestoreRef.current = false
      triggerRef.current = null
    }

    const afterCleanup = pendingHandoffRef.current
    if (afterCleanup) {
      pendingHandoffRef.current = null
      afterCleanup()
    }
  }, [activeCase, handoffVersion])

  const openCase = useCallback((slug: string, trigger: HTMLButtonElement) => {
    const item = itemBySlug.get(slug)
    if (!item) return

    triggerRef.current = trigger
    history.pushState({ portfolioCase: slug }, '', `?case=${encodeURIComponent(slug)}`)
    entryWasPushedRef.current = true
    setActiveCase(item)
  }, [itemBySlug])

  const closeCase = useCallback(() => {
    if (
      activeCase &&
      entryWasPushedRef.current &&
      history.state?.portfolioCase === activeCase.slug
    ) {
      history.back()
      return
    }

    clearQuery()
    entryWasPushedRef.current = false
    setActiveCase(null)
  }, [activeCase])

  const dismissCaseForHandoff = useCallback((afterCleanup: () => void) => {
    clearQuery()
    entryWasPushedRef.current = false
    suppressRestoreRef.current = true
    suppressNextModalFocusRestore()
    pendingHandoffRef.current = afterCleanup
    setActiveCase(null)
    setHandoffVersion((version) => version + 1)
  }, [])

  return { activeCase, openCase, closeCase, dismissCaseForHandoff }
}
