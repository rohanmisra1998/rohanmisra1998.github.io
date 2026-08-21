import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  history.replaceState(null, '', '/')
  document.body.style.overflow = ''
  document.getElementById('page-shell')?.removeAttribute('inert')
  document.getElementById('page-shell')?.removeAttribute('aria-hidden')
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function expectMainSectionsToBeLabelledRegions(main: HTMLElement, expectedSectionCount: number) {
  const sections = [...main.querySelectorAll('section')]
  expect(sections).toHaveLength(expectedSectionCount)

  for (const section of sections) {
    const headingId = section.getAttribute('aria-labelledby')?.trim()
    expect(headingId).toBeTruthy()
    const heading = document.getElementById(headingId!)
    expect(heading).toBeInstanceOf(HTMLHeadingElement)
    expect(section).toContainElement(heading)
    expect(heading).toBeVisible()
    expect(heading).toHaveAccessibleName()

    let regionAccessibleName = ''
    const exposedRegion = within(main).getByRole('region', {
      name: (accessibleName, element) => {
        if (element !== section) return false
        regionAccessibleName = accessibleName
        return true
      }
    })
    expect(exposedRegion).toBe(section)
    expect(regionAccessibleName).not.toBe('')
    expect(within(section).getByRole('heading', { name: regionAccessibleName })).toBe(heading)
  }
}

