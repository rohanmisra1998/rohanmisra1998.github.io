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
  await expect(heading).toContainText('intersection of marketplaces, product, and AI')
  for (const [label, locator] of [
    ['operator thesis', heading],
    ['proof strip', page.getByText('Senior Manager @ eBay · ex-Bain · 5 accelerated promotions · ~$250M in delivered value · Kellogg MBA')],
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
  await expect(page.getByRole('dialog', { name: 'B2B SaaS & logistics investment diligence' })).toBeVisible()
  await page.getByRole('button', { name: 'Close case study' }).click()
  await expect(page).toHaveURL('/')
  await page.getByRole('button', { name: /Open case study: Utilities/i }).click()
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL('/')
})

test('selected work exposes seven grounded cases and Personal projects in three groups', async ({ page }) => {
  await page.goto('/')
  const selectedWork = page.getByRole('region', { name: 'Selected work' })
  const initialCards = selectedWork.getByRole('article')

  await expect(initialCards).toHaveCount(9)
  await expect(initialCards.nth(0)).toHaveAccessibleName(
    "Drove verticalization of eBay's parts buyer experience"
  )
  await expect(initialCards.nth(8)).toHaveAccessibleName('Trail Pulse')
  await expect(selectedWork.getByRole('group', { name: 'Tech × AI × Growth' })).toBeVisible()
  await expect(selectedWork.getByRole('group', {
    name: 'Operations × Large-scale transformations'
  })).toBeVisible()
  await expect(selectedWork.getByRole('group', { name: 'Personal projects' })).toBeVisible()
  await expect(selectedWork.getByText('eBay · Global marketplace')).toBeVisible()
  await expect(selectedWork.getByText('~$XXM incremental GMV opportunity.')).toBeVisible()
  await expect(selectedWork.getByText("Fintech · India's largest payments platform")).toBeVisible()
  await expect(selectedWork.getByText('$150M+ realized GMV uplift.')).toBeVisible()
  await expect(selectedWork.getByText('~15,000 recruiting hours saved annually.')).toBeVisible()
  await expect(selectedWork.locator('.case-card__impact-type')).toHaveCount(7)
  await expect(selectedWork.locator('.case-card__disclosure')).toHaveCount(0)
  await expect(selectedWork).not.toContainText(/target identities|transaction detail is disclosed/i)
  await expect(selectedWork.getByRole('button', { name: 'See all work' })).toHaveCount(0)
  await expect(selectedWork.getByRole('article', { name: 'Trail Pulse' })).toBeVisible()

  await selectedWork.getByRole('button', { name: 'Open case study: B2B SaaS & logistics investment diligence' })
    .click()
  const diligenceDialog = page.getByRole('dialog', { name: 'B2B SaaS & logistics investment diligence' })
  await expect(diligenceDialog.getByText('Private equity · B2B SaaS and logistics')).toBeVisible()
  await expect(diligenceDialog.getByRole('region', { name: 'My role' })).toContainText(
    'Commercial diligence workstream lead'
  )
  await expect(diligenceDialog.getByRole('region', { name: 'Key decision' })).toBeVisible()
  await expect(diligenceDialog.getByText('X buy-side investment theses informed.')).toBeVisible()
  await expect(diligenceDialog.locator('[data-artifact-kind]')).toHaveCount(0)
  await expect(diligenceDialog.locator('figure')).toHaveCount(0)
  await expect(diligenceDialog.getByText('Evidence', { exact: true })).toHaveCount(0)
  await expect(diligenceDialog.locator('.case-dialog__disclosure')).toHaveCount(0)
  await expect(diligenceDialog).not.toContainText(/target identities|transaction detail is disclosed/i)
})

test('Trail Pulse remains an honest Personal project rather than professional work', async ({ page }) => {
  await page.goto('/')
  const selectedWork = page.getByRole('region', { name: 'Selected work' })
  const personalProjects = selectedWork.getByRole('group', { name: 'Personal projects' })
  const builderTrailPulse = personalProjects.getByRole('article', { name: 'Trail Pulse' })
  await expect(builderTrailPulse.getByText(
    'An early AI-assisted prototype built end-to-end to learn modern product development and demonstrate technical agency.',
    { exact: true }
  )).toBeVisible()
  await expect(builderTrailPulse.getByRole('link', { name: 'Try Trail Pulse' })).toHaveAttribute(
    'href', 'https://trail-pulse-alpha.vercel.app/'
  )
})

