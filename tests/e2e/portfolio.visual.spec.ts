import { expect, test, type Page, type TestInfo } from '@playwright/test'

const reviewProject = 'chromium-desktop'

const viewports = [
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'small-mobile', width: 320, height: 720 }
] as const

function hasRobustInteractiveTargetGeometry(target: { height: number; width: number }) {
  return target.width >= 44 && target.height >= 44
}

function skipOutsideReviewProject(testInfo: TestInfo) {
  test.skip(
    testInfo.project.name !== reviewProject,
    'Visual baselines are reviewed once in the desktop Chromium project.'
  )
}

function captureUnexpectedBrowserMessages(page: Page) {
  const messages: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      messages.push(`console.${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`))

  return () => {
    expect(messages, 'The page emitted unexpected console or page errors.').toEqual([])
  }
}

async function waitForPortfolioToSettle(page: Page) {
  await page.waitForLoadState('networkidle')
  const launcherImage = page.locator('.ask-rohan-launcher__button img')
  await launcherImage.waitFor({ state: 'visible' })
  await launcherImage.evaluate(async (image) => {
    await (image as HTMLImageElement).decode()
  })
  await page.evaluate(async () => {
    await document.fonts.ready

    const root = document.documentElement
    const previousScrollBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'

    const frame = () => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
    const step = Math.max(320, Math.floor(window.innerHeight * 0.75))

    for (let top = 0; top < root.scrollHeight; top += step) {
      window.scrollTo(0, top)
      await frame()
    }
    window.scrollTo(0, root.scrollHeight)
    await frame()

    await Promise.all([...document.images].map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve, reject) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => reject(new Error(`Image failed: ${image.currentSrc}`)), {
            once: true
          })
        })
      }
      await image.decode()
      if (image.naturalWidth === 0 || image.naturalHeight === 0) {
        throw new Error(`Image decoded without intrinsic dimensions: ${image.currentSrc}`)
      }
    }))

    root.style.scrollBehavior = previousScrollBehavior
    window.scrollTo(0, 0)
    await frame()
  })

  await page.waitForFunction(() => document.getAnimations().every((animation) => (
    animation.playState !== 'running' && animation.playState !== 'pending'
  )))
  await page.evaluate(async () => {
    for (const animation of document.getAnimations()) {
      if (animation.playState !== 'finished') continue
      animation.commitStyles()
      animation.cancel()
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  })
}

async function waitForRenderedState(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve, reject) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => reject(new Error(`Image failed: ${image.currentSrc}`)), {
            once: true
          })
        })
      }
      await image.decode()
    }))
    await Promise.all(document.getAnimations().map(async (animation) => {
      try {
        await animation.finished
      } catch {
        // Canceled animations are replaced state; the double frame below observes the replacement.
      }
    }))
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  })
}

async function expectReviewedScreenshot(
  page: Page,
  name: string,
  options: { fullPage?: boolean } = {}
) {
  await expect(page).toHaveScreenshot(name, {
    animations: 'allow',
    caret: 'hide',
    fullPage: options.fullPage,
    maxDiffPixelRatio: 0,
    maxDiffPixels: 0,
    threshold: 0
  })
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const measurements = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    rootWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }))

  expect(
    measurements.rootWidth,
    `${label} root overflowed: ${JSON.stringify(measurements)}`
  ).toBeLessThanOrEqual(measurements.viewportWidth)
  expect(
    measurements.bodyWidth,
    `${label} body overflowed: ${JSON.stringify(measurements)}`
  ).toBeLessThanOrEqual(measurements.viewportWidth)
}

async function expectIntentionalSectionRhythm(page: Page, viewportHeight: number, label: string) {
  const [selectedWork, experience] = await Promise.all([
    page.getByRole('region', { name: 'Selected work' }).boundingBox(),
    page.getByRole('region', { name: 'Experience' }).boundingBox()
  ])
  expect(selectedWork, `${label} Selected work has no box`).not.toBeNull()
  expect(experience, `${label} Experience has no box`).not.toBeNull()

  const gap = experience!.y - (selectedWork!.y + selectedWork!.height)
  expect(
    gap,
    `${label} has ${Math.round(gap)}px of dead space between Selected work and Experience.`
  ).toBeLessThanOrEqual(Math.round(viewportHeight * 0.2))
}

