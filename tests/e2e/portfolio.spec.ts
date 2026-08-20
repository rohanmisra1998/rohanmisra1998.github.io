import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

function relativeLuminance(color: string) {
  const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

async function settleHero(page: import('@playwright/test').Page) {
  await expect(page.locator('.hero__copy')).toHaveCSS('opacity', '1')
  await expect(page.locator('.hero__portrait')).toHaveCSS('opacity', '1')
}

async function settleAnimations(locator: import('@playwright/test').Locator) {
  await locator.evaluate(async (element) => {
    await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished))
  })
}

async function expectFullyInViewport(
  locator: import('@playwright/test').Locator,
  label: string
) {
  await expect(locator, `${label} must be rendered`).toBeVisible()
  const box = await locator.boundingBox()
  const viewport = locator.page().viewportSize()
  expect(box, `${label} must have rendered geometry`).not.toBeNull()
  expect(viewport, `${label} requires a configured viewport`).not.toBeNull()
  expect.soft(box!.x, `${label} starts left of the viewport`).toBeGreaterThanOrEqual(0)
  expect.soft(box!.y, `${label} starts above the viewport`).toBeGreaterThanOrEqual(0)
  expect.soft(box!.x + box!.width, `${label} extends right of the viewport`)
    .toBeLessThanOrEqual(viewport!.width)
  expect.soft(box!.y + box!.height, `${label} extends below the initial viewport`)
    .toBeLessThanOrEqual(viewport!.height)
}

async function expectMinimumTargetSize(
  targets: import('@playwright/test').Locator,
  context: string
) {
  const boxes = await targets.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect()
    return {
      width: box.width,
      height: box.height,
      label: element.getAttribute('aria-label') ?? element.textContent?.trim()
    }
  }))
  expect(boxes.length, `${context} must expose interactive targets`).toBeGreaterThan(0)
  for (const box of boxes) {
    expect.soft(box.width, `${context}: ${box.label} target width`).toBeGreaterThanOrEqual(44)
    expect.soft(box.height, `${context}: ${box.label} target height`).toBeGreaterThanOrEqual(44)
  }
}

async function expectNoMotionTransform(
  locator: import('@playwright/test').Locator,
  label: string,
  pseudoElement?: '::before' | '::after'
) {
  const styles = await locator.evaluate((element, pseudo) => {
    const computed = getComputedStyle(element, pseudo)
    return { animationName: computed.animationName, transform: computed.transform }
  }, pseudoElement)
  expect(styles.animationName, `${label} retains a keyframe animation`).toBe('none')
  expect(styles.transform, `${label} retains translation or scale`).toBe('none')
}

test('first viewport communicates the operator thesis and offers three actions', async ({ page }) => {
  await page.goto('/')
  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toContainText('messy operations')
  for (const [label, locator] of [
    ['operator thesis', heading],
    ['current role', page.getByText('Senior Manager, Strategy & Operations at eBay · San Jose, CA')],
    ['selected-work action', page.getByRole('link', { name: 'Explore selected work' })],
    ['assistant action', page.locator('.action--assistant')],
    ['writing action', page.getByRole('link', { name: 'Read my writing' })]
  ] as const) {
    await expectFullyInViewport(locator, label)
  }
})

test('keyboard users can skip directly to the main portfolio content', async ({ page }) => {
  await page.goto('/')
  const skipLink = page.getByRole('link', { name: 'Skip to main content' })
  const main = page.getByRole('main')

  await expect(skipLink).toHaveCSS('opacity', '0')
  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toHaveCSS('opacity', '1')
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/#main-content$/)
  await expect(main).toBeFocused()
})

test('case query supports direct load, close, and browser Back', async ({ page }) => {
  await page.goto('/?case=buy-side-commercial-diligence')
  await expect(page.getByRole('dialog', { name: 'Buy-side commercial diligence' })).toBeVisible()
  await page.getByRole('button', { name: 'Close case study' }).click()
  await expect(page).toHaveURL('/')
  await page.getByRole('button', { name: /Open case study: Workforce/i }).click()
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL('/')
})