test('each professional case uses a distinct, case-specific geometric system', async ({ page }) => {
  await page.goto('/')
  const systems = await page.locator('.case-card__visual').evaluateAll((visuals) => (
    visuals.map((visual) => ({
      slug: (visual as HTMLElement).dataset.visualVariant,
      system: getComputedStyle(visual).getPropertyValue('--visual-system').trim(),
      parts: Array.from(visual.querySelectorAll('[data-shape-role]'))
        .map((part) => (part as HTMLElement).dataset.shapeRole)
    }))
  ))

  expect(systems).toEqual([
    {
      slug: 'end-to-end-parts-buyer-experience', system: 'fitment-journey',
      parts: ['buyer-query', 'compatibility-gate', 'complete-the-job']
    },
    {
      slug: 'omnichannel-payments-strategy', system: 'payment-rails',
      parts: ['online-channel', 'payment-hub', 'pos-channel']
    },
    {
      slug: 'buy-side-commercial-diligence', system: 'diligence-filter',
      parts: ['market-evidence', 'investment-filter', 'risk-evidence']
    },
    {
      slug: 'talent-acquisition-operating-model', system: 'ai-recruiting-flow',
      parts: ['candidate-flow', 'ai-orchestration', 'capacity-release']
    },
    {
      slug: 'workforce-operations-transformation', system: 'crew-schedule',
      parts: ['crew-one', 'crew-two', 'crew-three']
    },
    {
      slug: 'performance-and-value-realization-program', system: 'regional-value-network',
      parts: ['region-network', 'value-hub', 'savings-path']
    },
    {
      slug: 'pharma-life-sciences-growth-transformation', system: 'pharma-distribution',
      parts: ['therapy-product', 'distribution-hub', 'expansion-network']
    }
  ])
  expect(new Set(systems.map(({ system }) => system))).toHaveProperty('size', 7)
})

test('adjacent narrative sections keep a deliberate compact rhythm', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const gaps = await page.locator('main').evaluate((main) => {
    const ids = ['profile', 'work', 'experience', 'education', 'writing', 'outside-work', 'contact']
    return ids.slice(0, -1).map((id, index) => {
      const current = main.querySelector<HTMLElement>(`#${id}`)!
      const next = main.querySelector<HTMLElement>(`#${ids[index + 1]}`)!
      const currentContentBottom = Math.max(
        ...Array.from(current.children).map((child) => child.getBoundingClientRect().bottom)
      )
      const nextContentTop = Math.min(
        ...Array.from(next.children).map((child) => child.getBoundingClientRect().top)
      )
      return { from: id, to: ids[index + 1], gap: nextContentTop - currentContentBottom }
    })
  })

  for (const { from, to, gap } of gaps) {
    expect(gap, `${from} → ${to} has an oversized whitespace gap`).toBeLessThanOrEqual(144)
  }
})

test('the promotions proof metric stays on one line without overflowing', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 900 },
    { width: 768, height: 900 }
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.getByRole('button', { name: 'Read more about me' }).click()

    const metric = page.locator('.profile__proof strong').first()
    const geometry = await metric.evaluate((element) => {
      const box = element.getBoundingClientRect()
      const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight)
      return {
        height: box.height,
        lineHeight,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth
      }
    })

    expect(
      geometry.height,
      `${viewport.width}px promotions metric wrapped onto multiple lines`
    ).toBeLessThanOrEqual(geometry.lineHeight + 1)
    expect(
      geometry.scrollWidth,
      `${viewport.width}px promotions metric overflowed its proof column`
    ).toBeLessThanOrEqual(geometry.clientWidth + 1)
  }
})

test('portrait omits the decorative signal dot', async ({ page }) => {
  await page.goto('/')
  const signalContent = await page.locator('.hero__portrait').evaluate((portrait) => (
    getComputedStyle(portrait, '::after').content
  ))

  expect(signalContent).toBe('none')
})

