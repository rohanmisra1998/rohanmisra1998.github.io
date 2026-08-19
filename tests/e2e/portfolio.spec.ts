import { expect, test } from '@playwright/test'

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

test('first viewport communicates the operator-builder thesis', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('messy operations')
  await expect(page.getByText('Tech-first operator')).toBeVisible()
  await expect(page.getByRole('link', { name: 'See what I’m building' })).toBeVisible()
})

test('mobile navigation disclosure exposes and closes the primary navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'Mobile-only disclosure behavior')

  await page.goto('/')
  const button = page.locator('button[aria-controls="primary-navigation"]')
  const navigation = page.locator('nav[aria-label="Primary"]')

  await expect(button).toHaveAccessibleName('Open navigation')
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await expect(navigation).toBeHidden()
  await button.click()
  await expect(button).toHaveAccessibleName('Close navigation')
  await expect(button).toHaveAttribute('aria-expanded', 'true')
  await expect(navigation).toBeVisible()
  await navigation.getByRole('link', { name: 'Work' }).click()
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await expect(navigation).toBeHidden()
})

test('desktop navigation stays exposed', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop-only navigation behavior')

  await page.goto('/')
  await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible()
  await expect(page.locator('button[aria-controls="primary-navigation"]')).toBeHidden()
})

test('tablet navigation switches to disclosure before links crowd', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'One viewport-independent tablet check')

  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Open navigation' })
  const navigation = page.locator('nav[aria-label="Primary"]')
  await expect(button).toBeVisible()
  await expect(navigation).toBeHidden()
  await button.click()
  await expect(navigation).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('small text and the primary hover state meet WCAG AA contrast', async ({ page }) => {
  await page.goto('/')

  for (const selector of ['.hero__eyebrow', '.hero__scope dt', '.hero__portrait figcaption span:last-child']) {
    const colors = await page.locator(selector).first().evaluate((element) => ({
      foreground: getComputedStyle(element).color,
      background: getComputedStyle(document.body).backgroundColor
    }))
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5)
  }

  const primaryAction = page.getByRole('link', { name: /See what I’m building/ })
  await primaryAction.hover()
  await page.waitForTimeout(220)
  const hoverColors = await primaryAction.evaluate((element) => ({
    foreground: getComputedStyle(element).color,
    background: getComputedStyle(element).backgroundColor
  }))
  expect(contrastRatio(hoverColors.foreground, hoverColors.background)).toBeGreaterThanOrEqual(4.5)
})

test('Trail Pulse is a secondary Builder Lab experiment with honest detail', async ({ page }) => {
  await page.goto('/')
  const card = page.getByRole('article', { name: 'Trail Pulse' })
  await expect(card).toContainText('AI-assisted experiment')
  const details = card.locator('details')
  await expect(details).not.toHaveAttribute('open', '')
  await card.getByText('What Trail Pulse does').click()
  await expect(details).toHaveAttribute('open', '')
  await expect(card.getByText('Exact navigation')).toBeVisible()
  await expect(card.getByRole('link', { name: 'Try Trail Pulse' })).toHaveAttribute(
    'href', 'https://trail-pulse-alpha.vercel.app/'
  )

  for (const action of [
    card.getByRole('link', { name: 'Try Trail Pulse' }),
    page.getByRole('link', { name: 'Read the report' })
  ]) {
    await expect(action).toHaveAttribute('target', '_blank')
    await expect(action).toHaveAttribute('rel', /(?=.*noopener)(?=.*noreferrer)/)
  }
})

test('desktop work hierarchy keeps Trail Pulse measurably secondary', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop hierarchy measurement')

  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const primary = page.getByRole('article', { name: 'Transformation at scale' })
  const trailPulse = page.getByRole('article', { name: 'Trail Pulse' })
  const details = trailPulse.locator('details')
  await expect(details).not.toHaveAttribute('open', '')

  const cardOrder = await page.locator('.work-card').evaluateAll((cards) =>
    cards.map((card) => card.getAttribute('aria-labelledby'))
  )
  expect(cardOrder).toEqual(['transformation-at-scale-heading', 'trail-pulse-heading'])

  const primaryBox = await primary.boundingBox()
  const trailPulseBox = await trailPulse.boundingBox()
  expect(primaryBox).not.toBeNull()
  expect(trailPulseBox).not.toBeNull()
  const areaRatio = (trailPulseBox!.width * trailPulseBox!.height) /
    (primaryBox!.width * primaryBox!.height)
  expect(areaRatio).toBeLessThan(0.55)

  const [primaryHeadingSize, trailPulseHeadingSize] = await Promise.all([
    primary.locator('h3').evaluate((heading) => Number.parseFloat(getComputedStyle(heading).fontSize)),
    trailPulse.locator('h3').evaluate((heading) => Number.parseFloat(getComputedStyle(heading).fontSize))
  ])
  expect(trailPulseHeadingSize / primaryHeadingSize).toBeLessThan(0.75)
})

test('mobile Trail Pulse capability copy remains readable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'Mobile disclosure typography')

  await page.goto('/')
  const card = page.getByRole('article', { name: 'Trail Pulse' })
  await card.getByText('What Trail Pulse does').click()
  const typography = await card.locator('.builder-lab__capabilities p').first().evaluate((copy) => ({
    fontSize: Number.parseFloat(getComputedStyle(copy).fontSize),
    lineHeight: Number.parseFloat(getComputedStyle(copy).lineHeight)
  }))
  expect(typography.fontSize).toBeGreaterThanOrEqual(16)
  expect(typography.lineHeight).toBeGreaterThanOrEqual(24)
})

test('writing and contact actions are safe external links', async ({ page }) => {
  await page.goto('/')
  const article = page.getByRole('link', { name: /Financialisation of Housing/i })
  await expect(article).toHaveAttribute('target', '_blank')
  await expect(article).toHaveAttribute('rel', /noreferrer/)
  await expect(page.getByRole('link', { name: /LinkedIn/i })).toHaveAttribute(
    'href',
    /rohan-misra-mba/
  )
  await expect(page.locator('#contact').getByText('CV · updating')).toHaveAttribute(
    'aria-disabled',
    'true'
  )
})
