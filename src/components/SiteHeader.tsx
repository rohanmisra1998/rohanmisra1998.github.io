import { useEffect, useState } from 'react'

interface SiteHeaderProps {
  resumeHref: string | null
}

const navigationLinks = [
  { href: '#overview', label: 'Overview' },
  { href: '#work', label: 'Work' },
  { href: '#experience', label: 'Experience' },
  { href: '#writing', label: 'Writing' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' }
]

const mobileNavigationQuery = '(max-width: 640px)'

function getIsMobileNavigation() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(mobileNavigationQuery).matches
}

export function SiteHeader({ resumeHref }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobileNavigation, setIsMobileNavigation] = useState(getIsMobileNavigation)
  const menuLabel = menuOpen ? 'Close navigation' : 'Open navigation'

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(mobileNavigationQuery)
    const updateNavigationMode = (event: MediaQueryListEvent) => {
      setIsMobileNavigation(event.matches)
    }

    setIsMobileNavigation(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateNavigationMode)

    return () => mediaQuery.removeEventListener('change', updateNavigationMode)
  }, [])

  return (
    <header>
      <a href="#overview">Rohan Misra</a>
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        aria-label={menuLabel}
        onClick={() => setMenuOpen((isOpen) => !isOpen)}
      >
        {menuLabel}
      </button>
      <nav
        id="primary-navigation"
        aria-label="Primary"
        data-open={menuOpen}
        hidden={isMobileNavigation && !menuOpen}
      >
        {navigationLinks.map(({ href, label }) => (
          <a key={href} href={href} onClick={() => setMenuOpen(false)}>
            {label}
          </a>
        ))}
        {resumeHref ? (
          <a href={resumeHref}>CV</a>
        ) : (
          <span aria-disabled="true">CV · updating</span>
        )}
      </nav>
    </header>
  )
}