test('all case studies reveal classified impact before scrolling and expose ownership and judgment without reconstructed artifacts', async ({ page }) => {
  const cases = [
    [
      'end-to-end-parts-buyer-experience',
      "Drove verticalization of eBay's parts buyer experience"
    ],
    ['omnichannel-payments-strategy', 'Omnichannel payments growth strategy'],
    ['buy-side-commercial-diligence', 'B2B SaaS & logistics investment diligence'],
    ['talent-acquisition-operating-model', 'AI-led talent acquisition transformation'],
    ['workforce-operations-transformation', 'Utilities field-operations transformation'],
    ['performance-and-value-realization-program', 'Automotive supply-chain transformation'],
    ['pharma-life-sciences-growth-transformation', 'Pharma distribution & life-sciences growth']
  ] as const

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport)
    for (const [slug, title] of cases) {
      await page.goto(`/?case=${slug}`)
      const dialog = page.getByRole('dialog', { name: title })
      const outcome = dialog.locator('.case-dialog__outcome')
      const box = await outcome.boundingBox()
      expect(box, `${viewport.width}px ${title} impact has no rendered box`).not.toBeNull()
      expect(box!.y, `${viewport.width}px ${title} impact starts above the viewport`)
        .toBeGreaterThanOrEqual(0)
      expect(
        box!.y + box!.height,
        `${viewport.width}px ${title} impact is not fully visible when the case opens`
      ).toBeLessThanOrEqual(viewport.height)
      await expect(dialog.getByRole('region', { name: 'My role' })).toBeVisible()
      if (slug === 'end-to-end-parts-buyer-experience') {
        await expect(dialog.getByRole('region', { name: 'Key decision' })).toHaveCount(0)
      } else {
        await expect(dialog.getByRole('region', { name: 'Key decision' })).toBeAttached()
      }
      await expect(dialog.locator('[data-artifact-kind]')).toHaveCount(0)
      await expect(dialog.locator('figure')).toHaveCount(0)
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    }
  }
})

test('the two approved proof points fill the profile evenly', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Read more about me' }).click()

  const proof = page.getByRole('list', { name: 'Career highlights' })
  const items = proof.getByRole('listitem')
  await expect(items).toHaveCount(2)
  const [proofBox, itemBoxes] = await Promise.all([
    proof.boundingBox(),
    items.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
  ])
  expect(proofBox).not.toBeNull()
  expect(itemBoxes[0]).toBeCloseTo(itemBoxes[1], 0)
  expect(itemBoxes[0] + itemBoxes[1]).toBeCloseTo(proofBox!.width, 0)
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
  const email = contact.getByRole('link', {
    name: 'Email Rohan at misrarohan619@gmail.com',
    exact: true
  })
  await expect(email).toHaveAttribute('href', 'mailto:misrarohan619@gmail.com')
  await expect(email).not.toHaveAttribute('target')
  await expect(contact).not.toContainText(/CV/i)
})

test('portrait caption stays inside one opaque high-contrast band at every supported width', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 320, height: 720 }
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await settleHero(page)

    const result = await page.locator('.hero__portrait-caption').evaluate((caption) => {
      const captionBox = caption.getBoundingClientRect()
      const range = document.createRange()
      range.selectNodeContents(caption)
      const textBox = range.getBoundingClientRect()
      const style = getComputedStyle(caption)
      const pictureBox = caption.previousElementSibling?.getBoundingClientRect()
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        color: style.color,
        caption: { top: captionBox.top, right: captionBox.right, bottom: captionBox.bottom, left: captionBox.left },
        pictureBottom: pictureBox?.bottom,
        text: { top: textBox.top, right: textBox.right, bottom: textBox.bottom, left: textBox.left }
      }
    })

    expect(result.backgroundColor).toMatch(/^rgb\(/)
    expect(result.backgroundImage).toBe('none')
    expect(contrastRatio(result.color, result.backgroundColor)).toBeGreaterThanOrEqual(4.5)
    expect(result.caption.top).toBeGreaterThanOrEqual(result.pictureBottom ?? 0)
    expect(result.text.top).toBeGreaterThanOrEqual(result.caption.top)
    expect(result.text.left).toBeGreaterThanOrEqual(result.caption.left)
    expect(result.text.right).toBeLessThanOrEqual(result.caption.right)
    expect(result.text.bottom).toBeLessThanOrEqual(result.caption.bottom)
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(viewport.width)
  }
})

