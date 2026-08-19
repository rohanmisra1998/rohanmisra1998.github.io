import { lstat, readdir, readFile } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const TEXT_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.mjs',
  '.ts',
  '.tsx',
  '.css',
  '.json',
  '.md',
  '.svg',
  '.txt'
])

const PRIVATE_TOPIC_PATTERN =
  /visa status|compensation package|security deposit|family wealth/i
const FORBIDDEN_SOURCE_FILE_PATTERN = /handoff|addendum/i
const CONTACT_LINK_PATTERN = /(?:mailto|tel)\s*:/i
const NON_CONTACT_PROTOCOL_KEY_PATTERN =
  /([,{]\s*)(?:mailto|tel)\s*:\s*(?:true|false|![01])(?=\s*[,}])/gi
const EMAIL_ADDRESS_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const SAFE_SYNTHETIC_EMAIL_PATTERN = /\bprivacy-audit@example\.invalid\b/gi

function isBelowPublicDirectory(filePath) {
  return resolve(filePath)
    .split(/[\\/]/)
    .some((segment) => segment.toLowerCase() === 'public')
}

async function collectFiles(inputPath) {
  const absolutePath = resolve(inputPath)
  const entry = await lstat(absolutePath)

  if (entry.isSymbolicLink()) return []
  if (entry.isFile()) return [absolutePath]
  if (!entry.isDirectory()) return []

  const children = await readdir(absolutePath, { withFileTypes: true })
  children.sort((left, right) => left.name.localeCompare(right.name))

  const files = []
  for (const child of children) {
    if (child.isSymbolicLink()) continue
    files.push(...await collectFiles(resolve(absolutePath, child.name)))
  }
  return files
}

function addViolation(violations, filePath, rule) {
  violations.add(`${filePath}:${rule}`)
}

export async function auditPaths(paths) {
  const files = new Set()
  for (const inputPath of paths) {
    for (const filePath of await collectFiles(inputPath)) {
      files.add(filePath)
    }
  }

  const violations = new Set()
  for (const filePath of [...files].sort((left, right) => left.localeCompare(right))) {
    if (FORBIDDEN_SOURCE_FILE_PATTERN.test(basename(filePath))) {
      addViolation(violations, filePath, 'forbidden-source-file')
    }

    const extension = extname(filePath).toLowerCase()
    if (
      extension === '.pdf'
      && isBelowPublicDirectory(filePath)
      && process.env.ALLOW_PUBLIC_CV !== 'true'
    ) {
      addViolation(violations, filePath, 'unapproved-pdf')
    }

    if (!TEXT_EXTENSIONS.has(extension)) continue

    const contents = await readFile(filePath, 'utf8')
    if (PRIVATE_TOPIC_PATTERN.test(contents)) {
      addViolation(violations, filePath, 'forbidden-private-topic')
    }
    const contactSafeContents = contents.replace(NON_CONTACT_PROTOCOL_KEY_PATTERN, '$1')
    if (CONTACT_LINK_PATTERN.test(contactSafeContents)) {
      addViolation(violations, filePath, 'forbidden-contact-link')
    }

    const emailSafeContents = contents.replace(SAFE_SYNTHETIC_EMAIL_PATTERN, '')
    if (EMAIL_ADDRESS_PATTERN.test(emailSafeContents)) {
      addViolation(violations, filePath, 'forbidden-email-address')
    }
  }

  return [...violations].sort((left, right) => left.localeCompare(right))
}

async function runCli() {
  const paths = process.argv.slice(2)
  const violations = await auditPaths(paths.length > 0 ? paths : ['src', 'public', 'index.html'])

  if (violations.length > 0) {
    for (const violation of violations) console.log(violation)
    process.exitCode = 1
    return
  }

  console.log('Privacy audit passed.')
}

const isMain = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isMain) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
