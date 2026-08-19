import { expect, test, type Page, type TestInfo } from '@playwright/test'

const reviewProject = 'chromium-desktop'

const viewports = [
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
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
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
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
  const [builderLab, operatingThesis] = await Promise.all([
    page.getByRole('article', { name: 'Trail Pulse' }).boundingBox(),
    page.locator('section[aria-labelledby="operating-thesis-heading"]').boundingBox()
  ])
  expect(builderLab, `${label} Builder Lab has no box`).not.toBeNull()
  expect(operatingThesis, `${label} operating thesis has no box`).not.toBeNull()

  const gap = operatingThesis!.y - (builderLab!.y + builderLab!.height)
  expect(
    gap,
    `${label} has ${Math.round(gap)}px of dead space between Builder Lab and operating thesis.`
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
    await expect(page).toHaveScreenshot(`${viewport.name}-home.png`, {
      animations: 'allow',
      caret: 'hide',
      fullPage: true,
      maxDiffPixelRatio: 0,
      maxDiffPixels: 0,
      threshold: 0
    })
    expectCleanBrowser()
  })
}

test('reduced motion keeps the first-view narrative and Proofline visible', async ({ page }, testInfo) => {
  skipOutsideReviewProject(testInfo)
  const expectCleanBrowser = captureUnexpectedBrowserMessages(page)

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await waitForPortfolioToSettle(page)

  const proofline = page.getByTestId('proofline')
  await expect(proofline).toBeVisible()
  await expect(page.locator('.hero__copy')).toBeVisible()
  await expect(page.locator('.hero__portrait')).toBeVisible()
  expect(await proofline.locator('.proofline__signal').evaluate((path) => (
    getComputedStyle(path).strokeDashoffset
  ))).toBe('0px')
  expect(await page.locator('.hero__copy').evaluate((copy) => {
    const matrix = new DOMMatrix(getComputedStyle(copy).transform)
    return { x: matrix.m41, y: matrix.m42 }
  })).toEqual({ x: 0, y: 0 })
  await expectNoHorizontalOverflow(page, 'reduced-motion desktop')
  expectCleanBrowser()
  await expect(page).toHaveScreenshot('reduced-motion-hero.png', {
    animations: 'allow',
    caret: 'hide',
    maxDiffPixelRatio: 0,
    maxDiffPixels: 0,
    threshold: 0
  })
  expectCleanBrowser()
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

    const trailPulse = page.getByRole('article', { name: 'Trail Pulse' })
    await trailPulse.locator('summary').click()
    await expect(trailPulse.locator('details')).toHaveAttribute('open', '')
    await expectNoHorizontalOverflow(page, `${width}px open Trail Pulse disclosure`)

    const bodyTextSizes = await page.locator([
      '.hero__subhead',
      "section[aria-labelledby='operating-thesis-heading'] p",
      '.operator-proof__summary',
      '.operator-proof__evidence-item p',
      '.social-proof > p',
      '.builder-lab__summary',
      '.builder-lab__honesty',
      '.builder-lab__capabilities p',
      '.section-heading__note',
      '.experience-row__detail p',
      '.writing-row__body p',
      '.about__statement',
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
    await expect(page.locator('#contact').getByText('CV · updating')).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    await expect(page.locator('#contact').getByRole('link', { name: 'LinkedIn', exact: true }))
      .toBeVisible()

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
    page.getByRole('link', { name: /See what I’m building/ }),
    page.getByRole('link', { name: 'Try Trail Pulse' }),
    page.locator('#contact').getByRole('link', { name: 'LinkedIn', exact: true }),
    page.getByRole('article', { name: 'Trail Pulse' }).locator('summary')
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
  const primaryBefore = await primaryAction.evaluate((element) => getComputedStyle(element).backgroundColor)
  await primaryAction.hover()
  await page.waitForTimeout(200)
  expect(await primaryAction.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(primaryBefore)

  const builderArrow = page.getByRole('link', { name: 'Try Trail Pulse' }).locator('span')
  const builderArrowBefore = await builderArrow.evaluate((element) => getComputedStyle(element).transform)
  await page.getByRole('link', { name: 'Try Trail Pulse' }).hover()
  await page.waitForTimeout(200)
  expect(await builderArrow.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(builderArrowBefore)
  expectCleanBrowser()
})