test('fine-pointer portrait hover comes alive without changing document layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop fine-pointer interaction')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await settleHero(page)

  const portrait = page.locator('.hero__portrait')
  const card = portrait.locator('.hero__portrait-card')
  const before = await portrait.evaluate((figure) => {
    const card = figure.querySelector<HTMLElement>('.hero__portrait-card')!
    const frame = getComputedStyle(figure, '::before')
    return {
      layout: {
        height: card.offsetHeight,
        width: card.offsetWidth,
        nextOffset: (figure.closest('section')?.nextElementSibling as HTMLElement | null)?.offsetTop
      },
      cardTransform: getComputedStyle(card).transform,
      cardShadow: getComputedStyle(card).boxShadow,
      frameTransform: frame.transform
    }
  })

  await portrait.hover()
  await card.evaluate(async (element) => {
    await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished))
  })

  const after = await portrait.evaluate((figure) => {
    const card = figure.querySelector<HTMLElement>('.hero__portrait-card')!
    const frame = getComputedStyle(figure, '::before')
    return {
      layout: {
        height: card.offsetHeight,
        width: card.offsetWidth,
        nextOffset: (figure.closest('section')?.nextElementSibling as HTMLElement | null)?.offsetTop
      },
      cardTransform: getComputedStyle(card).transform,
      cardShadow: getComputedStyle(card).boxShadow,
      frameTransform: frame.transform
    }
  })

  expect(after.layout).toEqual(before.layout)
  expect(after.cardTransform).not.toBe('none')
  expect(after.cardShadow).not.toBe(before.cardShadow)
  expect(after.frameTransform).not.toBe(before.frameTransform)
})

test('social preview metadata declares the reviewed 1200 by 630 image', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://rohanmisra1998.github.io/images/og-rohan-misra.png'
  )
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200')
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630')
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    'content',
    'Rohan Misra — Tech-first operator · Strategy to systems'
  )
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    'https://rohanmisra1998.github.io/images/og-rohan-misra.png'
  )
})

test('email action is keyboard reachable, exact, and leaves no CV control or copy', async ({ page }) => {
  await page.goto('/')
  const contact = page.getByRole('region', { name: 'Let’s talk.' })
  const linkedin = contact.getByRole('link', { name: 'LinkedIn', exact: true })
  const email = contact.getByRole('link', {
    name: 'Email Rohan at misrarohan619@gmail.com',
    exact: true
  })

  await linkedin.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(email).toBeFocused()
  await expect(email).toHaveAttribute('href', 'mailto:misrarohan619@gmail.com')
  await expect(page.getByText(/CV · updating/i)).toHaveCount(0)
  await expect(page.locator('a, button, [aria-disabled="true"]').filter({ hasText: /\bCV\b/i }))
    .toHaveCount(0)
})

test('email action has a visible fine-pointer hover response without layout shift', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop fine-pointer interaction')
  await page.goto('/')
  const email = page.getByRole('link', {
    name: 'Email Rohan at misrarohan619@gmail.com',
    exact: true
  })
  await email.scrollIntoViewIfNeeded()

  const before = await email.evaluate((element) => {
    const style = getComputedStyle(element)
    const htmlElement = element as HTMLElement
    return {
      layout: [htmlElement.offsetLeft, htmlElement.offsetTop, htmlElement.offsetWidth, htmlElement.offsetHeight],
      transform: style.transform,
      shadow: style.boxShadow,
      background: style.backgroundColor
    }
  })
  await email.hover()
  await settleAnimations(email)
  const after = await email.evaluate((element) => {
    const style = getComputedStyle(element)
    const htmlElement = element as HTMLElement
    return {
      layout: [htmlElement.offsetLeft, htmlElement.offsetTop, htmlElement.offsetWidth, htmlElement.offsetHeight],
      transform: style.transform,
      shadow: style.boxShadow,
      background: style.backgroundColor
    }
  })

  expect(after.layout).toEqual(before.layout)
  expect(after.transform).not.toBe(before.transform)
  expect(after.shadow).not.toBe(before.shadow)
  expect(after.background).not.toBe(before.background)
  const hoverScreenshotPath = testInfo.outputPath('email-hover.png')
  await page.screenshot({ path: hoverScreenshotPath })
  await testInfo.attach('email-hover', { path: hoverScreenshotPath, contentType: 'image/png' })
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
  const trigger = selectedWork.getByRole('button', { name: 'Open case study: Omnichannel payments growth strategy' })
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: 'Omnichannel payments growth strategy' })
  const heading = dialog.getByRole('heading', { level: 2, name: 'Omnichannel payments growth strategy' })
  const close = dialog.getByRole('button', { name: 'Close case study' })
  const assistantAction = dialog.getByRole('button', { name: 'Ask Rohan AI about this work' })
  await expect(heading).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(assistantAction).toBeFocused()

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
  const dialog = page.getByRole('dialog', { name: 'B2B SaaS & logistics investment diligence' })
  const title = dialog.getByRole('heading', { level: 2, name: 'B2B SaaS & logistics investment diligence' })
  await expect(title).toBeFocused()
  const order = await dialog.locator('.case-dialog__rail > h2, .case-dialog__rail > .case-dialog__industry')
    .evaluateAll((elements) => elements.map((element) => element.textContent?.trim()))
  expect(order).toEqual([
    'B2B SaaS & logistics investment diligence',
    'Private equity · B2B SaaS and logistics'
  ])
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

