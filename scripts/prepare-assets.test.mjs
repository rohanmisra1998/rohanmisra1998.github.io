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

  await assert.rejects(
    () => access(path.join(outputDirectory, 'rohan-launcher.png')),
    { code: 'ENOENT' },
    'The asset pipeline must not create a second assistant-only portrait request.'
  )

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

test('the social-card systems curve stays out of the protected title and subtitle zone', async () => {
  const protectedZoneHeight = 260
  const { data, info } = await sharp(Buffer.from(await createOgSvg()))
    .extract({ left: 0, top: 0, width: 1200, height: protectedZoneHeight })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let blueCurvePixels = 0
  for (let offset = 0; offset < data.length; offset += info.channels) {
    if (data[offset] === 76 && data[offset + 1] === 111 && data[offset + 2] === 255) {
      blueCurvePixels += 1
    }
  }

  assert.equal(
    blueCurvePixels,
    0,
    'The blue systems curve must remain entirely below the 260px text clear zone.'
  )
})
