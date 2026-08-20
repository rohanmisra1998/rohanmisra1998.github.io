import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import test, { afterEach } from 'node:test'
import { fileURLToPath } from 'node:url'
import { auditPaths } from './privacy-audit.mjs'

const execFileAsync = promisify(execFile)
const auditScript = fileURLToPath(new URL('./privacy-audit.mjs', import.meta.url))
const temporaryDirectories = []

async function makeFixtureDirectory() {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-privacy-audit-'))
  temporaryDirectories.push(directory)
  return directory
}

async function makeBuiltAssistantFixture({ chunkContents, mapSources, mapSourcesContent }) {
  const directory = await makeFixtureDirectory()
  const distDirectory = join(directory, 'dist')
  const assetsDirectory = join(distDirectory, 'assets')
  const manifestDirectory = join(distDirectory, '.vite')
  await mkdir(assetsDirectory, { recursive: true })
  await mkdir(manifestDirectory, { recursive: true })
  await writeFile(join(manifestDirectory, 'manifest.json'), JSON.stringify({
    'index.html': {
      file: 'assets/main.js',
      src: 'index.html',
      isEntry: true,
      dynamicImports: ['src/components/assistant/AssistantFeature.tsx']
    },
    'src/components/assistant/AssistantFeature.tsx': {
      file: 'assets/AssistantFeature-fixture.js',
      src: 'src/components/assistant/AssistantFeature.tsx',
      isDynamicEntry: true,
      css: ['assets/AssistantFeature-fixture.css']
    }
  }))
  await writeFile(join(assetsDirectory, 'main.js'), 'const app = true')
  await writeFile(
    join(assetsDirectory, 'AssistantFeature-fixture.js'),
    `${chunkContents}\n//# sourceMappingURL=AssistantFeature-fixture.js.map`
  )
  await writeFile(join(assetsDirectory, 'AssistantFeature-fixture.js.map'), JSON.stringify({
    version: 3,
    file: 'AssistantFeature-fixture.js',
    sources: mapSources,
    sourcesContent: mapSourcesContent,
    names: [],
    mappings: ''
  }))
  await writeFile(join(assetsDirectory, 'AssistantFeature-fixture.css'), '.assistant{}')
  return distDirectory
}

function hasViolation(violations, fileName, rule) {
  return violations.some(
    (violation) => violation.includes(fileName) && violation.endsWith(`:${rule}`)
  )
}

async function createLinkOrSkip(t, target, link, type) {
  try {
    await symlink(target, link, type)
    return true
  } catch (error) {
    if (['EACCES', 'EPERM', 'ENOSYS', 'UNKNOWN'].includes(error?.code)) {
      t.skip(`Symbolic-link creation is unavailable on this platform: ${error.code}`)
      return false
    }
    throw error
  }
}

function utf16BigEndian(contents) {
  const littleEndian = Buffer.from(`\uFEFF${contents}`, 'utf16le')
  for (let index = 0; index < littleEndian.length; index += 2) {
    const firstByte = littleEndian[index]
    littleEndian[index] = littleEndian[index + 1]
    littleEndian[index + 1] = firstByte
  }
  return littleEndian
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  )
})

test('accepts ordinary public copy from directory and individual-file inputs', async () => {
  const directory = await makeFixtureDirectory()
  const nestedDirectory = join(directory, 'nested')
  const publicCopy = join(nestedDirectory, 'public-copy.txt')
  await mkdir(nestedDirectory)
  await writeFile(publicCopy, 'Building useful systems from ambiguous operating problems.')

  assert.deepEqual(await auditPaths([directory]), [])
  assert.deepEqual(await auditPaths([publicCopy]), [])
})

test('rejects source filenames that disclose handoff or addendum material', async () => {
  const directory = await makeFixtureDirectory()
  await writeFile(join(directory, 'Context_Handoff.md'), 'Synthetic project notes.')
  await writeFile(join(directory, 'research-addendum.txt'), 'Synthetic supporting notes.')

  const violations = await auditPaths([directory])

  assert.equal(hasViolation(violations, 'Context_Handoff.md', 'forbidden-source-file'), true)
  assert.equal(hasViolation(violations, 'research-addendum.txt', 'forbidden-source-file'), true)
})

