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

test('rejects PDFs anywhere below public unless the explicit CV gate is enabled', async () => {
  const directory = await makeFixtureDirectory()
  const publicDirectory = join(directory, 'public', 'documents')
  const pdf = join(publicDirectory, 'synthetic-cv.pdf')
  await mkdir(publicDirectory, { recursive: true })
  await writeFile(pdf, 'synthetic pdf fixture')

  const previousGate = process.env.ALLOW_PUBLIC_CV
  delete process.env.ALLOW_PUBLIC_CV
  try {
    const blocked = await auditPaths([join(directory, 'public')])
    assert.equal(hasViolation(blocked, 'synthetic-cv.pdf', 'unapproved-pdf'), true)
    const directBlocked = await auditPaths([pdf])
    assert.equal(hasViolation(directBlocked, 'synthetic-cv.pdf', 'unapproved-pdf'), true)

    process.env.ALLOW_PUBLIC_CV = 'true'
    assert.deepEqual(await auditPaths([pdf]), [])
  } finally {
    if (previousGate === undefined) delete process.env.ALLOW_PUBLIC_CV
    else process.env.ALLOW_PUBLIC_CV = previousGate
  }
})

test('rejects nested and individual PDFs below the deployment dist root', async () => {
  const directory = await makeFixtureDirectory()
  const distDirectory = join(directory, 'dist', 'documents')
  const pdf = join(distDirectory, 'published-cv.pdf')
  await mkdir(distDirectory, { recursive: true })
  await writeFile(pdf, 'synthetic pdf fixture')

  const previousGate = process.env.ALLOW_PUBLIC_CV
  delete process.env.ALLOW_PUBLIC_CV
  try {
    assert.equal(
      hasViolation(await auditPaths([join(directory, 'dist')]), 'published-cv.pdf', 'unapproved-pdf'),
      true
    )
    assert.equal(
      hasViolation(await auditPaths([pdf]), 'published-cv.pdf', 'unapproved-pdf'),
      true
    )

    process.env.ALLOW_PUBLIC_CV = 'true'
    assert.deepEqual(await auditPaths([pdf]), [])
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

test('rejects direct contact links and email-shaped public copy', async () => {
  const directory = await makeFixtureDirectory()
  const fixtures = [
    ['email-link.html', '<a href="mailto:person@example.invalid">Write</a>'],
    ['phone-link.tsx', '<a href="tel:+15550100000">Call</a>'],
    ['address.txt', 'Direct contact: person@example.invalid']
  ]

  for (const [fileName, contents] of fixtures) {
    await writeFile(join(directory, fileName), contents)
  }

  const violations = await auditPaths([directory])

  assert.equal(hasViolation(violations, 'email-link.html', 'forbidden-contact-link'), true)
  assert.equal(hasViolation(violations, 'phone-link.tsx', 'forbidden-contact-link'), true)
  assert.equal(hasViolation(violations, 'address.txt', 'forbidden-email-address'), true)
})

test('allows only the narrow synthetic email explicitly reserved for audit fixtures', async () => {
  const directory = await makeFixtureDirectory()
  const fixture = join(directory, 'allowlisted.txt')
  await writeFile(fixture, 'Audit fixture: privacy-audit@example.invalid')

  assert.deepEqual(await auditPaths([fixture]), [])
})

test('email exemption compares complete tokens case-insensitively', async () => {
  const directory = await makeFixtureDirectory()
  const safeCase = join(directory, 'safe-case.txt')
  const prefixed = join(directory, 'prefixed.txt')
  const suffixed = join(directory, 'suffixed.txt')
  const adjacent = join(directory, 'adjacent.txt')
  await writeFile(safeCase, 'Audit fixture: PRIVACY-AUDIT@EXAMPLE.INVALID')
  await writeFile(prefixed, 'Audit fixture: prefixprivacy-audit@example.invalid')
  await writeFile(suffixed, 'Audit fixture: privacy-audit@example.invalid.example')
  await writeFile(adjacent, 'Audit fixtures: privacy-audit@example.invalid,person@example.invalid')

  assert.deepEqual(await auditPaths([safeCase]), [])
  for (const file of [prefixed, suffixed, adjacent]) {
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