test('desktop case titles do not split words across lines', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'One desktop typography contract')

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/?case=omnichannel-payments-strategy')
  const title = page.getByRole('dialog', { name: 'Omnichannel payments growth strategy' })
    .getByRole('heading', { level: 2, name: 'Omnichannel payments growth strategy' })

  const firstWordLineCount = await title.evaluate((element) => {
    const textNode = element.firstChild
    if (!(textNode instanceof Text)) throw new Error('Case title must start with a text node')
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 'Omnichannel'.length)
    return range.getClientRects().length
  })

  expect(firstWordLineCount, 'Omnichannel split inside the word').toBe(1)
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
    await selectedWork.getByRole('button', { name: 'Open case study: Omnichannel payments growth strategy' }).click()
    const dialog = page.getByRole('dialog', { name: 'Omnichannel payments growth strategy' })
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
    '.hero__current',
    '.selected-work__group-heading h3',
    '.case-card__outcome',
    '.case-card__capabilities li',
    '.selected-work__group-note',
    '.section-heading__note',
    '.builder-card__description',
    '.builder-card__honesty',
    '.builder-card li',
    '.experience__intro > p:last-child',
    '.experience-row__summary',
    '.education p',
    '.education__meta',
    '.writing-row__body > p',
    '.profile__story > p',
    '.contact__body > p',
    '.outside-work__heading > p:last-child',
    '.outside-work__interests li'
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
    .getByRole('button', { name: 'Open case study: Omnichannel payments growth strategy' }).click()
  for (const selector of [
    '.case-dialog__thesis',
    '.case-dialog__role dd',
    '.case-dialog__outcome h3',
    '.case-dialog__narrative h3'
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
  const portrait = page.locator('.hero__portrait')
  await portrait.hover()
  await expectNoMotionTransform(portrait, 'hero portrait')
  await expectNoMotionTransform(portrait.locator('.hero__portrait-card'), 'hero portrait card')
  await expectNoMotionTransform(portrait.locator('picture'), 'hero portrait image')
  await expectNoMotionTransform(portrait, 'hero portrait frame', '::before')
  expect(await portrait.evaluate((figure) => [
    getComputedStyle(figure.querySelector('.hero__portrait-card')!).transitionDuration,
    getComputedStyle(figure.querySelector('picture')!).transitionDuration,
    getComputedStyle(figure, '::before').transitionDuration
  ])).toEqual(['0s', '0s', '0s'])

  const firstCard = page.getByRole('region', { name: 'Selected work' }).getByRole('article').first()
  await firstCard.hover()
  await expectNoMotionTransform(firstCard, 'work card')
  await expectNoMotionTransform(firstCard.locator('.case-card__visual'), 'work-card visual', '::before')

  const email = page.getByRole('link', {
    name: 'Email Rohan at misrarohan619@gmail.com',
    exact: true
  })
  await email.hover()
  await expectNoMotionTransform(email, 'email action')

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
  await selectedWork.getByRole('button', { name: 'Open case study: Omnichannel payments growth strategy' }).click()
  const dialog = page.getByRole('dialog', { name: 'Omnichannel payments growth strategy' })
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
    name: /Open case study: AI-led talent acquisition transformation/i
  }).click()
  await expect(page.getByRole('button', { name: 'Ask Rohan AI about this work' }))
    .toHaveCount(0)
  await page.getByRole('button', { name: 'Close case study' }).click()

  await page.getByRole('button', { name: /Open case study: B2B SaaS/i }).click()
  await launcher.evaluate((button) => (button as HTMLButtonElement).click())
  await expect(page.getByRole('dialog', { name: 'B2B SaaS & logistics investment diligence' })).toHaveCount(0)
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
    'X buy-side investment theses'
  )
  await page.getByRole('button', { name: 'View supporting case' }).click()
  await expect(page.getByRole('dialog', { name: 'B2B SaaS & logistics investment diligence' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(1)

  await page.getByRole('button', { name: 'Close case study' }).click()
  const caseTrigger = page.getByRole('button', { name: /Open case study: B2B SaaS/i })
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
