import assert from 'node:assert/strict'
import { access, mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import sharp from 'sharp'

import { createOgSvg, prepareAssets } from './prepare-assets.mjs'

const expectedAssets = [
  'rohan-portrait.avif',
  'rohan-portrait.webp',
  'rohan-portrait.png',
  'rohan-launcher.png',
  'trail-pulse-results.avif',
  'trail-pulse-results.webp',
  'trail-pulse-mobile.webp',
  'og-rohan-misra.png',
]

test('prepareAssets creates the required portfolio image set', async (t) => {
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), 'rohan-assets-'))
  t.after(() => rm(outputDirectory, { recursive: true, force: true }))

  await prepareAssets(outputDirectory)

  for (const asset of expectedAssets) {
    await assert.doesNotReject(() => access(path.join(outputDirectory, asset)))
  }

  const portrait = await sharp(path.join(outputDirectory, 'rohan-portrait.png')).metadata()
  assert.equal(portrait.width, 920)
  assert.equal(portrait.height, 1150)

  const launcherPath = path.join(outputDirectory, 'rohan-launcher.png')
  const launcher = await sharp(launcherPath).metadata()
  assert.equal(launcher.width, 48)
  assert.equal(launcher.height, 48)
  assert.equal(launcher.hasAlpha, true)

  const { data: launcherPixels, info: launcherInfo } = await sharp(launcherPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const alphaAt = (x, y) => launcherPixels[(y * launcherInfo.width + x) * launcherInfo.channels + 3]
  assert.equal(alphaAt(0, 0), 0)
  assert.equal(alphaAt(24, 24), 255)

  const socialImage = await sharp(path.join(outputDirectory, 'og-rohan-misra.png')).metadata()
  assert.equal(socialImage.width, 1200)
  assert.equal(socialImage.height, 630)
})

test('the social-card SVG uses deterministic paths instead of host fonts', async () => {
  const ogSvg = await createOgSvg()

  assert.doesNotMatch(ogSvg, /<text\b/i)
  assert.doesNotMatch(ogSvg, /font-family/i)
  assert.match(ogSvg, /<path d="M/i)
})
