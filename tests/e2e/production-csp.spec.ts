import { createHash } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'

interface CapturedViolation {
  blockedURI: string
  effectiveDirective: string
  originalPolicy: string
  violatedDirective: string
}

async function installViolationCapture(page: Page) {
  await page.addInitScript(() => {
    const state = window as Window & { capturedCspViolations?: CapturedViolation[] }
    state.capturedCspViolations = []
    document.addEventListener('securitypolicyviolation', (event) => {
      state.capturedCspViolations!.push({
        blockedURI: event.blockedURI,
        effectiveDirective: event.effectiveDirective,
        originalPolicy: event.originalPolicy,
        violatedDirective: event.violatedDirective
      })
    })
  })
}

async function capturedViolations(page: Page): Promise<CapturedViolation[]> {
  return page.evaluate(() => (
    (window as Window & { capturedCspViolations?: CapturedViolation[] })
      .capturedCspViolations ?? []
  ))
}

test('secured production page accepts hashed inline scripts and loads self-hosted modules, styles, and images cleanly', async ({ page }) => {
  const browserMessages: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      browserMessages.push(`console.${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => browserMessages.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`)
  })
  await installViolationCapture(page)

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('messy operations')
  await expect(page.locator('.ask-rohan-launcher__button')).toBeVisible()

  const artifact = await page.evaluate(async () => {
    await document.fonts.ready
    const policy = document.querySelector<HTMLMetaElement>(
      'meta[http-equiv="Content-Security-Policy"]'
    )?.content ?? ''
    const themeBootstrap = document.querySelector<HTMLScriptElement>('script[data-theme-bootstrap]')
    const module = document.querySelector<HTMLScriptElement>('script[type="module"][src]')
    const styles = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
    const portrait = document.querySelector<HTMLImageElement>('.hero__portrait img')
    return {
      module: module ? {
        path: new URL(module.src).pathname,
        sameOrigin: new URL(module.src).origin === location.origin
      } : null,
      policy,
      portrait: portrait ? {
        complete: portrait.complete,
        naturalHeight: portrait.naturalHeight,
        naturalWidth: portrait.naturalWidth,
        path: new URL(portrait.currentSrc).pathname
      } : null,
      styles: styles.map((style) => ({
        path: new URL(style.href).pathname,
        rules: [...document.styleSheets].find((sheet) => sheet.href === style.href)?.cssRules.length ?? 0,
        sameOrigin: new URL(style.href).origin === location.origin
      })),
      themeBootstrap: themeBootstrap?.textContent ?? '',
      theme: document.documentElement.dataset.theme
    }
  })

  expect(artifact.policy).toContain("connect-src 'none'")
  expect(artifact.policy).toContain("script-src 'self'")
  expect(artifact.policy).toContain("style-src 'self'")
  expect(artifact.policy).toContain("img-src 'self' data:")
  const allowedHashes = new Set(
    [...artifact.policy.matchAll(/'sha256-([A-Za-z0-9+/=]+)'/g)].map((match) => match[1])
  )
  const themeHash = createHash('sha256').update(artifact.themeBootstrap).digest('base64')
  expect(allowedHashes.size).toBe(2)
  expect(allowedHashes.has(themeHash)).toBe(true)

  expect(artifact.theme).toMatch(/light|dark/)
  expect(artifact.module).toMatchObject({ sameOrigin: true })
  expect(artifact.module?.path).toMatch(/^\/assets\/index-[A-Za-z0-9_-]+\.js$/)
  expect(artifact.styles.length).toBeGreaterThan(0)
  expect(artifact.styles.every(({ rules, sameOrigin }) => sameOrigin && rules > 0)).toBe(true)
  expect(artifact.portrait).toMatchObject({ complete: true })
  expect(artifact.portrait?.naturalWidth).toBeGreaterThan(0)
  expect(artifact.portrait?.naturalHeight).toBeGreaterThan(0)
  expect(artifact.portrait?.path).toMatch(/\/images\/rohan-portrait\.webp$/)
  expect(await capturedViolations(page)).toEqual([])
  expect(failedRequests).toEqual([])
  expect(browserMessages).toEqual([])
})

test('secured production connect-src none blocks a same-origin fetch before it reaches the server', async ({ page }) => {
  await installViolationCapture(page)
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(await capturedViolations(page)).toEqual([])

  let probeReachedNetwork = false
  await page.route('**/csp-connect-probe', async (route) => {
    probeReachedNetwork = true
    await route.fulfill({ status: 200, body: 'CSP was not enforced' })
  })
  const probe = await page.evaluate(async () => {
    try {
      const response = await fetch('/csp-connect-probe', { cache: 'no-store' })
      return { blocked: false, status: response.status }
    } catch (error) {
      return {
        blocked: true,
        message: error instanceof Error ? error.message : String(error)
      }
    }
  })

  expect(probe).toMatchObject({ blocked: true })
  expect(probeReachedNetwork).toBe(false)
  await expect.poll(async () => (await capturedViolations(page)).length).toBe(1)
  const violations = await capturedViolations(page)
  expect(violations).toHaveLength(1)
  expect(violations[0]).toMatchObject({
    effectiveDirective: 'connect-src',
    violatedDirective: 'connect-src'
  })
  expect(violations[0].blockedURI).toContain('/csp-connect-probe')
  expect(violations[0].originalPolicy).toContain("connect-src 'none'")
})