test('selected work exposes six approved cards, then all eight, with honest disclosures', async ({ page }) => {
  await page.goto('/')
  const selectedWork = page.getByRole('region', { name: 'Selected work' })
  const initialCards = selectedWork.getByRole('article')

  await expect(initialCards).toHaveCount(6)
  await expect(initialCards.nth(0)).toHaveAccessibleName('Workforce operations transformation')
  await expect(initialCards.nth(5)).toHaveAccessibleName('Trail Pulse')
  await expect(initialCards.nth(5)).toHaveAttribute('data-emphasis', 'secondary')
  await expect(selectedWork.getByText('B2B SaaS and logistics')).toBeVisible()
  await expect(selectedWork.getByText('Life sciences', { exact: true })).toBeVisible()
  await expect(selectedWork.getByText(
    'Target identities, recommendations, conclusions, and transaction details remain private.'
  )).toBeVisible()
  await expect(selectedWork.getByText(
    'No target, investor, conclusion, or transaction detail is disclosed.'
  )).toBeVisible()
  await expect(selectedWork.getByText('Builder Lab · early AI-assisted, vibe-coded experiment'))
    .toBeVisible()

  await selectedWork.getByRole('button', { name: 'See all work' }).click()
  await expect(selectedWork.getByRole('article')).toHaveCount(8)
  await expect(selectedWork.getByText('Automotive services')).toBeVisible()
  await expect(selectedWork.getByText('Pharmaceuticals', { exact: true })).toBeVisible()
})

test('Trail Pulse remains an honest secondary case and a Builder Lab experiment', async ({ page }) => {
  await page.goto('/')
  const selectedWork = page.getByRole('region', { name: 'Selected work' })
  const selectedTrailPulse = selectedWork.getByRole('article', { name: 'Trail Pulse' })
  await expect(selectedTrailPulse.getByRole('group', { name: 'What Trail Pulse does' })).toBeVisible()

  const builderLab = page.getByRole('region', { name: 'Builder Lab' })
  const builderTrailPulse = builderLab.getByRole('article', { name: 'Trail Pulse' })
  await expect(builderTrailPulse.getByText(
    'An early AI-assisted, vibe-coded experiment built to learn and signal technical curiosity—not a flagship product.',
    { exact: true }
  )).toBeVisible()
  await expect(builderTrailPulse.getByRole('link', { name: 'Try Trail Pulse' })).toHaveAttribute(
    'href', 'https://trail-pulse-alpha.vercel.app/'
  )
})

test('writing, research, builder, and contact destinations are safe external links', async ({ page }) => {
  await page.goto('/')
  const expectedLinks = [
    ['Financialisation of Housing: An Imbroglio Decoded — LinkedIn, opens in a new tab', 'https://www.linkedin.com/pulse/financialisation-housing-imbroglio-decoded-rohan-misra/'],
    ['The Failed Promise of Pakistan — LinkedIn, opens in a new tab', 'https://www.linkedin.com/pulse/failed-promise-pakistan-rohan-misra/'],
    ['The Austrian School of Economic Thought: An Exposition — LinkedIn, opens in a new tab', 'https://www.linkedin.com/pulse/austrian-school-economic-thought-exposition-rohan-misra/'],
    ['A Fair Share for Children: Preventing the Loss of a Generation to COVID-19 — public report PDF, opens in a new tab', 'https://www.laureatesandleaders.org/_files/ugd/811759_44700bb3bf134c7fa1e15adade4daa51.pdf'],
    ['Try Trail Pulse', 'https://trail-pulse-alpha.vercel.app/']
  ] as const

  for (const [name, href] of expectedLinks) {
    const link = page.getByRole('link', { name, exact: true })
    await expect(link).toHaveAttribute('href', href)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /(?=.*noopener)(?=.*noreferrer)/)
  }

  const contact = page.getByRole('region', { name: 'Let’s talk.' })
  const linkedin = contact.getByRole('link', { name: 'LinkedIn', exact: true })
  await expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/rohan-misra-mba/')
  await expect(linkedin).toHaveAttribute('target', '_blank')
  await expect(linkedin).toHaveAttribute('rel', /(?=.*noopener)(?=.*noreferrer)/)
  const disabledCv = contact.getByText('CV · updating', { exact: true })
  await expect(disabledCv).toHaveAttribute('aria-disabled', 'true')
  await expect(contact.getByRole('link', { name: /CV/i })).toHaveCount(0)
  await expect(contact.getByRole('button', { name: /CV/i })).toHaveCount(0)
  await expect(contact.locator('a[href], button').filter({ hasText: /CV/i })).toHaveCount(0)
})

