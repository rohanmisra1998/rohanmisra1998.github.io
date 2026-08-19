import { expect, test } from '@playwright/test'

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
  await expect(page.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
    'aria-expanded',
    'false'
  )
})