test('rejects each private-topic phrase in recursively scanned text', async () => {
  const directory = await makeFixtureDirectory()
  const fixtures = [
    ['immigration.txt', 'Synthetic visa status note.'],
    ['offer.md', 'Synthetic compensation package note.'],
    ['housing.json', '{"note":"Synthetic security deposit note."}'],
    ['finance.ts', 'export const note = "Synthetic family wealth note."']
  ]

  for (const [fileName, contents] of fixtures) {
    await writeFile(join(directory, fileName), contents)
  }

  const violations = await auditPaths([directory])

  for (const [fileName] of fixtures) {
    assert.equal(hasViolation(violations, fileName, 'forbidden-private-topic'), true)
  }
})

test('rejects PDFs anywhere below public even when a legacy CV bypass environment variable is present', async () => {
  const directory = await makeFixtureDirectory()
  const publicDirectory = join(directory, 'public', 'documents')
  const pdf = join(publicDirectory, 'synthetic-cv.pdf')
  await mkdir(publicDirectory, { recursive: true })
  await writeFile(pdf, 'synthetic pdf fixture')

  const previousGate = process.env.ALLOW_PUBLIC_CV
  try {
    process.env.ALLOW_PUBLIC_CV = 'true'
    const blocked = await auditPaths([join(directory, 'public')])
    assert.equal(hasViolation(blocked, 'synthetic-cv.pdf', 'unapproved-pdf'), true)
    const directBlocked = await auditPaths([pdf])
    assert.equal(hasViolation(directBlocked, 'synthetic-cv.pdf', 'unapproved-pdf'), true)
  } finally {
    if (previousGate === undefined) delete process.env.ALLOW_PUBLIC_CV
    else process.env.ALLOW_PUBLIC_CV = previousGate
  }
})

test('rejects nested and individual PDFs below dist regardless of environment', async () => {
  const directory = await makeFixtureDirectory()
  const distDirectory = join(directory, 'dist', 'documents')
  const pdf = join(distDirectory, 'published-cv.pdf')
  await mkdir(distDirectory, { recursive: true })
  await writeFile(pdf, 'synthetic pdf fixture')

  const previousGate = process.env.ALLOW_PUBLIC_CV
  try {
    process.env.ALLOW_PUBLIC_CV = 'true'
    assert.equal(
      hasViolation(await auditPaths([join(directory, 'dist')]), 'published-cv.pdf', 'unapproved-pdf'),
      true
    )
    assert.equal(
      hasViolation(await auditPaths([pdf]), 'published-cv.pdf', 'unapproved-pdf'),
      true
    )
  } finally {
    if (previousGate === undefined) delete process.env.ALLOW_PUBLIC_CV
    else process.env.ALLOW_PUBLIC_CV = previousGate
  }
})

test('fails closed on a top-level symbolic-link input without following it', async (t) => {
  const directory = await makeFixtureDirectory()
  const target = join(directory, 'target.txt')
  const link = join(directory, 'top-level-link.txt')
  await writeFile(target, 'Synthetic visa status note that must not be followed.')
  if (!await createLinkOrSkip(t, target, link, 'file')) return

  const violations = await auditPaths([link])

  assert.equal(hasViolation(violations, 'top-level-link.txt', 'forbidden-symlink'), true)
  assert.equal(hasViolation(violations, 'top-level-link.txt', 'forbidden-private-topic'), false)
})

test('fails closed on a nested directory junction without traversing its target', async (t) => {
  const directory = await makeFixtureDirectory()
  const target = join(directory, 'junction-target')
  const scanRoot = join(directory, 'scan-root')
  const link = join(scanRoot, 'nested-junction')
  await mkdir(target)
  await mkdir(scanRoot)
  await writeFile(join(target, 'private.txt'), 'Synthetic family wealth note that must not be followed.')
  const type = process.platform === 'win32' ? 'junction' : 'dir'
  if (!await createLinkOrSkip(t, target, link, type)) return

  const violations = await auditPaths([scanRoot])

  assert.equal(hasViolation(violations, 'nested-junction', 'forbidden-symlink'), true)
  assert.equal(violations.some((violation) => violation.includes('private.txt')), false)
})