test('disabled CV stays out of tab order and ignores pointer and keyboard activation', async ({
  page,
  context,
}) => {
  const loadContact = async () => {
    await page.goto('/')
    const contact = page.getByRole('region', { name: 'Let’s talk.' })
    const disabledCv = contact.getByText('CV · updating', { exact: true })
    await expect(disabledCv).toBeVisible()
    return { contact, disabledCv }
  }

  const expectNoActivation = async (
    interaction: string,
    initialUrl: string,
    initialPageCount: number,
    openedNewPage: boolean,
  ) => {
    expect.soft(page.url(), `${interaction} changed the current URL`).toBe(initialUrl)
    expect.soft(openedNewPage, `${interaction} opened a new page`).toBe(false)
    expect.soft(context.pages().length, `${interaction} opened a new page`).toBe(initialPageCount)
    await expect(page.getByText('CV · updating', { exact: true })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  }

  const { contact, disabledCv } = await loadContact()
  const linkedin = contact.getByRole('link', { name: 'LinkedIn', exact: true })
  await linkedin.focus()
  await page.keyboard.press('Tab')
  expect.soft(await disabledCv.evaluate((element) => element === document.activeElement)).toBe(false)

  for (const [interaction, key] of [
    ['Clicking the disabled CV', null],
    ['Pressing Enter on the disabled CV', 'Enter'],
    ['Pressing Space on the disabled CV', ' '],
  ] as const) {
    const loaded = await loadContact()
    const initialUrl = page.url()
    const initialPageCount = context.pages().length
    const newPage = context
      .waitForEvent('page', { timeout: 500 })
      .then(() => true)
      .catch(() => false)

    if (key === null) {
      await loaded.disabledCv.click()
    } else {
      await loaded.disabledCv.dispatchEvent('keydown', {
        key,
        code: key === 'Enter' ? 'Enter' : 'Space',
        bubbles: true,
      })
    }

    await expectNoActivation(
      interaction,
      initialUrl,
      initialPageCount,
      await newPage,
    )
    for (const extraPage of context.pages().slice(initialPageCount)) {
      await extraPage.close()
    }
  }
})

test('theme control cycles through and persists system, light, and dark states', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Theme: system' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/)

  await toggle.click()
  await expect(page.getByRole('button', { name: 'Theme: light' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('rohan-theme'))).toBe('light')

  await page.getByRole('button', { name: 'Theme: light' }).click()
  await expect(page.getByRole('button', { name: 'Theme: dark' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Theme: dark' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('button', { name: 'Theme: dark' }).click()
  await expect(page.getByRole('button', { name: 'Theme: system' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('rohan-theme'))).toBe('system')
})

test('mobile menu closes on outside activation and Escape and restores trigger focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'Mobile-only disclosure behavior')

  await page.goto('/')
  const button = page.getByRole('button', { name: 'Open navigation' })
  const navigation = page.getByRole('navigation', { name: 'Primary' })

  await button.click()
  await expect(navigation).toBeVisible()
  await page.locator('main').dispatchEvent('pointerdown')
  await expect(navigation).toBeHidden()
  await expect(button).toBeFocused()

  await button.click()
  await expect(navigation).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(navigation).toBeHidden()
  await expect(button).toBeFocused()
})

test('desktop navigation stays exposed and tablet navigation uses a disclosure', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'One desktop-to-tablet navigation check')

  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  await expect(page.locator('button[aria-controls="primary-navigation"]')).toBeHidden()

  await page.setViewportSize({ width: 768, height: 1024 })
  const button = page.getByRole('button', { name: 'Open navigation' })
  await expect(button).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden()
  await button.click()
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
})

test('invalid direct case queries are removed without opening a dialog', async ({ page }) => {
  await page.goto('/?case=private-client-name')
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('case dialog starts on its heading, preserves natural Tab order, traps both boundaries, and restores its trigger', async ({ page }) => {
  await page.goto('/')
  const selectedWork = page.getByRole('region', { name: 'Selected work' })
  const trigger = selectedWork.getByRole('button', { name: 'Open case study: Trail Pulse' })
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: 'Trail Pulse' })
  const heading = dialog.getByRole('heading', { level: 2, name: 'Trail Pulse' })
  const close = dialog.getByRole('button', { name: 'Close case study' })
  const external = dialog.getByRole('link', { name: 'Try Trail Pulse' })
  const assistantAction = dialog.getByRole('button', { name: 'Ask Rohan AI about this work' })
  await expect(heading).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(external).toBeFocused()

  await heading.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(close).toBeFocused()

  await close.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(assistantAction).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('normal motion stays within the approved interaction caps', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'One computed normal-motion contract')

  await page.goto('/')
  const firstCard = page.getByRole('region', { name: 'Selected work' }).getByRole('article').first()
  await firstCard.hover()
  await settleAnimations(firstCard)

  const cardLift = await firstCard.evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
    return Math.abs(matrix.m42)
  })
  const visualScale = await firstCard.locator('.case-card__visual').evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element, '::before').transform)
    return Math.hypot(matrix.a, matrix.b)
  })
  expect.soft(cardLift, 'card hover lift exceeded 2px').toBeLessThanOrEqual(2)
  expect.soft(visualScale, 'card visual scale exceeded 1.02').toBeLessThanOrEqual(1.02)

  await firstCard.getByRole('button', { name: /Open case study:/i }).click()
  const duration = await page.getByRole('dialog').evaluate((element) => {
    const value = getComputedStyle(element).animationDuration
    return value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000
  })
  expect.soft(duration, 'case sheet entry must be at least 180ms').toBeGreaterThanOrEqual(180)
  expect.soft(duration, 'case sheet entry must be at most 240ms').toBeLessThanOrEqual(240)
})