for (const viewport of viewports) {
  test(`${viewport.name} portfolio has a reviewed full-page baseline`, async ({ page }, testInfo) => {
    skipOutsideReviewProject(testInfo)
    const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

    await page.setViewportSize(viewport)
    await page.goto('/')
    await waitForPortfolioToSettle(page)

    await expectNoHorizontalOverflow(page, `${viewport.width}px`)
    await expectIntentionalSectionRhythm(page, viewport.height, viewport.name)
    expectCleanBrowser()
    await expectReviewedScreenshot(page, `${viewport.name}-home.png`, { fullPage: true })
    expectCleanBrowser()
  })
}

test('reduced motion keeps the first-view narrative and assistant action visible', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await waitForPortfolioToSettle(page)

  await expect(page.locator('.hero__copy')).toBeVisible()
  await expect(page.locator('.hero__portrait')).toBeVisible()
  await expect(page.locator('.action--assistant')).toBeVisible()
  expect(await page.locator('.hero__copy').evaluate((copy) => {
    const matrix = new DOMMatrix(getComputedStyle(copy).transform)
    return { x: matrix.m41, y: matrix.m42 }
  })).toEqual({ x: 0, y: 0 })
  await expectNoHorizontalOverflow(page, 'reduced-motion desktop')
  expectCleanBrowser()
  await expectReviewedScreenshot(page, 'reduced-motion-home.png')
  expectCleanBrowser()
})

test('dark home has a reviewed full-page baseline', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await waitForPortfolioToSettle(page)

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expectNoHorizontalOverflow(page, 'dark desktop home')
  expectCleanBrowser()
  await expectReviewedScreenshot(page, 'dark-home.png', { fullPage: true })
  expectCleanBrowser()
})

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'mobile', width: 390, height: 844 }
] as const) {
  test(`${viewport.name} case dialog has a reviewed baseline`, async ({ page }, testInfo) => {
    skipOutsideReviewProject(testInfo)
    const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

    await page.setViewportSize(viewport)
    await page.goto('/?case=buy-side-commercial-diligence')
    const dialog = page.getByRole('dialog', { name: 'B2B SaaS & logistics investment diligence' })
    await expect(dialog).toBeVisible()
    await waitForRenderedState(page)

    await expectNoHorizontalOverflow(page, `${viewport.name} case dialog`)
    expectCleanBrowser()
    await expectReviewedScreenshot(page, `case-${viewport.name}.png`)
    expectCleanBrowser()
  })
}

test('assistant compact state has a reviewed baseline', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await waitForPortfolioToSettle(page)
  await page.locator('.action--assistant').click()
  await expect(page.getByRole('complementary', { name: 'Ask Rohan AI' })).toBeVisible()
  await waitForRenderedState(page)

  await expectNoHorizontalOverflow(page, 'assistant compact')
  expectCleanBrowser()
  await expectReviewedScreenshot(page, 'assistant-compact.png')
  expectCleanBrowser()
})

test('assistant expanded state has a reviewed baseline', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await waitForPortfolioToSettle(page)
  await page.locator('.action--assistant').click()
  await page.getByRole('button', { name: 'Expand assistant' }).click()
  await expect(page.getByRole('dialog', { name: 'Ask Rohan AI' })).toBeVisible()
  await waitForRenderedState(page)

  await expectNoHorizontalOverflow(page, 'assistant expanded')
  expectCleanBrowser()
  await expectReviewedScreenshot(page, 'assistant-expanded.png')
  expectCleanBrowser()
})

test('assistant grounded answer has a reviewed baseline', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await waitForPortfolioToSettle(page)
  await page.locator('.action--assistant').click()
  await page.getByRole('button', { name: /private-equity diligence/i }).click()
  await expect(page.getByRole('article', { name: 'Grounded answer' })).toContainText(
    'X buy-side investment theses'
  )
  await waitForRenderedState(page)

  await expectNoHorizontalOverflow(page, 'assistant grounded answer')
  expectCleanBrowser()
  await expectReviewedScreenshot(page, 'assistant-answer.png')
  expectCleanBrowser()
})

test('assistant clarification has a reviewed baseline', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await waitForPortfolioToSettle(page)
  await page.locator('.action--assistant').click()
  await page.getByRole('textbox', { name: 'Ask a question' }).fill(
    'Tell me about strategy and operations'
  )
  await page.getByRole('textbox', { name: 'Ask a question' }).press('Enter')
  await expect(page.getByRole('article', { name: 'Grounded answer' })).toContainText(
    'I found two close topics.'
  )
  await waitForRenderedState(page)

  await expectNoHorizontalOverflow(page, 'assistant clarification')
  expectCleanBrowser()
  await expectReviewedScreenshot(page, 'assistant-clarification.png')
  expectCleanBrowser()
})