test('rejects a linked PDF below public without following its target', async (t) => {
  const directory = await makeFixtureDirectory()
  const publicDirectory = join(directory, 'public')
  const target = join(directory, 'outside-cv.pdf')
  const link = join(publicDirectory, 'linked-cv.pdf')
  await mkdir(publicDirectory)
  await writeFile(target, 'synthetic pdf fixture')
  if (!await createLinkOrSkip(t, target, link, 'file')) return

  const violations = await auditPaths([publicDirectory])

  assert.equal(hasViolation(violations, 'linked-cv.pdf', 'forbidden-symlink'), true)
  assert.equal(hasViolation(violations, 'linked-cv.pdf', 'unapproved-pdf'), true)
})

test('allows only the exact approved public address and exact mailto destination', async () => {
  const directory = await makeFixtureDirectory()
  const approved = join(directory, 'approved-contact.html')
  await writeFile(
    approved,
    '<a href="mailto:misrarohan619@gmail.com">misrarohan619@gmail.com</a>'
  )
  assert.deepEqual(await auditPaths([approved]), [])

  const rejected = [
    ['email-link.html', '<a href="mailto:person@example.invalid">Write</a>'],
    ['phone-link.tsx', '<a href="tel:+15550100000">Call</a>'],
    ['address.txt', 'Direct contact: person@example.invalid'],
    ['mailto-query.html', '<a href="mailto:misrarohan619@gmail.com?subject=Hello">Write</a>'],
    ['mailto-fragment.html', '<a href="mailto:misrarohan619@gmail.com#compose">Write</a>'],
    ['mailto-path.html', '<a href="mailto:misrarohan619@gmail.com/extra">Write</a>'],
    ['mailto-semicolon.html', '<a href="mailto:misrarohan619@gmail.com;extra">Write</a>'],
    ['mailto-case.html', '<a href="MAILTO:misrarohan619@gmail.com">Write</a>'],
    ['mailto-prefix.html', '<a href="xmailto:misrarohan619@gmail.com">Write</a>'],
    ['address-case.txt', 'MISRAROHAN619@GMAIL.COM'],
    ['address-prefix.txt', 'xmisrarohan619@gmail.com'],
    ['address-suffix.txt', 'misrarohan619@gmail.com.example'],
    ['encoded-contact.html', '<a href="mailto%3Amisrarohan619%40gmail.com">Write</a>'],
    ['percent-obfuscated.html', '<a href="m%61ilto%3Amisrarohan619%40gmail.com">Write</a>'],
    ['double-percent.html', '<a href="m%2561ilto%253Amisrarohan619%2540gmail.com">Write</a>'],
    ['mixed-encoding.html', '<a href="m%26%23x61%3Bilto&#58;misrarohan619%40gmail.com">Write</a>'],
    ['entity-contact.html', '<a href="mailto&#58;misrarohan619&#64;gmail.com">Write</a>'],
    ['split-entity-contact.html', '<a href="m&#97;ilto:misrarohan619&#64;gmail.com">Write</a>'],
    ['hex-entity-contact.html', '<a href="m&#x61;ilto&#x3a;misrarohan619&#x40;gmail.com">Write</a>'],
    ['js-hex-contact.js', 'const href = "\\x6d\\x61ilto\\x3amisrarohan619\\x40gmail.com"'],
    ['js-unicode-contact.js', 'const href = "\\u006d\\u0061ilto\\u003amisrarohan619\\u0040gmail.com"'],
    ['js-codepoint-contact.js', 'const href = "\\u{6d}\\u{61}ilto\\u{3a}misrarohan619\\u{40}gmail.com"'],
    ['whitespace-contact.html', '<a href="m a i l t o : misrarohan619@gmail.com">Write</a>'],
    ['control-contact.html', '<a href="mai\tlto:\nmisrarohan619@gmail.com">Write</a>'],
    ['malformed-contact.html', '<a href="m%ZZailto:misrarohan619@gmail.com">Write</a>'],
    ['overnested-contact.html', '<a href="m%2525252525252561ilto%252525252525253Amisrarohan619%2525252525252540gmail.com">Write</a>']
  ]

  for (const [fileName, contents] of rejected) {
    await writeFile(join(directory, fileName), contents)
  }

  const violations = await auditPaths([directory])

  for (const [fileName] of rejected) {
    assert.equal(
      violations.some((violation) => violation.includes(`${fileName}:`)),
      true,
      `${fileName} should fail closed`
    )
  }
})