test('case dialog presents title before industry in the accessibility reading order', async ({ page }) => {
  await page.goto('/?case=buy-side-commercial-diligence')
  const dialog = page.getByRole('dialog', { name: 'Buy-side commercial diligence' })
  const title = dialog.getByRole('heading', { level: 2, name: 'Buy-side commercial diligence' })
  await expect(title).toBeFocused()
  const order = await dialog.locator('.case-dialog__rail > h2, .case-dialog__rail > .case-dialog__industry')
    .evaluateAll((elements) => elements.map((element) => element.textContent?.trim()))
  expect(order).toEqual(['Buy-side commercial diligence', 'B2B SaaS and logistics'])
  const titleGeometry = await title.evaluate((element) => {
    const box = element.getBoundingClientRect()
    const text = document.createRange()
    text.selectNodeContents(element)
    const textBox = text.getBoundingClientRect()
    return {
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      textLeft: textBox.left,
      textRight: textBox.right,
      titleLeft: box.left,
      titleRight: box.right
    }
  })
  expect(titleGeometry.scrollWidth).toBeLessThanOrEqual(titleGeometry.clientWidth)
  expect(titleGeometry.textLeft).toBeGreaterThanOrEqual(titleGeometry.titleLeft - 1)
  expect(titleGeometry.textRight).toBeLessThanOrEqual(titleGeometry.titleRight + 1)
})

test('mobile launcher never overlaps or intercepts a visible hero action', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'One direct 320px/390px geometry contract')

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 })
    await page.goto('/')
    await settleHero(page)
    const launcher = page.locator('.ask-rohan-launcher__button')
    await expect(launcher).toBeVisible()
    for (const action of await page.locator('.hero__actions .action:visible').all()) {
      await action.scrollIntoViewIfNeeded()
      const launcherBox = await launcher.boundingBox()
      expect(launcherBox, `${width}px launcher must have geometry`).not.toBeNull()
      const actionBox = await action.boundingBox()
      expect(actionBox, `${width}px hero action must have geometry`).not.toBeNull()
      const overlapWidth = Math.max(0, Math.min(
        launcherBox!.x + launcherBox!.width,
        actionBox!.x + actionBox!.width
      ) - Math.max(launcherBox!.x, actionBox!.x))
      const overlapHeight = Math.max(0, Math.min(
        launcherBox!.y + launcherBox!.height,
        actionBox!.y + actionBox!.height
      ) - Math.max(launcherBox!.y, actionBox!.y))
      expect(
        overlapWidth * overlapHeight,
        `${width}px launcher intersects ${await action.innerText()}`
      ).toBe(0)
      expect(await action.evaluate((element) => {
        const box = element.getBoundingClientRect()
        const owner = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
        return owner === element || element.contains(owner)
      }), `${width}px action center is intercepted`).toBe(true)
    }
  }
})

