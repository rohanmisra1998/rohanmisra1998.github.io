import { lstat, readdir, readFile } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'
import { TextDecoder } from 'node:util'
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
  '.map',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml'
])

const PRIVATE_TOPIC_PATTERN =
  /visa status|compensation package|security deposit|family wealth/i
const FORBIDDEN_SOURCE_FILE_PATTERN = /handoff|addendum/i
const CONTACT_LINK_PATTERN = /(?:mailto|tel)\s*:/i
const NON_CONTACT_PROTOCOL_KEY_PATTERN =
  /([,{](?:\s|\\[nrt])*)(?:mailto|tel)\s*:\s*(?:true|false|![01])(?=(?:\s|\\[nrt])*[,}])/gi
const EMAIL_ADDRESS_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const SAFE_SYNTHETIC_EMAIL = 'privacy-audit@example.invalid'
const PUBLISHED_ROOT_NAMES = new Set(['public', 'dist'])
const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true })
const UTF16LE_DECODER = new TextDecoder('utf-16le', { fatal: true })
const UTF16BE_DECODER = new TextDecoder('utf-16be', { fatal: true })
const BINARY_CONTROL_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/

function isPublishedPath(filePath) {
  return resolve(filePath)
    .split(/[\\/]/)
    .some((segment) => PUBLISHED_ROOT_NAMES.has(segment.toLowerCase()))
}

async function collectEntries(inputPath, published = isPublishedPath(inputPath)) {
  const absolutePath = resolve(inputPath)
  const entry = await lstat(absolutePath)

  if (entry.isSymbolicLink()) return [{ filePath: absolutePath, published, symbolicLink: true }]
  if (entry.isFile()) return [{ filePath: absolutePath, published, symbolicLink: false }]
  if (!entry.isDirectory()) return []

  const children = await readdir(absolutePath, { withFileTypes: true })
  children.sort((left, right) => left.name.localeCompare(right.name))

  const entries = []
  for (const child of children) {
    const childPath = resolve(absolutePath, child.name)
    const childPublished = published || PUBLISHED_ROOT_NAMES.has(child.name.toLowerCase())
    entries.push(...await collectEntries(childPath, childPublished))
  }
  return entries
}

function addViolation(violations, filePath, rule) {
  violations.add(`${filePath}:${rule}`)
}

export async function auditPaths(paths) {
  const entries = new Map()
  for (const inputPath of paths) {
    for (const entry of await collectEntries(inputPath)) {
      const existing = entries.get(entry.filePath)
      entries.set(entry.filePath, {
        ...entry,
        published: entry.published || existing?.published || false,
        symbolicLink: entry.symbolicLink || existing?.symbolicLink || false
      })
    }
  }

  const violations = new Set()
  const orderedEntries = [...entries.values()]
    .sort((left, right) => left.filePath.localeCompare(right.filePath))
  for (const { filePath, published, symbolicLink } of orderedEntries) {
    if (FORBIDDEN_SOURCE_FILE_PATTERN.test(basename(filePath))) {
      addViolation(violations, filePath, 'forbidden-source-file')
    }

    const extension = extname(filePath).toLowerCase()
    if (
      extension === '.pdf'
      && published
      && process.env.ALLOW_PUBLIC_CV !== 'true'
    ) {
      addViolation(violations, filePath, 'unapproved-pdf')
    }

    if (symbolicLink) {
      addViolation(violations, filePath, 'forbidden-symlink')
      continue
    }

    if (!TEXT_EXTENSIONS.has(extension)) continue

    const contents = decodeText(await readFile(filePath))
    if (contents === null) {
      addViolation(violations, filePath, 'unsupported-text-encoding')
      continue
    }
    if (PRIVATE_TOPIC_PATTERN.test(contents)) {
      addViolation(violations, filePath, 'forbidden-private-topic')
    }
    const contactSafeContents = contents.replace(NON_CONTACT_PROTOCOL_KEY_PATTERN, '$1')
    if (CONTACT_LINK_PATTERN.test(contactSafeContents)) {
      addViolation(violations, filePath, 'forbidden-contact-link')
    }

    const emailAddresses = contents.match(EMAIL_ADDRESS_PATTERN) ?? []
    if (emailAddresses.some((email) => email.toLowerCase() !== SAFE_SYNTHETIC_EMAIL)) {
      addViolation(violations, filePath, 'forbidden-email-address')
    }
  }

  return [...violations].sort((left, right) => left.localeCompare(right))
}

function decodeText(contents) {
  try {
    let decoded
    if (contents[0] === 0xef && contents[1] === 0xbb && contents[2] === 0xbf) {
      decoded = UTF8_DECODER.decode(contents.subarray(3))
    } else if (contents[0] === 0xff && contents[1] === 0xfe) {
      decoded = UTF16LE_DECODER.decode(contents.subarray(2))
    } else if (contents[0] === 0xfe && contents[1] === 0xff) {
      decoded = UTF16BE_DECODER.decode(contents.subarray(2))
    } else {
      if (contents.includes(0)) return null
      decoded = UTF8_DECODER.decode(contents)
    }
    return BINARY_CONTROL_PATTERN.test(decoded) ? null : decoded
  } catch {
    return null
  }
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