test('assistant unsupported fallback has a reviewed baseline', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await waitForPortfolioToSettle(page)
  await page.locator('.action--assistant').click()
  await page.getByRole('textbox', { name: 'Ask a question' }).fill(
    'What is the weather in San Jose?'
  )
  await page.getByRole('textbox', { name: 'Ask a question' }).press('Enter')
  await expect(page.getByRole('article', { name: 'Grounded answer' })).toContainText(
    'I can only answer from approved public content on this portfolio.'
  )
  await waitForRenderedState(page)

  await expectNoHorizontalOverflow(page, 'assistant fallback')
  expectCleanBrowser()
  await expectReviewedScreenshot(page, 'assistant-fallback.png')
  expectCleanBrowser()
})

test('assistant mobile drawer has a reviewed baseline', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await waitForPortfolioToSettle(page)
  await page.locator('.action--assistant').click()
  const drawer = page.getByRole('dialog', { name: 'Ask Rohan AI' })
  await expect(drawer).toHaveClass(/ask-rohan--compact/)
  await waitForRenderedState(page)
  const box = await drawer.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBe(0)
  expect(box!.width).toBe(390)
  expect(box!.y).toBeGreaterThan(0)
  expect(box!.height).toBeLessThan(844 * 0.8)
  expect(box!.y + box!.height).toBeCloseTo(844, 0)

  await expectNoHorizontalOverflow(page, 'assistant mobile drawer')
  expectCleanBrowser()
  await expectReviewedScreenshot(page, 'assistant-mobile-drawer.png')
  expectCleanBrowser()
})

test('assistant mobile expanded state has a reviewed baseline', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await waitForPortfolioToSettle(page)
  await page.locator('.action--assistant').click()
  const expanded = page.getByRole('dialog', { name: 'Ask Rohan AI' })
  const compactBox = await expanded.boundingBox()
  expect(compactBox).not.toBeNull()
  await page.getByRole('button', { name: 'Expand assistant' }).click()
  await expect(expanded).toHaveClass(/ask-rohan--expanded/)
  await expect(expanded).toHaveClass(/ask-rohan--mobile/)
  await waitForRenderedState(page)
  const expandedBox = await expanded.boundingBox()
  expect(expandedBox).not.toBeNull()
  expect(expandedBox!.x).toBe(0)
  expect(expandedBox!.width).toBe(390)
  expect(expandedBox!.height).toBeGreaterThan(844 * 0.9)
  expect(expandedBox!.height).toBeGreaterThan(compactBox!.height + 120)
  expect(expandedBox!.y + expandedBox!.height).toBeCloseTo(844, 0)

  await expectNoHorizontalOverflow(page, 'assistant mobile expanded')
  expectCleanBrowser()
  await expectReviewedScreenshot(page, 'assistant-mobile-expanded.png')
  expectCleanBrowser()
})

test('assistant reduced-motion state has a reviewed baseline', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await waitForPortfolioToSettle(page)
  await page.locator('.action--assistant').click()
  const assistant = page.getByRole('complementary', { name: 'Ask Rohan AI' })
  await expect(assistant).toBeVisible()
  await expect(assistant).toHaveCSS('animation-name', 'none')
  await waitForRenderedState(page)

  await expectNoHorizontalOverflow(page, 'assistant reduced motion')
  expectCleanBrowser()
  await expectReviewedScreenshot(page, 'assistant-reduced-motion.png')
  expectCleanBrowser()
})

test('hero portrait resolves WebP across reviewed visual contexts', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)

  const scenarios = [
    ...viewports.map((viewport) => ({ ...viewport, reducedMotion: 'no-preference' as const })),
    { name: 'reduced-motion', width: 1440, height: 1100, reducedMotion: 'reduce' as const }
  ]

  for (const scenario of scenarios) {
    await page.setViewportSize(scenario)
    await page.emulateMedia({ reducedMotion: scenario.reducedMotion })
    await page.goto('/')
    await waitForPortfolioToSettle(page)

    const currentPath = await page.locator('.hero__portrait img').evaluate((image) => (
      new URL((image as HTMLImageElement).currentSrc).pathname
    ))
    expect(currentPath, `${scenario.name} selected the wrong portrait source`)
      .toMatch(/\/images\/rohan-portrait\.webp$/)
  }
})

