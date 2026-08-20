import { mkdir, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'
import sharp from 'sharp'

const projectDirectory = path.resolve(process.cwd())
const sourceDirectory = path.join(projectDirectory, 'assets/source')
const ogTextPathsFile = path.join(projectDirectory, 'assets/fonts/dm-sans-og-paths.json.gz')

const sources = {
  portrait: path.join(sourceDirectory, 'rohan-portrait.png'),
  trailPulseResults: path.join(sourceDirectory, 'trail-pulse-results.png'),
  trailPulseMobile: path.join(sourceDirectory, 'trail-pulse-mobile.png'),
}

const createPipeline = (source) => sharp(source).rotate().toColorspace('srgb')

let ogTextPaths

async function loadOgTextPaths() {
  if (!ogTextPaths) {
    const compressedPaths = await readFile(ogTextPathsFile)
    ogTextPaths = JSON.parse(gunzipSync(compressedPaths).toString('utf8').replace(/^\uFEFF/, ''))
  }

  return ogTextPaths
}

export async function createOgSvg() {
  const textPaths = await loadOgTextPaths()

  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0B1F33"/>
  <path d="M-24 474C136 344 242 540 404 418S679 170 856 282 1046 430 1224 136" fill="none" stroke="#4C6FFF" stroke-width="12" stroke-linecap="round"/>
  <circle cx="404" cy="418" r="14" fill="#FFB000"/>
  <circle cx="856" cy="282" r="14" fill="#FFB000"/>
  <path d="${textPaths.title}" fill="#F6F7F2"/>
  <path d="${textPaths.subtitle}" fill="#DDE5E8"/>
</svg>`
}

async function writePortrait(outputDirectory) {
  const resizeOptions = {
    width: 920,
    height: 1150,
    fit: 'cover',
    position: 'attention',
  }

  await Promise.all([
    createPipeline(sources.portrait).resize(resizeOptions).avif({ quality: 62 }).toFile(path.join(outputDirectory, 'rohan-portrait.avif')),
    createPipeline(sources.portrait).resize(resizeOptions).webp({ quality: 82 }).toFile(path.join(outputDirectory, 'rohan-portrait.webp')),
    createPipeline(sources.portrait).resize(resizeOptions).png({ compressionLevel: 9 }).toFile(path.join(outputDirectory, 'rohan-portrait.png')),
  ])
}

async function writeScreenshots(outputDirectory) {
  await Promise.all([
    createPipeline(sources.trailPulseResults)
      .resize({ width: 1440, withoutEnlargement: true })
      .avif({ quality: 62 })
      .toFile(path.join(outputDirectory, 'trail-pulse-results.avif')),
    createPipeline(sources.trailPulseResults)
      .resize({ width: 1440, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(outputDirectory, 'trail-pulse-results.webp')),
    createPipeline(sources.trailPulseMobile)
      .resize({ width: 390, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(outputDirectory, 'trail-pulse-mobile.webp')),
  ])
}

async function writeSocialImage(outputDirectory) {
  await sharp(Buffer.from(await createOgSvg())).png({ compressionLevel: 9 }).toFile(path.join(outputDirectory, 'og-rohan-misra.png'))
}

export async function prepareAssets(outputDirectory = 'public/images') {
  const resolvedOutputDirectory = path.resolve(outputDirectory)
  await mkdir(resolvedOutputDirectory, { recursive: true })

  await Promise.all([
    writePortrait(resolvedOutputDirectory),
    writeScreenshots(resolvedOutputDirectory),
    writeSocialImage(resolvedOutputDirectory),
  ])
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await prepareAssets()
}
