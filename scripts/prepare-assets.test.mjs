import assert from 'node:assert/strict'
import { access, mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import sharp from 'sharp'

import { prepareAssets } from './prepare-assets.mjs'

const expectedAssets = [
  'rohan-portrait.avif',
  'rohan-portrait.webp',
  'rohan-portrait.png',
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

  const socialImage = await sharp(path.join(outputDirectory, 'og-rohan-misra.png')).metadata()
  assert.equal(socialImage.width, 1200)
  assert.equal(socialImage.height, 630)
})