describe('App', () => {
  it('renders the capsule navigation and approved hero', () => {
    render(<App />)
    const navigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(navigation).toBeVisible()
    expect(within(navigation).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Home',
      'Work',
      'Experience',
      'Contact',
      'LinkedIn↗'
    ])
    expect(within(navigation).getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '#contact'
    )
    expect(within(navigation).getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/rohan-misra-mba/'
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'I turn messy operations into scalable products and systems.'
    )
    expect(screen.getByText('Senior Manager, Strategy & Operations at eBay · San Jose, CA'))
      .toBeVisible()
    expect(screen.getByRole('link', { name: 'Explore selected work' })).toHaveAttribute(
      'href',
      '#work'
    )
    expect(screen.getByRole('button', { name: 'Ask Rohan AI' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Read my writing' })).toHaveAttribute(
      'href',
      '#writing'
    )
    expect(screen.queryByTestId('proofline')).not.toBeInTheDocument()
  })

  it('opens the same assistant surface from the hero and persistent launcher', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Ask Rohan AI' })).toHaveLength(2)
    })
    const entryPoints = screen.getAllByRole('button', { name: 'Ask Rohan AI' })

    await user.click(entryPoints[0])
    expect(screen.getByLabelText('Ask a question')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Close assistant panel' }))

    await user.click(screen.getAllByRole('button', { name: 'Ask Rohan AI' }).at(-1)!)
    expect(screen.getByLabelText('Ask a question')).toBeVisible()
  })

  it.each([
    { viewport: 'desktop', mobile: false, dialogCount: 0, inertCount: 0, locked: false },
    { viewport: 'mobile', mobile: true, dialogCount: 1, inertCount: 1, locked: true }
  ])('routes the persistent launcher through case cleanup on $viewport', async ({
    mobile,
    dialogCount,
    inertCount,
    locked
  }) => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
      matches: mobile,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })))
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => {
      expect(document.querySelector('.ask-rohan-launcher__button')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /Open case study: B2B SaaS/i }))
    expect(location.search).toBe('?case=buy-side-commercial-diligence')

    await user.click(document.querySelector<HTMLButtonElement>('.ask-rohan-launcher__button')!)

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'B2B SaaS & logistics investment diligence' }))
        .not.toBeInTheDocument()
    })
    expect(location.search).toBe('')
    expect(document.querySelectorAll('.ask-rohan')).toHaveLength(1)
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(dialogCount)
    expect(document.querySelectorAll('[inert]')).toHaveLength(inertCount)
    expect(document.body.style.overflow === 'hidden').toBe(locked)
    expect(screen.getByLabelText('Ask a question')).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Close assistant panel' }))
    expect(document.body.style.overflow).toBe('')
    expect(document.querySelectorAll('[inert]')).toHaveLength(0)
  })

  it('replaces the assistant with a case without stacking surfaces or inert owners', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Ask Rohan AI' })).toHaveLength(2)
    })
    await user.click(screen.getAllByRole('button', { name: 'Ask Rohan AI' })[0])
    await user.click(screen.getByRole('button', { name: /private-equity diligence/i }))
    expect(await screen.findByRole('article', { name: 'Grounded answer' }))
      .toHaveTextContent(/X buy-side investment theses/i)
    await user.click(screen.getByRole('button', { name: 'View supporting case' }))

    const caseDialog = screen.getByRole('dialog', { name: 'B2B SaaS & logistics investment diligence' })
    expect(caseDialog).toBeVisible()
    expect(screen.queryByRole('dialog', { name: 'Ask Rohan AI' })).not.toBeInTheDocument()
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1)
    expect(document.querySelectorAll('[inert]')).toHaveLength(1)
  })

  it('opens the assistant from a case only after case cleanup and restores its work-card trigger', async () => {
    const user = userEvent.setup()
    render(<App />)
    const workTrigger = screen.getByRole('button', { name: /Open case study: B2B SaaS/i })
    await user.click(workTrigger)
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI about this work' }))

    expect(screen.queryByRole('dialog', { name: 'B2B SaaS & logistics investment diligence' }))
      .not.toBeInTheDocument()
    expect(location.search).toBe('')
    expect(await screen.findByLabelText('Ask a question')).toBeVisible()
    expect(screen.getByLabelText('Ask a question')).toHaveFocus()
    expect(
      within(screen.getByRole('log')).getAllByRole('button')[0]
    ).toHaveTextContent("What is Rohan's private-equity diligence experience?")
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Close assistant panel' }))
    expect(workTrigger).toHaveFocus()
  })

  it('omits the assistant action for a case without an approved topic', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', {
      name: /Open case study: AI-powered recruiting transformation/i
    }))

    expect(screen.getByRole('dialog', { name: 'AI-powered recruiting transformation' }))
      .toBeVisible()
    expect(screen.queryByRole('button', { name: 'Ask Rohan AI about this work' }))
      .not.toBeInTheDocument()
  })

  it('falls back to the persistent launcher when the case-origin trigger disconnects', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => {
      expect(document.querySelector('.ask-rohan-launcher__button')).toBeInTheDocument()
    })
    const launcher = document.querySelector<HTMLButtonElement>('.ask-rohan-launcher__button')!
    const workTrigger = screen.getByRole('button', { name: /Open case study: B2B SaaS/i })
    await user.click(workTrigger)
    workTrigger.remove()

    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI about this work' }))
    expect(await screen.findByLabelText('Ask a question')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Close assistant panel' }))

    expect(launcher).toHaveFocus()
  })

  it('cleans up the expanded assistant before navigating a citation and focusing its heading', async () => {
    const user = userEvent.setup()
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    render(<App />)
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Ask Rohan AI' })).toHaveLength(2)
    })
    await user.click(screen.getAllByRole('button', { name: 'Ask Rohan AI' })[0])
    await user.click(screen.getByRole('button', { name: /private-equity diligence/i }))
    const answer = await screen.findByRole('article', { name: 'Grounded answer' })
    await user.click(screen.getByRole('button', { name: 'Expand assistant' }))
    await user.click(within(answer).getByRole('link', { name: 'Work' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Ask Rohan AI' })).not.toBeInTheDocument()
    })
    expect(location.hash).toBe('#work')
    expect(screen.getByRole('heading', { name: 'Selected work' })).toHaveFocus()
    expect(document.getElementById('page-shell')).not.toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('')
    expect(scrollIntoView).toHaveBeenCalledOnce()
  })

  it('renders the approved hero and semantic quick-scan navigation', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    )
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'I turn messy operations into scalable products and systems.'
    )
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(document.querySelector('button[aria-controls="primary-navigation"]')).toHaveAttribute(
      'hidden'
    )
  })

  it('opens and closes the mobile navigation', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    )
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: 'Open navigation' })
    expect(button).not.toHaveAttribute('hidden')
    const navigation = document.getElementById('primary-navigation')
    expect(navigation).toHaveAttribute('hidden')
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(navigation).not.toHaveAttribute('hidden')
    await user.click(screen.getByRole('link', { name: 'Work' }))
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(navigation).toHaveAttribute('hidden')
  })

  it('closes the mobile navigation after an outside pointer activation and restores focus', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    )
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(button)

    fireEvent.pointerDown(document.body)

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
  })

  it('closes the mobile navigation on Escape and restores focus', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    )
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(button)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
  })

  it('marks the intersecting navigation destination as the current location', () => {
    let observerCallback: IntersectionObserverCallback | undefined
    class ObserverStub {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', ObserverStub)

    render(<App />)
    const workSection = document.getElementById('work')!
    act(() => {
      observerCallback?.(
        [{ isIntersecting: true, target: workSection } as unknown as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    })

    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute(
      'aria-current',
      'location'
    )
  })

  it('keeps the portrait descriptive without a decorative proofline', () => {
    render(<App />)
    expect(screen.queryByTestId('proofline')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Rohan Misra/i })).toBeInTheDocument()
    const caption = screen.getByText('Operator, strategist, and hands-on builder.')
    expect(caption).toHaveClass('hero__portrait-caption')
    expect(caption.closest('.hero__portrait-card')).toContainElement(
      screen.getByRole('img', { name: /Rohan Misra/i })
    )
  })

  it('renders the corrected experience, verified essays, and approved email contact', () => {
    render(<App />)
    expect(screen.getByText(/I'm Rohan Misra, a high agency tech-first strategy and operations leader/i))
      .toBeInTheDocument()
    expect(screen.getByText('Senior Manager, Strategy & Operations')).toBeInTheDocument()
    expect(screen.getByText('July 2025–present')).toBeInTheDocument()
    expect(screen.getByText(/five promotions in under four years on a top-rated, accelerated trajectory/i))
      .toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Financialisation of Housing/i })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/pulse/financialisation-housing-imbroglio-decoded-rohan-misra/'
    )
    expect(screen.getByRole('link', { name: 'Email Rohan at misrarohan619@gmail.com' }))
      .toHaveAttribute('href', 'mailto:misrarohan619@gmail.com')
    expect(screen.queryByText(/CV/i)).not.toBeInTheDocument()
  })

  it('renders every verified essay as a named safe external link', () => {
    render(<App />)
    const essays = [
      {
        title: 'Financialisation of Housing: An Imbroglio Decoded',
        href: 'https://www.linkedin.com/pulse/financialisation-housing-imbroglio-decoded-rohan-misra/'
      },
      {
        title: 'The Failed Promise of Pakistan',
        href: 'https://www.linkedin.com/pulse/failed-promise-pakistan-rohan-misra/'
      },
      {
        title: 'The Austrian School of Economic Thought: An Exposition',
        href: 'https://www.linkedin.com/pulse/austrian-school-economic-thought-exposition-rohan-misra/'
      }
    ]

    for (const { title, href } of essays) {
      const link = screen.getByRole('link', {
        name: `${title} — LinkedIn, opens in a new tab`
      })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', expect.stringMatching(/(?=.*noopener)(?=.*noreferrer)/))
    }
  })

  it('renders Education as a standalone section directly after Experience', () => {
    render(<App />)
    const main = screen.getByRole('main')
    const experience = screen.getByRole('region', { name: 'Experience' })
    const education = screen.getByRole('region', { name: 'Education' })

    expect(screen.getByText('Legacy Pursuit')).toBeVisible()
    expect(screen.getByText('Kellogg School of Management')).toBeVisible()
    expect(experience.nextElementSibling).toBe(education)
    expect(within(experience).queryByRole('heading', { name: 'Education' })).not.toBeInTheDocument()
    expect(within(main).queryByRole('region', { name: 'Expertise' })).not.toBeInTheDocument()
  })

  it('places Personal projects inside Selected work as its third group', () => {
    render(<App />)
    const selectedWork = screen.getByRole('region', { name: 'Selected work' })
    const groups = within(selectedWork).getAllByRole('group')
    const personalProjects = within(selectedWork).getByRole('group', { name: 'Personal projects' })

    expect(groups.at(-1)).toBe(personalProjects)
    expect(within(personalProjects).getByRole('article', { name: 'This portfolio' })).toBeVisible()
    expect(within(personalProjects).getByRole('article', { name: 'Trail Pulse' })).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Personal projects' })).not.toBeInTheDocument()
  })

  it('frames Personal projects as evidence of technical agency and keeps the public report link', () => {
    render(<App />)
    const personalProjects = within(
      screen.getByRole('region', { name: 'Selected work' })
    ).getByRole('group', { name: 'Personal projects' })
    const trailPulse = within(personalProjects).getByRole('article', { name: 'Trail Pulse' })
    expect(trailPulse).toHaveTextContent('AI-assisted prototype built end-to-end')
    expect(trailPulse).not.toHaveTextContent('vibe-coded')
    expect(screen.getByRole('link', { name: /A Fair Share for Children/i })).toHaveAttribute(
      'href',
      'https://www.laureatesandleaders.org/_files/ugd/811759_44700bb3bf134c7fa1e15adade4daa51.pdf'
    )
    expect(screen.getByText(/Nobel Peace Prize laureate Kailash Satyarthi and Bain India's Managing Director/i))
      .toBeInTheDocument()
  })

  it('offers LinkedIn and a direct, accessible email action without a CV affordance', () => {
    render(<App />)
    const navigation = screen.getByRole('navigation', { name: 'Primary' })
    const contact = screen.getByRole('region', { name: 'Let’s talk.' })
    expect(within(navigation).getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href', 'https://www.linkedin.com/in/rohan-misra-mba/'
    )
    expect(within(contact).getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href', 'https://www.linkedin.com/in/rohan-misra-mba/'
    )
    expect(screen.getByRole('link', { name: 'Email Rohan at misrarohan619@gmail.com' }))
      .toHaveAttribute('href', 'mailto:misrarohan619@gmail.com')
    expect(screen.getByRole('link', { name: 'Email Rohan at misrarohan619@gmail.com' }))
      .not.toHaveAttribute('target')
    expect(screen.queryByText(/CV/i)).not.toBeInTheDocument()
  })

  it('places Outside work immediately before the final Contact section', () => {
    render(<App />)
    const main = screen.getByRole('main')
    const contact = main.querySelector('#contact')
    const outsideWork = main.querySelector('#outside-work')

    expect(contact).not.toBeNull()
    expect(outsideWork).not.toBeNull()
    expect(outsideWork!.nextElementSibling).toBe(contact)
    expect(main.lastElementChild).toBe(contact)

    const section = screen.getByRole('region', { name: 'Outside work' })
    expect(section).toHaveTextContent('Beyond the résumé')
    expect(within(section).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Hiking',
      'History',
      'Travel',
      'Scuba diving',
      'Horse riding'
    ])
    expect(section).toHaveTextContent(
      'Usually outside, underwater, on the road—or halfway down a history rabbit hole.'
    )
  })

  it('keeps the longer introduction compact until the reader asks to expand it', async () => {
    const user = userEvent.setup()
    render(<App />)
    const main = screen.getByRole('main')
    const hero = screen.getByRole('region', {
      name: 'I turn messy operations into scalable products and systems.'
    })
    const profile = screen.getByRole('region', { name: 'Read more about me' })
    const trigger = within(profile).getByRole('button', { name: 'Read more about me' })
    const panel = document.getElementById('profile-details')
    const mark = profile.querySelector('.profile__toggle-mark')

    expect(hero.nextElementSibling).toBe(profile)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-controls', 'profile-details')
    expect(mark).toHaveTextContent('+')
    expect(panel).toHaveAttribute('aria-hidden', 'true')

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(mark).toHaveTextContent('×')
    expect(panel).not.toHaveAttribute('aria-hidden')
    expect(within(profile).getByText(/problems with real operational texture/i)).toBeVisible()
    expect(within(profile).getByText(/five promotions in under four years/i)).toBeVisible()
    expect(within(profile).getByText(/~\$250M in value across Bain engagements/i)).toBeVisible()
    expect(within(profile).queryByText(/youngest student/i)).not.toBeInTheDocument()
    expect(within(main).queryByRole('region', { name: 'About' })).not.toBeInTheDocument()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(panel).toHaveAttribute('aria-hidden', 'true')
    expect(trigger).toHaveFocus()
  })

  it('exposes every main section as a region labelled by its own visible heading', () => {
    render(<App />)
    expectMainSectionsToBeLabelledRegions(screen.getByRole('main'), 8)

    const selectedWork = screen.getByRole('region', { name: 'Selected work' })
    const capabilities = within(
      within(selectedWork).getByRole('article', { name: 'Omnichannel payments strategy' })
    ).getByRole('group', { name: 'Omnichannel payments strategy capabilities' })
    expect(capabilities).toHaveAccessibleName('Omnichannel payments strategy capabilities')
  })

  it('does not omit an unlabeled main section from semantic validation', () => {
    render(
      <main>
        <section aria-labelledby="fixture-heading">
          <h2 id="fixture-heading">Expected section</h2>
        </section>
        <section>
          <h2>Unlabelled section</h2>
        </section>
      </main>
    )

    expect(() => {
      expectMainSectionsToBeLabelledRegions(screen.getByRole('main'), 1)
    }).toThrow()
  })

  it('exposes an accessible name for every control, including icon-only controls', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    )
    render(<App />)
    const controls = [
      ...screen.queryAllByRole('button'),
      ...screen.queryAllByRole('link')
    ]
    expect(controls).not.toHaveLength(0)

    for (const control of controls) {
      expect(control).toHaveAccessibleName()
    }
  })
})