test('rejects encoded contact bypasses across source, public, dist, and source-map content', async () => {
  const directory = await makeFixtureDirectory()
  const fixtures = [
    ['src/contact.ts', 'export const contact = "m%61ilto%3Amisrarohan619%40gmail.com"'],
    ['public/contact.html', '<a href="m&#97;ilto:misrarohan619&#64;gmail.com">Write</a>'],
    ['dist/assets/contact.js', 'const contact="m%2561ilto%253Amisrarohan619%2540gmail.com"'],
    ['dist/assets/contact.js.map', JSON.stringify({
      version: 3,
      sources: ['../../src/contact.ts'],
      sourcesContent: ['const contact="\\u{6d}\\u{61}ilto\\u{3a}misrarohan619\\u{40}gmail.com"'],
      names: [],
      mappings: ''
    })]
  ]

  for (const [relativePath, contents] of fixtures) {
    const fixture = join(directory, ...relativePath.split('/'))
    await mkdir(join(fixture, '..'), { recursive: true })
    await writeFile(fixture, contents)
  }

  const violations = await auditPaths([directory])
  for (const [relativePath] of fixtures) {
    const fileName = relativePath.split('/').at(-1)
    assert.equal(hasViolation(violations, fileName, 'forbidden-contact-link'), true, relativePath)
  }
})

test('rejects phone-number-shaped public copy and the obsolete report URL', async () => {
  const directory = await makeFixtureDirectory()
  const fixtures = [
    ['us-phone.txt', 'Call +1 (415) 555-0123 for details.'],
    ['india-phone.txt', 'Call +91 98765 43210 for details.'],
    ['uk-phone.txt', 'Call +44 20 7946 0958 for details.'],
    ['alternate-india-grouping.txt', 'Call +91 9876 543 210 for details.'],
    ['e164-phone.txt', 'Call +442079460958 for details.'],
    ['international-prefix.txt', 'Call 0044 20 7946 0958 for details.'],
    ['parenthesized-area.txt', 'Call +61 (2) 9374-4000 for details.'],
    [
      'obsolete-report.html',
      '<a href="https://laureatesandleaders.org/a-fair-share-for-children-preventing-the-loss-of-a-generation-to-covid-19/">Report</a>'
    ]
  ]

  for (const [fileName, contents] of fixtures) {
    await writeFile(join(directory, fileName), contents)
  }

  const violations = await auditPaths([directory])

  assert.equal(hasViolation(violations, 'us-phone.txt', 'forbidden-phone-number'), true)
  assert.equal(hasViolation(violations, 'india-phone.txt', 'forbidden-phone-number'), true)
  assert.equal(hasViolation(violations, 'uk-phone.txt', 'forbidden-phone-number'), true)
  assert.equal(hasViolation(violations, 'alternate-india-grouping.txt', 'forbidden-phone-number'), true)
  assert.equal(hasViolation(violations, 'e164-phone.txt', 'forbidden-phone-number'), true)
  assert.equal(hasViolation(violations, 'international-prefix.txt', 'forbidden-phone-number'), true)
  assert.equal(hasViolation(violations, 'parenthesized-area.txt', 'forbidden-phone-number'), true)
  assert.equal(hasViolation(violations, 'obsolete-report.html', 'obsolete-report-url'), true)
})

