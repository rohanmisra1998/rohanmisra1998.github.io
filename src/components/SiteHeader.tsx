import { useState } from 'react'

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

export function SiteHeader({ resumeHref }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuLabel = menuOpen ? 'Close navigation' : 'Open navigation'

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
      <nav id="primary-navigation" aria-label="Primary" data-open={menuOpen}>
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
