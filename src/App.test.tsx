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
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeVisible()
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
    await user.click(screen.getByRole('button', { name: /Open case study: Buy-side/i }))
    expect(location.search).toBe('?case=buy-side-commercial-diligence')

    await user.click(document.querySelector<HTMLButtonElement>('.ask-rohan-launcher__button')!)

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Buy-side commercial diligence' }))
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
      .toHaveTextContent(/3\+ buy-side diligences/i)
    await user.click(screen.getByRole('button', { name: 'View supporting case' }))

    const caseDialog = screen.getByRole('dialog', { name: 'Buy-side commercial diligence' })
    expect(caseDialog).toBeVisible()
    expect(screen.queryByRole('dialog', { name: 'Ask Rohan AI' })).not.toBeInTheDocument()
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1)
    expect(document.querySelectorAll('[inert]')).toHaveLength(1)
  })

  it('opens the assistant from a case only after case cleanup and restores its work-card trigger', async () => {
    const user = userEvent.setup()
    render(<App />)
    const workTrigger = screen.getByRole('button', { name: /Open case study: Buy-side/i })
    await user.click(workTrigger)
    await user.click(screen.getByRole('button', { name: 'Ask Rohan AI about this work' }))

    expect(screen.queryByRole('dialog', { name: 'Buy-side commercial diligence' }))
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
      name: /Open case study: Talent-acquisition operating model/i
    }))

    expect(screen.getByRole('dialog', { name: 'Talent-acquisition operating model' }))
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
    const workTrigger = screen.getByRole('button', { name: /Open case study: Buy-side/i })
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
  })

  it('renders the corrected experience, verified essays, and safe contact state', () => {
    render(<App />)
    expect(screen.getByText('Senior Manager, Strategy & Operations')).toBeInTheDocument()
    expect(screen.getByText('July 2025–present')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Financialisation of Housing/i })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/pulse/financialisation-housing-imbroglio-decoded-rohan-misra/'
    )
    expect(
      screen
        .getAllByText('CV · updating')
        .every((node) => node.getAttribute('aria-disabled') === 'true')
    ).toBe(true)
    expect(screen.queryByRole('link', { name: /email/i })).not.toBeInTheDocument()
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

  it('renders the approved career, education, and expertise sections', () => {
    render(<App />)
    expect(screen.getByText('Legacy Pursuit')).toBeVisible()
    expect(screen.getByText('Kellogg School of Management')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Expertise' })).toBeVisible()
    expect(screen.getByText('Private-equity diligence')).toBeVisible()
  })

  it('keeps Builder Lab honest and repairs the public report link', () => {
    render(<App />)
    const builderLab = screen.getByRole('region', { name: 'Builder Lab' })
    const trailPulse = within(builderLab).getByRole('article', { name: 'Trail Pulse' })
    expect(trailPulse).toHaveTextContent('not a flagship product')
    expect(screen.getByRole('link', { name: /A Fair Share for Children/i })).toHaveAttribute(
      'href',
      'https://www.laureatesandleaders.org/_files/ugd/811759_44700bb3bf134c7fa1e15adade4daa51.pdf'
    )
  })

  it('offers LinkedIn only and keeps the CV disabled', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href', 'https://www.linkedin.com/in/rohan-misra-mba/'
    )
    expect(screen.getByText('CV · updating')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByRole('link', { name: /email/i })).not.toBeInTheDocument()
  })

  it('exposes every main section as a region labelled by its own visible heading', () => {
    render(<App />)
    expectMainSectionsToBeLabelledRegions(screen.getByRole('main'), 8)

    const selectedWork = screen.getByRole('region', { name: 'Selected work' })
    const disclosure = within(
      within(selectedWork).getByRole('article', { name: 'Trail Pulse' })
    ).getByRole('group', { name: 'What Trail Pulse does' })
    expect(disclosure).toHaveAccessibleName('What Trail Pulse does')
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
