import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
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

    process.env.ALLOW_PUBLIC_CV = 'true'
    assert.deepEqual(await auditPaths([pdf]), [])
  } finally {
    if (previousGate === undefined) delete process.env.ALLOW_PUBLIC_CV
    else process.env.ALLOW_PUBLIC_CV = previousGate
  }
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
  await writeFile(readableBundle, 'const supported = { email: true, tel: true, text: true }')
  await writeFile(minifiedBundle, 'var supported={email:!0,tel:!0,text:!0};')

  assert.deepEqual(await auditPaths([readableBundle, minifiedBundle]), [])
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
