import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'

interface ModalLayerOptions {
  open: boolean
  dialogRef: RefObject<HTMLElement | null>
  initialFocusRef: RefObject<HTMLElement | null>
  restoreFocusRef: RefObject<HTMLElement | null>
  backgroundId: string
  onEscape: () => void
}

const suppressFocusRestoreEvent = 'portfolio:modal-suppress-focus-restore'

export function suppressNextModalFocusRestore(): void {
  document.dispatchEvent(new Event(suppressFocusRestoreEvent))
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

function visibleFocusableElements(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(focusableSelector)].filter((element) => {
    const style = getComputedStyle(element)
    return !element.closest('[hidden]') && element.getAttribute('aria-hidden') !== 'true' &&
      style.display !== 'none' && style.visibility !== 'hidden'
  })
}

export function useModalLayer({
  open,
  dialogRef,
  initialFocusRef,
  restoreFocusRef,
  backgroundId,
  onEscape
}: ModalLayerOptions): void {
  useLayoutEffect(() => {
    if (!open) return

    const background = document.getElementById(backgroundId)
    const previousOverflow = document.body.style.overflow
    const hadInert = background?.hasAttribute('inert') ?? false
    const previousAriaHidden = background?.getAttribute('aria-hidden') ?? null
    let suppressFocusRestore = false

    document.body.style.overflow = 'hidden'
    background?.setAttribute('inert', '')
    background?.setAttribute('aria-hidden', 'true')
    initialFocusRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = visibleFocusableElements(dialogRef.current)
      if (focusable.length === 0) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable.at(-1)!
      const active = document.activeElement
      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    const handleSuppressFocusRestore = () => {
      suppressFocusRestore = true
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener(suppressFocusRestoreEvent, handleSuppressFocusRestore)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener(suppressFocusRestoreEvent, handleSuppressFocusRestore)
      document.body.style.overflow = previousOverflow
      if (background) {
        if (!hadInert) background.removeAttribute('inert')
        if (previousAriaHidden === null) background.removeAttribute('aria-hidden')
        else background.setAttribute('aria-hidden', previousAriaHidden)
      }
      if (!suppressFocusRestore) restoreFocusRef.current?.focus()
    }
  }, [backgroundId, dialogRef, initialFocusRef, onEscape, open, restoreFocusRef])
}