test('supported widths keep rendered content in the viewport and controls at least 44px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'One cross-viewport regression check')

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `${width}px viewport overflowed horizontally`
    ).toBe(true)

    await expectMinimumTargetSize(page.locator('a[href]:visible, button:visible'), `${width}px initial page`)

    if (width <= 900) {
      await page.getByRole('button', { name: 'Open navigation' }).click()
      await expectMinimumTargetSize(
        page.getByRole('navigation', { name: 'Primary' }).locator('a[href]:visible'),
        `${width}px expanded navigation`
      )
      await page.keyboard.press('Escape')
    }

    const selectedWork = page.getByRole('region', { name: 'Selected work' })
    await selectedWork.getByRole('button', { name: 'See all work' }).click()
    await expectMinimumTargetSize(page.locator('a[href]:visible, button:visible'), `${width}px expanded work`)

    await selectedWork.getByRole('button', { name: 'Open case study: Trail Pulse' }).click()
    const dialog = page.getByRole('dialog', { name: 'Trail Pulse' })
    await settleAnimations(dialog)
    await expectMinimumTargetSize(
      dialog.locator('a[href]:visible, button:visible'),
      `${width}px case dialog`
    )
  }
})

test('mobile narrative and support copy remains at least 16px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'Mobile typography contract')

  await page.goto('/')
  for (const selector of [
    '.hero__subhead',
    '.hero__current',
    '.selected-work__header > div > p',
    '.case-card__evidence',
    '.case-card__capabilities li',
    '.case-card__disclosure',
    '.section-heading__note',
    '.builder-card__description',
    '.builder-card__honesty',
    '.builder-card li',
    '.experience__intro > p:last-child',
    '.experience-row__summary',
    '.expertise-group li',
    '.education p',
    '.education__meta',
    '.writing-row__body > p',
    '.about__statement',
    '.contact__body > p'
  ]) {
    const elements = page.locator(selector)
    expect(await elements.count(), `${selector} must resolve to rendered content`).toBeGreaterThan(0)
    const fontSizes = await elements.evaluateAll((nodes) => (
      nodes.map((node) => Number.parseFloat(getComputedStyle(node).fontSize))
    ))
    expect(Math.min(...fontSizes), `${selector} dropped below the 16px mobile floor`)
      .toBeGreaterThanOrEqual(16)
  }

  await page.getByRole('region', { name: 'Selected work' })
    .getByRole('button', { name: 'Open case study: Trail Pulse' }).click()
  for (const selector of [
    '.case-dialog__thesis',
    '.case-dialog__role > p:last-child',
    '.case-dialog__capability-group li',
    '.case-dialog__narrative h3',
    '.case-dialog__disclosure'
  ]) {
    const elements = page.locator(selector)
    expect(await elements.count(), `${selector} must resolve to rendered dialog copy`).toBeGreaterThan(0)
    const fontSizes = await elements.evaluateAll((nodes) => (
      nodes.map((node) => Number.parseFloat(getComputedStyle(node).fontSize))
    ))
    expect(Math.min(...fontSizes), `${selector} dropped below the 16px mobile floor`)
      .toBeGreaterThanOrEqual(16)
  }
})

test('reduced motion removes translation and scale from animated interface states', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'One reduced-motion state contract')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expectNoMotionTransform(page.locator('.hero__copy'), 'hero copy')
  await expectNoMotionTransform(page.locator('.hero__portrait'), 'hero portrait')

  const firstCard = page.getByRole('region', { name: 'Selected work' }).getByRole('article').first()
  await firstCard.hover()
  await expectNoMotionTransform(firstCard, 'work card')
  await expectNoMotionTransform(firstCard.locator('.case-card__visual'), 'work-card visual', '::before')

  await page.getByRole('button', { name: 'Open navigation' }).click()
  for (const menuLine of await page.locator('.site-header__menu span').all()) {
    await expectNoMotionTransform(menuLine, 'mobile menu line')
  }
  await page.keyboard.press('Escape')

  await firstCard.getByRole('button', { name: /Open case study:/i }).click()
  await expectNoMotionTransform(page.getByRole('dialog'), 'case dialog')
})