test('does not mistake dates, CSS values, hashes, URLs, or ordinary metrics for phone numbers', async () => {
  const directory = await makeFixtureDirectory()
  const fixtures = [
    ['dates.txt', 'Published 2026-08-19 at 15:48:30.123Z.'],
    ['styles.css', '.panel { box-shadow: 0 24px 70px rgb(11 31 51 / 12%); }'],
    ['hash.txt', 'Artifact 44700bb3bf134c7fa1e15adade4daa51 passed.'],
    ['url.txt', 'Read https://example.com/releases/2026-08-19/build-20260819.'],
    ['metrics.txt', '10+ pilots, ~15,000 hours, 8%+ improvement, and 200+ counties.']
  ]

  for (const [fileName, contents] of fixtures) {
    const fixture = join(directory, fileName)
    await writeFile(fixture, contents)
    assert.deepEqual(await auditPaths([fixture]), [], fileName)
  }
})

test('rejects the legacy synthetic email without a global allowlist exception', async () => {
  const directory = await makeFixtureDirectory()
  const fixture = join(directory, 'allowlisted.txt')
  await writeFile(fixture, 'Audit fixture: privacy-audit@example.invalid')

  assert.equal(hasViolation(await auditPaths([fixture]), 'allowlisted.txt', 'forbidden-email-address'), true)
})

test('email exemptions compare complete tokens with exact casing', async () => {
  const directory = await makeFixtureDirectory()
  const safeCase = join(directory, 'safe-case.txt')
  const prefixed = join(directory, 'prefixed.txt')
  const suffixed = join(directory, 'suffixed.txt')
  const adjacent = join(directory, 'adjacent.txt')
  await writeFile(safeCase, 'Audit fixture: PRIVACY-AUDIT@EXAMPLE.INVALID')
  await writeFile(prefixed, 'Audit fixture: prefixprivacy-audit@example.invalid')
  await writeFile(suffixed, 'Audit fixture: privacy-audit@example.invalid.example')
  await writeFile(adjacent, 'Audit fixtures: privacy-audit@example.invalid,person@example.invalid')

  for (const file of [safeCase, prefixed, suffixed, adjacent]) {
    assert.equal(hasViolation(await auditPaths([file]), file, 'forbidden-email-address'), true)
  }
})

test('scans web manifests, source maps, and XML as published text', async () => {
  const directory = await makeFixtureDirectory()
  const manifest = join(directory, 'site.webmanifest')
  const sourceMap = join(directory, 'bundle.js.map')
  const sitemap = join(directory, 'sitemap.xml')
  await writeFile(manifest, '{"contact":"person@example.invalid"}')
  await writeFile(sourceMap, '{"sourcesContent":["Synthetic compensation package note."]}')
  await writeFile(sitemap, '<note>Synthetic security deposit note.</note>')

  const violations = await auditPaths([directory])

  assert.equal(hasViolation(violations, 'site.webmanifest', 'forbidden-email-address'), true)
  assert.equal(hasViolation(violations, 'bundle.js.map', 'forbidden-private-topic'), true)
  assert.equal(hasViolation(violations, 'sitemap.xml', 'forbidden-private-topic'), true)
})

test('rejects private source-document filenames embedded in decoded text', async () => {
  const directory = await makeFixtureDirectory()
  const sourceMap = join(directory, 'bundle.js.map')
  await writeFile(sourceMap, JSON.stringify({
    version: 3,
    sources: ['../notes/Context_Handoff.md'],
    names: [],
    mappings: ''
  }))

  const violations = await auditPaths([sourceMap])

  assert.equal(hasViolation(violations, 'bundle.js.map', 'forbidden-source-file'), true)
})

test('rejects whitespace-bearing private source-document references', async () => {
  const directory = await makeFixtureDirectory()
  const sourceMap = join(directory, 'bundle.js.map')
  await writeFile(sourceMap, JSON.stringify({
    version: 3,
    sources: ['../notes/Context Handoff Notes.pdf'],
    names: [],
    mappings: ''
  }))

  const violations = await auditPaths([sourceMap])

  assert.equal(hasViolation(violations, 'bundle.js.map', 'forbidden-source-file'), true)
})

