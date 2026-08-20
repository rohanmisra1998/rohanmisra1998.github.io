import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from './ThemeToggle'

const navigationLinks = [
  { href: '#overview', label: 'Home' },
  { href: '#work', label: 'Work' },
  { href: '#experience', label: 'Experience' }
]

const mobileNavigationQuery = '(max-width: 900px)'

function getIsMobileNavigation() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(mobileNavigationQuery).matches
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobileNavigation, setIsMobileNavigation] = useState(getIsMobileNavigation)
  const [currentSection, setCurrentSection] = useState('overview')
  const headerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuLabel = menuOpen ? 'Close navigation' : 'Open navigation'

  const closeMenu = (restoreFocus = true) => {
    setMenuOpen(false)
    if (restoreFocus && isMobileNavigation) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus())
    }
  }

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(mobileNavigationQuery)
    const updateNavigationMode = (event: MediaQueryListEvent) => {
      setIsMobileNavigation(event.matches)
      if (!event.matches) closeMenu(false)
    }

    setIsMobileNavigation(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateNavigationMode)

    return () => mediaQuery.removeEventListener('change', updateNavigationMode)
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) closeMenu()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen, isMobileNavigation])

  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return

    const observer = new IntersectionObserver((entries) => {
      const visibleEntry = entries.find((entry) => entry.isIntersecting)
      if (visibleEntry) setCurrentSection(visibleEntry.target.id)
    }, { rootMargin: '-20% 0px -65%', threshold: 0 })

    for (const { href } of navigationLinks) {
      const section = document.getElementById(href.slice(1))
      if (section) observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <header className="site-header" ref={headerRef}>
      <a className="site-header__brand" href="#overview" onClick={() => closeMenu()}>
        Rohan Misra
      </a>
      <button
        ref={menuButtonRef}
        className="site-header__menu"
        type="button"
        hidden={!isMobileNavigation}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        aria-label={menuLabel}
        onClick={() => setMenuOpen((isOpen) => !isOpen)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <nav
        id="primary-navigation"
        aria-label="Primary"
        data-open={menuOpen}
        hidden={isMobileNavigation && !menuOpen}
      >
        {navigationLinks.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            aria-current={currentSection === href.slice(1) ? 'location' : undefined}
            onClick={() => closeMenu()}
          >
            {label}
          </a>
        ))}
      </nav>
      <ThemeToggle />
    </header>
  )
}