test('interactive target geometry rejects boxes with only one 44px dimension', ({}, testInfo) => {
  skipOutsideReviewProject(testInfo)

  expect(
    hasRobustInteractiveTargetGeometry({ height: 20, width: 100 }),
    'A wide but shallow target must not satisfy the mobile target contract.'
  ).toBe(false)
  expect(
    hasRobustInteractiveTargetGeometry({ height: 100, width: 20 }),
    'A narrow but tall target must not satisfy the mobile target contract.'
  ).toBe(false)
  expect(hasRobustInteractiveTargetGeometry({ height: 44, width: 44 })).toBe(true)
})

test('tablet outside-work interests keep a full-width readable rhythm', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)

  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/')
  await waitForPortfolioToSettle(page)

  const section = page.getByRole('region', { name: 'Outside work' })
  const interests = section.getByRole('list', { name: 'Interests' })
  const [sectionBox, interestsBox] = await Promise.all([
    section.boundingBox(),
    interests.boundingBox()
  ])
  expect(sectionBox).not.toBeNull()
  expect(interestsBox).not.toBeNull()
  expect(interestsBox!.width).toBeGreaterThanOrEqual(sectionBox!.width * 0.9)

  const itemWidths = await interests.getByRole('listitem').evaluateAll((items) => (
    items.map((item) => item.getBoundingClientRect().width)
  ))
  expect(itemWidths.every((width) => width >= 100)).toBe(true)
})

test('responsive boundary contracts preserve navigation, reading, and contact states', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  for (const width of [1024, 641, 640, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 720 : 900 })
    await page.goto('/')
    await waitForPortfolioToSettle(page)
    await expectNoHorizontalOverflow(page, `${width}px boundary`)

    const menuButton = page.locator('button[aria-controls="primary-navigation"]')
    const navigation = page.locator('nav[aria-label="Primary"]')

    if (width <= 900) {
      await expect(menuButton).toBeVisible()
      const target = await menuButton.boundingBox()
      expect(target, `${width}px navigation trigger has no box`).not.toBeNull()
      expect(target!.width, `${width}px navigation trigger is too narrow`).toBeGreaterThanOrEqual(44)
      expect(target!.height, `${width}px navigation trigger is too short`).toBeGreaterThanOrEqual(44)

      const initialOverflow = await page.locator('body').evaluate((body) => getComputedStyle(body).overflowY)
      await menuButton.click()
      await expect(navigation).toBeVisible()
      const openTarget = await menuButton.boundingBox()
      expect(openTarget!.y).toBeGreaterThanOrEqual(0)
      expect(openTarget!.y + openTarget!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
      await menuButton.click()
      await expect(navigation).toBeHidden()
      expect(await page.locator('body').evaluate((body) => getComputedStyle(body).overflowY))
        .toBe(initialOverflow)
      await page.mouse.wheel(0, 500)
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
      await page.evaluate(() => window.scrollTo(0, 0))
    } else {
      await expect(menuButton).toBeHidden()
      await expect(navigation).toBeVisible()
    }

    const imageGeometry = await page.locator('img').evaluateAll((images) => images.map((image) => ({
      alt: image.alt,
      complete: image.complete,
      height: image.getAttribute('height'),
      naturalHeight: image.naturalHeight,
      naturalWidth: image.naturalWidth,
      width: image.getAttribute('width')
    })))
    expect(imageGeometry.every((image) => (
      image.complete
      && image.naturalWidth > 0
      && image.naturalHeight > 0
      && image.width !== null
      && image.height !== null
    )), `Images lacked stable intrinsic geometry at ${width}px: ${JSON.stringify(imageGeometry)}`)
      .toBe(true)
  }

  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 320, height: 720 }
  ]) {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await waitForPortfolioToSettle(page)

    const trailPulse = page.getByRole('region', { name: 'Selected work' })
      .getByRole('group', { name: 'Personal projects' })
      .getByRole('article', { name: 'Trail Pulse' })
    await expect(trailPulse.getByRole('list', { name: 'Trail Pulse capabilities' })).toBeVisible()
    await expectNoHorizontalOverflow(page, `${width}px Trail Pulse project card`)

    const bodyTextSizes = await page.locator([
      '.hero__subhead',
      "section[aria-labelledby='operating-thesis-heading'] p",
      '.operator-proof__summary',
      '.operator-proof__evidence-item p',
      '.social-proof > p',
      '.builder-card__description',
      '.builder-card__honesty',
      '.builder-card li',
      '.section-heading__note',
      '.experience-row__detail p',
      '.writing-row__body p',
      '.about__statement',
      '.about__assistant > p:last-child',
      '.contact__body > p'
    ].join(',')).evaluateAll((nodes) => nodes.map((node) => ({
      className: node.className,
      fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
      text: node.textContent?.trim().slice(0, 48)
    })))
    expect.soft(
      bodyTextSizes.every(({ fontSize }) => fontSize >= 16),
      `${width}px explanatory/body copy fell below 16px: ${JSON.stringify(bodyTextSizes, null, 2)}`
    ).toBe(true)

    for (const title of await page.locator('.writing-row__body h3').all()) {
      expect(await title.evaluate((heading) => heading.scrollWidth <= heading.clientWidth + 1)).toBe(true)
    }
    const emailAction = page.locator('#contact').getByRole('link', {
      name: 'Email Rohan at misrarohan619@gmail.com',
      exact: true
    })
    await expect(emailAction).toHaveAttribute('href', 'mailto:misrarohan619@gmail.com')
    await expect(page.locator('#contact')).not.toContainText(/CV/i)
    await expect(page.locator('#contact').getByRole('link', { name: 'LinkedIn', exact: true }))
      .toBeVisible()
    expect(await emailAction.evaluate((link) => link.scrollWidth <= link.clientWidth + 1)).toBe(true)

    const expectVisibleTargetsHaveRobustGeometry = async (state: string) => {
      const targets = await page.locator('a[href], button, summary').evaluateAll((elements) => (
        elements.flatMap((element) => {
          const box = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          if (
            box.width === 0
            || box.height === 0
            || style.display === 'none'
            || style.visibility === 'hidden'
          ) {
            return []
          }
          return [{
            height: box.height,
            label: element.getAttribute('aria-label') || element.textContent?.trim().replace(/\s+/g, ' '),
            tag: element.tagName.toLowerCase(),
            width: box.width
          }]
        })
      ))

      expect(targets.length, `${width}px ${state} exposed no interactive targets`).toBeGreaterThan(0)
      for (const target of targets) {
        expect.soft(
          hasRobustInteractiveTargetGeometry(target),
          `${width}px ${state} ${target.tag} “${target.label}” target was ${target.width}×${target.height}`
        ).toBe(true)
      }
    }

    await expectVisibleTargetsHaveRobustGeometry('closed navigation')

    const menuButton = page.locator('button[aria-controls="primary-navigation"]')
    await menuButton.click()
    await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible()
    await expectVisibleTargetsHaveRobustGeometry('open navigation')
    await menuButton.click()
  }
  expectCleanBrowser()
})