test('rejects contact-shaped basenames for every physical entry before extension filtering', async () => {
  const directory = await makeFixtureDirectory()
  const internalDirectory = join(directory, 'internal')
  const emailImage = 'portrait-person@example.invalid.png'
  const approvedEmailFilename = 'misrarohan619@gmail.com'
  const phoneImage = 'portrait-415-555-0123.webp'
  await mkdir(internalDirectory)
  await writeFile(join(internalDirectory, emailImage), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  await writeFile(join(internalDirectory, approvedEmailFilename), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  await writeFile(join(internalDirectory, phoneImage), Buffer.from([0x52, 0x49, 0x46, 0x46]))

  const violations = await auditPaths([directory])

  assert.equal(hasViolation(violations, emailImage, 'forbidden-email-address'), true)
  assert.equal(hasViolation(violations, approvedEmailFilename, 'forbidden-email-address'), true)
  assert.equal(hasViolation(violations, phoneImage, 'forbidden-phone-number'), true)
})

test('applies basename privacy checks to physical directory entries', async () => {
  const directory = await makeFixtureDirectory()
  const privateDirectory = 'Context Handoff Notes'
  const emailDirectory = 'person@example.invalid.png'
  const phoneDirectory = '415-555-0123.webp'
  await mkdir(join(directory, privateDirectory))
  await mkdir(join(directory, emailDirectory))
  await mkdir(join(directory, phoneDirectory))

  const violations = await auditPaths([directory])

  assert.equal(hasViolation(violations, privateDirectory, 'forbidden-source-file'), true)
  assert.equal(hasViolation(violations, emailDirectory, 'forbidden-email-address'), true)
  assert.equal(hasViolation(violations, phoneDirectory, 'forbidden-phone-number'), true)
})

test('rejects network and persistence capabilities in assistant source', async () => {
  const directory = await makeFixtureDirectory()
  const assistantDirectory = join(directory, 'src', 'assistant')
  const componentDirectory = join(directory, 'src', 'components', 'assistant')
  await mkdir(assistantDirectory, { recursive: true })
  await mkdir(componentDirectory, { recursive: true })
  const fixtures = [
    ['fetch.ts', 'export const request = () => fetch("/api")'],
    ['xhr.ts', 'export const request = new XMLHttpRequest()'],
    ['socket.ts', 'export const socket = new WebSocket("wss://example.invalid")'],
    ['beacon.ts', 'navigator.sendBeacon("/event", "x")'],
    ['cookie.ts', 'export const cookie = document.cookie'],
    ['worker.ts', 'serviceWorker.register("/worker.js")'],
    ['session.ts', 'sessionStorage.setItem("draft", "x")'],
    ['local.ts', 'localStorage.setItem("draft", "x")']
  ]
  for (const [fileName, contents] of fixtures.slice(0, 4)) {
    await writeFile(join(assistantDirectory, fileName), contents)
  }
  for (const [fileName, contents] of fixtures.slice(4)) {
    await writeFile(join(componentDirectory, fileName), contents)
  }

  const violations = await auditPaths([join(directory, 'src')])

  for (const [fileName] of fixtures) {
    assert.equal(
      hasViolation(violations, fileName, 'forbidden-assistant-capability'),
      true,
      fileName
    )
  }
})

test('allows localStorage only in ThemeToggle and the exact theme bootstrap', async () => {
  const directory = await makeFixtureDirectory()
  const componentsDirectory = join(directory, 'src', 'components')
  await mkdir(componentsDirectory, { recursive: true })
  const themeToggle = join(componentsDirectory, 'ThemeToggle.tsx')
  const unrelated = join(componentsDirectory, 'RememberMe.tsx')
  const index = join(directory, 'index.html')
  await writeFile(themeToggle, "const theme = window.localStorage.getItem('rohan-theme')")
  await writeFile(unrelated, "const value = localStorage.getItem('other')")
  await writeFile(
    index,
    `<script data-theme-bootstrap>(()=>{try{const k='rohan-theme',v=localStorage.getItem(k),m=matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=v==='light'||v==='dark'?v:(m?'dark':'light')}catch{document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})();</script>`
  )

  assert.deepEqual(await auditPaths([themeToggle, index]), [])
  assert.equal(
    hasViolation(await auditPaths([unrelated]), 'RememberMe.tsx', 'forbidden-local-storage'),
    true
  )
})

test('allows test modules to emulate prohibited APIs while testing shipped behavior', async () => {
  const directory = await makeFixtureDirectory()
  const assistantDirectory = join(directory, 'src', 'components', 'assistant')
  const componentsDirectory = join(directory, 'src', 'components')
  await mkdir(assistantDirectory, { recursive: true })
  await writeFile(
    join(assistantDirectory, 'Assistant.test.tsx'),
    "const storageSpy = vi.spyOn(Storage.prototype, 'setItem'); const xhr = XMLHttpRequest"
  )
  await writeFile(
    join(componentsDirectory, 'ThemeToggle.test.tsx'),
    "localStorage.setItem('rohan-theme', 'dark')"
  )

  assert.deepEqual(await auditPaths([join(directory, 'src')]), [])
})

test('rejects a forbidden capability introduced only in the emitted assistant chunk', async () => {
  const distDirectory = await makeBuiltAssistantFixture({
    chunkContents: 'const injected = () => fetch("/hidden")',
    mapSources: ['../../src/components/assistant/AssistantFeature.tsx'],
    mapSourcesContent: ['export default function AssistantFeature() { return null }']
  })

  const violations = await auditPaths([distDirectory])

  assert.equal(
    hasViolation(violations, 'AssistantFeature-fixture.js', 'forbidden-assistant-capability'),
    true
  )
})

test('rejects a forbidden capability present only in an aligned assistant source-map module', async () => {
  const distDirectory = await makeBuiltAssistantFixture({
    chunkContents: 'const assistant = true',
    mapSources: [
      '../../src/components/assistant/AssistantFeature.tsx',
      '../../src/assistant/localAdapter.ts',
      '../../src/components/assistant/Assistant.test.tsx'
    ],
    mapSourcesContent: [
      'export default function AssistantFeature() { return null }',
      'navigator.sendBeacon("/hidden", "x")',
      'localStorage.setItem("test-only", "x")'
    ]
  })

  const violations = await auditPaths([distDirectory])

  assert.equal(
    hasViolation(violations, 'AssistantFeature-fixture.js.map', 'forbidden-assistant-capability'),
    true
  )
  assert.equal(
    violations.some((violation) => violation.includes('Assistant.test.tsx')),
    false
  )
})

test('rejects contact data in published binary filenames without decoding the files', async () => {
  const directory = await makeFixtureDirectory()
  const publicDirectory = join(directory, 'public', 'images')
  const privateSourceImage = 'Context_Handoff.png'
  const emailImage = 'portrait-person@example.invalid.png'
  const phoneImage = 'portrait-415-555-0123.webp'
  await mkdir(publicDirectory, { recursive: true })
  await writeFile(join(publicDirectory, privateSourceImage), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  await writeFile(join(publicDirectory, emailImage), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  await writeFile(join(publicDirectory, phoneImage), Buffer.from([0x52, 0x49, 0x46, 0x46]))

  const violations = await auditPaths([join(directory, 'public')])

  assert.equal(hasViolation(violations, privateSourceImage, 'forbidden-source-file'), true)
  assert.equal(hasViolation(violations, emailImage, 'forbidden-email-address'), true)
  assert.equal(hasViolation(violations, phoneImage, 'forbidden-phone-number'), true)
})

test('decodes UTF BOMs before applying privacy rules', async () => {
  const directory = await makeFixtureDirectory()
  const utf8 = join(directory, 'utf8-bom.txt')
  const utf16le = join(directory, 'utf16le.txt')
  const utf16be = join(directory, 'utf16be.txt')
  await writeFile(utf8, Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from('Synthetic visa status note.', 'utf8')
  ]))
  await writeFile(utf16le, Buffer.from('\uFEFFSynthetic family wealth note.', 'utf16le'))
  await writeFile(utf16be, utf16BigEndian('Synthetic compensation package note.'))

  const violations = await auditPaths([directory])

  for (const fileName of ['utf8-bom.txt', 'utf16le.txt', 'utf16be.txt']) {
    assert.equal(hasViolation(violations, fileName, 'forbidden-private-topic'), true)
  }
})

test('fails closed on malformed text but never decodes image extensions', async () => {
  const directory = await makeFixtureDirectory()
  const malformed = join(directory, 'malformed.txt')
  const binaryLooking = join(directory, 'binary-looking.txt')
  const image = join(directory, 'image.png')
  await writeFile(malformed, Buffer.from([0xff, 0xff, 0x00, 0x01]))
  await writeFile(binaryLooking, Buffer.from([0x01, 0x02, 0x03, 0x04]))
  await writeFile(image, Buffer.from('Synthetic visa status note.', 'utf8'))

  const violations = await auditPaths([directory])

  assert.equal(hasViolation(violations, 'malformed.txt', 'unsupported-text-encoding'), true)
  assert.equal(hasViolation(violations, 'binary-looking.txt', 'unsupported-text-encoding'), true)
  assert.equal(violations.some((violation) => violation.includes('image.png')), false)
})

test('does not mistake SVG coordinates or CSS values for contact data', async () => {
  const directory = await makeFixtureDirectory()
  const svg = join(directory, 'proofline.svg')
  const css = join(directory, 'layout.css')
  await writeFile(svg, '<path d="M12 118 C110 18 184 174 292 76" />')
  await writeFile(css, '.panel { box-shadow: 0 24px 70px rgb(11 31 51 / 12%); }')

  assert.deepEqual(await auditPaths([svg, css]), [])
})

test('does not mistake a framework input-type map for a telephone link', async () => {
  const directory = await makeFixtureDirectory()
  const readableBundle = join(directory, 'framework-readable.js')
  const minifiedBundle = join(directory, 'framework-minified.js')
  const sourceMap = join(directory, 'framework.js.map')
  await writeFile(readableBundle, 'const supported = { email: true, tel: true, text: true }')
  await writeFile(minifiedBundle, 'var supported={email:!0,tel:!0,text:!0};')
  await writeFile(sourceMap, JSON.stringify({
    sourcesContent: ['const supported = {\n  email: !0,\n  tel: !0,\n  text: !0\n};']
  }))

  assert.deepEqual(await auditPaths([readableBundle, minifiedBundle, sourceMap]), [])
})

test('CLI exits cleanly for safe input and fails with one line per violation', async () => {
  const directory = await makeFixtureDirectory()
  const safeFile = join(directory, 'safe.txt')
  const unsafeFile = join(directory, 'unsafe.txt')
  await writeFile(safeFile, 'Public portfolio copy.')
  await writeFile(unsafeFile, 'Synthetic security deposit note.')

  const clean = await execFileAsync(process.execPath, [auditScript, safeFile])
  assert.equal(clean.stdout.trim(), 'Privacy audit passed.')

  await assert.rejects(
    execFileAsync(process.execPath, [auditScript, unsafeFile]),
    (error) => {
      assert.equal(error.code, 1)
      assert.equal(
        error.stdout.trim().split(/\r?\n/).filter(Boolean).length,
        1
      )
      assert.match(error.stdout, /unsafe\.txt:forbidden-private-topic/)
      return true
    }
  )
})

test('CLI default scans src, public, index.html, and dist', async () => {
  const directory = await makeFixtureDirectory()
  await mkdir(join(directory, 'src'))
  await mkdir(join(directory, 'public'))
  await mkdir(join(directory, 'dist'))
  await writeFile(join(directory, 'src', 'safe.ts'), 'export const message = "Public portfolio copy."')
  await writeFile(join(directory, 'public', 'safe.txt'), 'Public portfolio copy.')
  await writeFile(join(directory, 'index.html'), '<main>Public portfolio copy.</main>')
  await writeFile(
    join(directory, 'dist', 'unsafe.html'),
    '<p>Direct contact: person@example.invalid</p>'
  )

  await assert.rejects(
    execFileAsync(process.execPath, [auditScript], { cwd: directory }),
    (error) => {
      assert.equal(error.code, 1)
      assert.match(error.stdout, /dist[\\/]unsafe\.html:forbidden-email-address/)
      return true
    }
  )
})
