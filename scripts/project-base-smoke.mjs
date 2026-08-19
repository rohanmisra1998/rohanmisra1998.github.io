import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { chromium } from '@playwright/test'

const projectBase = '/rohan-portfolio/'
const previewUrl = `http://127.0.0.1:43918${projectBase}`
const projectEnvironment = {
  ...process.env,
  GITHUB_ACTIONS: 'true',
  GITHUB_REPOSITORY: 'smoke/rohan-portfolio'
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited ${code}`))
    })
  })
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(previewUrl)
      if (response.ok) return
    } catch {
      // The preview process may still be binding its socket.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Preview did not become ready at ${previewUrl}`)
}

await run(process.execPath, ['scripts/prepare-assets.mjs'])
await run(process.execPath, ['node_modules/typescript/bin/tsc', '-b'])
await run(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
  env: projectEnvironment
})

const preview = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '43918', '--strictPort'],
  { env: projectEnvironment, stdio: 'inherit' }
)

let browser
try {
  await waitForPreview()
  browser = await chromium.launch()
  const page = await browser.newPage()
  const imageRequests = []
  const failedResponses = []

  page.on('request', (request) => {
    if (request.resourceType() === 'image') imageRequests.push(new URL(request.url()).pathname)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`)
  })

  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  assert.equal(page.url(), previewUrl)
  assert.equal(failedResponses.length, 0, failedResponses.join('\n'))
  assert.ok(imageRequests.length > 0, 'Expected the built page to request its portrait')
  assert.ok(
    imageRequests.every((pathname) => pathname.startsWith(`${projectBase}images/`)),
    `Image requests escaped the project base: ${imageRequests.join(', ')}`
  )
  await page.locator('.hero__portrait img').evaluate((image) => image.decode())
  assert.ok(
    await page.locator('.hero__portrait img').evaluate((image) => image.naturalWidth > 0),
    'The base-aware portrait did not decode'
  )
  console.log(`Project-base smoke passed: ${imageRequests.join(', ')}`)
} finally {
  await browser?.close()
  preview.kill()
}
