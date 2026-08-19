import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
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

  it('keeps the Proofline decorative and the portrait descriptive', () => {
    render(<App />)
    expect(screen.getByTestId('proofline')).toHaveAttribute('aria-hidden', 'true')
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

  it('exposes every main section as a region labelled by its own visible heading', () => {
    render(<App />)
    expectMainSectionsToBeLabelledRegions(screen.getByRole('main'), 7)

    const disclosure = within(
      screen.getByRole('article', { name: 'Trail Pulse' })
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