test('hover and keyboard focus remain visible across light, dark, and green surfaces', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await waitForPortfolioToSettle(page)

  const controls = [
    page.getByRole('link', { name: 'Explore selected work' }),
    page.getByRole('link', { name: 'Try Trail Pulse' }),
    page.locator('#contact').getByRole('link', { name: 'LinkedIn', exact: true }),
    page.locator('#contact').getByRole('link', {
      name: 'Email Rohan at misrarohan619@gmail.com',
      exact: true
    }),
    page.getByRole('region', { name: 'Selected work' })
      .getByRole('button', { name: 'Open case study: Omnichannel payments strategy' })
  ]

  for (const control of controls) {
    await control.scrollIntoViewIfNeeded()
    await control.focus()
    const focusStyle = await control.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth)
      }
    })
    expect(focusStyle.outlineStyle).not.toBe('none')
    expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(3)
  }

  const primaryAction = controls[0]
  const primaryBefore = await primaryAction.evaluate((element) => getComputedStyle(element).transform)
  await primaryAction.hover()
  await primaryAction.evaluate(async (element) => {
    await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished))
  })
  expect(await primaryAction.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(primaryBefore)

  const builderArrow = page.getByRole('link', { name: 'Try Trail Pulse' }).locator('span')
  const builderArrowBefore = await builderArrow.evaluate((element) => getComputedStyle(element).transform)
  await page.getByRole('link', { name: 'Try Trail Pulse' }).hover()
  await builderArrow.evaluate(async (element) => {
    await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished))
  })
  expect(await builderArrow.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(builderArrowBefore)

  const emailAction = controls[3]
  const emailBefore = await emailAction.evaluate((element) => ({
    transform: getComputedStyle(element).transform,
    shadow: getComputedStyle(element).boxShadow
  }))
  await emailAction.hover()
  await emailAction.evaluate(async (element) => {
    await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished))
  })
  const emailAfter = await emailAction.evaluate((element) => ({
    transform: getComputedStyle(element).transform,
    shadow: getComputedStyle(element).boxShadow
  }))
  expect(emailAfter.transform).not.toBe(emailBefore.transform)
  expect(emailAfter.shadow).not.toBe(emailBefore.shadow)
  expectCleanBrowser()
})