test('small text and the primary hover state meet WCAG AA contrast', async ({ page }) => {
  await page.goto('/')
  await settleHero(page)

  for (const selector of ['.hero__eyebrow', '.hero__current']) {
    const colors = await page.locator(selector).evaluate((element) => ({
      foreground: getComputedStyle(element).color,
      background: getComputedStyle(document.body).backgroundColor
    }))
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5)
  }

  const primaryAction = page.getByRole('link', { name: 'Explore selected work' })
  await primaryAction.hover()
  const hoverColors = await primaryAction.evaluate((element) => ({
    foreground: getComputedStyle(element).color,
    background: getComputedStyle(element).backgroundColor
  }))
  expect(contrastRatio(hoverColors.foreground, hoverColors.background)).toBeGreaterThanOrEqual(4.5)
})

test('settled home, open disclosure, and open case have no detectable accessibility violations', async ({ page }) => {
  await page.goto('/')
  await settleHero(page)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])

  const selectedWork = page.getByRole('region', { name: 'Selected work' })
  await selectedWork.getByRole('button', { name: 'Open case study: Trail Pulse' }).click()
  const dialog = page.getByRole('dialog', { name: 'Trail Pulse' })
  await expect(dialog).toBeVisible()
  await settleAnimations(dialog)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('open mobile navigation has no detectable accessibility violations', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'Mobile-only disclosure state')

  await page.goto('/')
  await settleHero(page)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('assistant graph preloads for offline use and both case handoffs keep one surface', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'One desktop lazy-boundary smoke')

  await page.goto('/')
  const launcher = page.locator('.ask-rohan-launcher__button')
  await expect(launcher).toBeVisible()
  await expect(launcher).toHaveCSS('width', '56px')
  await expect(launcher).toHaveCSS('height', '56px')
  const assistantResources = await page.evaluate(() => performance.getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((name) => /AssistantFeature|assistant-knowledge|localAdapter/.test(name)))
  expect(assistantResources.some((name) => name.includes('AssistantFeature'))).toBe(true)
  expect(assistantResources.some((name) => name.includes('assistant-knowledge'))).toBe(true)

  await page.getByRole('button', {
    name: /Open case study: Talent-acquisition operating model/i
  }).click()
  await expect(page.getByRole('button', { name: 'Ask Rohan AI about this work' }))
    .toHaveCount(0)
  await page.getByRole('button', { name: 'Close case study' }).click()

  await page.getByRole('button', { name: /Open case study: Buy-side/i }).click()
  await launcher.evaluate((button) => (button as HTMLButtonElement).click())
  await expect(page.getByRole('dialog', { name: 'Buy-side commercial diligence' })).toHaveCount(0)
  await expect(page.locator('.ask-rohan')).toHaveCount(1)
  await expect(page.getByRole('textbox', { name: 'Ask a question' })).toBeFocused()
  expect(await page.locator('[inert]').count()).toBe(0)
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('')
  await page.getByRole('button', { name: 'Close assistant panel' }).click()

  await context.setOffline(true)
  await page.locator('.action--assistant').click()
  const composer = page.getByRole('textbox', { name: 'Ask a question' })
  await expect(composer).toBeFocused()
  await page.getByRole('button', { name: /private-equity diligence/i }).click()
  await expect(page.getByRole('article', { name: 'Grounded answer' })).toContainText(
    '3+ buy-side diligences'
  )
  await page.getByRole('button', { name: 'View supporting case' }).click()
  await expect(page.getByRole('dialog', { name: 'Buy-side commercial diligence' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(1)

  await page.getByRole('button', { name: 'Close case study' }).click()
  const caseTrigger = page.getByRole('button', { name: /Open case study: Buy-side/i })
  await caseTrigger.click()
  await page.getByRole('button', { name: 'Ask Rohan AI about this work' }).click()
  await expect(composer).toBeFocused()
  await expect(page.locator('.ask-rohan__follow-ups button').first()).toHaveText(
    "What is Rohan's private-equity diligence experience?"
  )
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close assistant panel' }).click()
  await expect(caseTrigger).toBeFocused()
})
