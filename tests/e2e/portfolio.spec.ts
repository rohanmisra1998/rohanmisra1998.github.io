import { expect, test } from '@playwright/test'

test('first viewport communicates the operator-builder thesis', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('messy operations')
  await expect(page.getByText('Tech-first operator')).toBeVisible()
  await expect(page.getByRole('link', { name: 'See what I’m building' })).toBeVisible()
})
