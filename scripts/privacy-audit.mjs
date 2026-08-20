import { lstat, readdir, readFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'
import { TextDecoder } from 'node:util'
import { pathToFileURL } from 'node:url'
import {
  isAssistantSource,
  isAssistantTestSource,
  readChunkAttribution,
  resolveAssistantGraph
} from './assistant-artifacts.mjs'

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
const FORBIDDEN_SOURCE_FILE_REFERENCE_PATTERN =
  /\b(?:[\w.-]+[ \t]+)*[\w.-]*(?:handoff|addendum)[\w.-]*(?:[ \t]+[\w.-]+)*\.(?:md|markdown|txt|docx?|pdf)\b/i
const CONTACT_LINK_PATTERN = /(?:mailto|tel)\s*:/i
const ENCODED_CONTACT_LINK_PATTERN = /(?:mailto|tel)(?:%3a|&#(?:x0*3a|0*58);|\\u0*03a|\\x3a)/i
const NON_CONTACT_PROTOCOL_KEY_PATTERN =
  /([,{](?:\s|\\[nrt])*)(?:mailto|tel)\s*:\s*(?:true|false|![01])(?=(?:\s|\\[nrt])*[,}])/gi
const EMAIL_ADDRESS_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const LOCAL_PHONE_NUMBER_PATTERN =
  /(?:\+?1[\s.-]*)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]*\d{3}[\s.-]*\d{4}\b|(?:\+?91[\s.-]*)?[6-9]\d{4}[\s.-]*\d{5}\b/i
const INTERNATIONAL_PHONE_CANDIDATE_PATTERN =
  /(?:^|[\s"'=:(>])((?:\+\d|00\d)[\d\s().-]{6,30}\d)/gm
const OBSOLETE_REPORT_URL_PATTERN =
  /https?:\/\/(?:www\.)?laureatesandleaders\.org\/a-fair-share-for-children-preventing-the-loss-of-a-generation-to-covid-19\/?/i
const SAFE_SYNTHETIC_EMAIL = 'privacy-audit@example.invalid'
const APPROVED_PUBLIC_EMAIL = 'misrarohan619@gmail.com'
const APPROVED_MAILTO_PATTERN =
  /(?<![A-Za-z0-9%])mailto:misrarohan619@gmail\.com(?![A-Za-z0-9@._+?&#%=-])/g
const ALLOWED_EMAILS = new Set([SAFE_SYNTHETIC_EMAIL, APPROVED_PUBLIC_EMAIL])
const PUBLISHED_ROOT_NAMES = new Set(['public', 'dist'])
const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true })
const UTF16LE_DECODER = new TextDecoder('utf-16le', { fatal: true })
const UTF16BE_DECODER = new TextDecoder('utf-16be', { fatal: true })
const BINARY_CONTROL_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
const EXACT_THEME_BOOTSTRAP = "(()=>{try{const k='rohan-theme',v=localStorage.getItem(k),m=matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=v==='light'||v==='dark'?v:(m?'dark':'light')}catch{document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})();"
const ASSISTANT_CAPABILITY_PATTERNS = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bsendBeacon\b/,
  /\bdocument\s*\.\s*cookie\b/,
  /\bserviceWorker\s*\.\s*register\b/,
  /\bsessionStorage\b/,
  /\blocalStorage\b/
]

function isPublishedPath(filePath) {
  return resolve(filePath)
    .split(/[\\/]/)
    .some((segment) => PUBLISHED_ROOT_NAMES.has(segment.toLowerCase()))
}

async function collectEntries(inputPath, published = isPublishedPath(inputPath)) {
  const absolutePath = resolve(inputPath)
  const entry = await lstat(absolutePath)

  if (entry.isSymbolicLink()) {
    return [{ filePath: absolutePath, published, symbolicLink: true, regularFile: false }]
  }
  if (entry.isFile()) {
    return [{ filePath: absolutePath, published, symbolicLink: false, regularFile: true }]
  }
  if (!entry.isDirectory()) return []

  const children = await readdir(absolutePath, { withFileTypes: true })
  children.sort((left, right) => left.name.localeCompare(right.name))

  const entries = [{
    filePath: absolutePath,
    published,
    symbolicLink: false,
    regularFile: false
  }]
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

function pathSegments(filePath) {
  return resolve(filePath).replaceAll('\\', '/').toLowerCase().split('/')
}

function hasSegmentSequence(segments, sequence) {
  return segments.some((_, index) => sequence.every((segment, offset) => (
    segments[index + offset] === segment
  )))
}

function isAssistantSourcePath(filePath) {
  const segments = pathSegments(filePath)
  return hasSegmentSequence(segments, ['src', 'assistant'])
    || hasSegmentSequence(segments, ['src', 'components', 'assistant'])
}

function isSourcePath(filePath) {
  return pathSegments(filePath).includes('src')
}

function isTestSourcePath(filePath) {
  return /\.(?:test|spec)\.[^.]+$/i.test(basename(filePath))
}

function isThemeTogglePath(filePath) {
  const segments = pathSegments(filePath)
  return segments.at(-1) === 'themetoggle.tsx'
    && hasSegmentSequence(segments, ['src', 'components'])
}

function indexUsesOnlyExactThemeStorage(filePath, contents) {
  if (basename(filePath).toLowerCase() !== 'index.html') return false
  const taggedBootstrap = `<script data-theme-bootstrap>${EXACT_THEME_BOOTSTRAP}</script>`
  if (!contents.includes(taggedBootstrap)) return false
  return !contents.replace(taggedBootstrap, '').includes('localStorage')
}

function containsPhoneNumber(contents) {
  if (LOCAL_PHONE_NUMBER_PATTERN.test(contents)) return true

  for (const match of contents.matchAll(INTERNATIONAL_PHONE_CANDIDATE_PATTERN)) {
    const digitCount = match[1].match(/\d/g)?.length ?? 0
    if (digitCount >= 8 && digitCount <= 15) return true
  }
  return false
}

function containsAssistantCapability(contents) {
  return ASSISTANT_CAPABILITY_PATTERNS.some((pattern) => pattern.test(contents))
}

async function auditBuiltAssistantArtifacts(entries, violations) {
  const manifests = [...entries.values()].filter(({ filePath, regularFile }) => (
    regularFile
    && basename(filePath).toLowerCase() === 'manifest.json'
    && basename(dirname(filePath)).toLowerCase() === '.vite'
    && isPublishedPath(filePath)
  ))
  for (const { filePath: manifestPath } of manifests) {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    const rootDirectory = resolve(dirname(manifestPath), '..')
    const { javascriptFiles } = resolveAssistantGraph(manifest)
    for (const file of javascriptFiles) {
      const attribution = await readChunkAttribution(rootDirectory, file)
      if (containsAssistantCapability(attribution.chunkContents)) {
        addViolation(violations, attribution.filePath, 'forbidden-assistant-capability')
      }
      for (const { source, content } of attribution.modules) {
        if (
          isAssistantSource(source)
          && !isAssistantTestSource(source)
          && typeof content === 'string'
          && containsAssistantCapability(content)
        ) {
          addViolation(
            violations,
            `${attribution.mapPath}#${source}`,
            'forbidden-assistant-capability'
          )
        }
      }
    }
  }
}

export async function auditPaths(paths) {
  const entries = new Map()
  for (const inputPath of paths) {
    for (const entry of await collectEntries(inputPath)) {
      const existing = entries.get(entry.filePath)
      entries.set(entry.filePath, {
        ...entry,
        published: entry.published || existing?.published || false,
        symbolicLink: entry.symbolicLink || existing?.symbolicLink || false,
        regularFile: entry.regularFile || existing?.regularFile || false
      })
    }
  }

  const violations = new Set()
  const orderedEntries = [...entries.values()]
    .sort((left, right) => left.filePath.localeCompare(right.filePath))
  for (const { filePath, published, symbolicLink, regularFile } of orderedEntries) {
    const physicalBasename = basename(filePath)
    if (FORBIDDEN_SOURCE_FILE_PATTERN.test(physicalBasename)) {
      addViolation(violations, filePath, 'forbidden-source-file')
    }
    const filenameEmails = physicalBasename.match(EMAIL_ADDRESS_PATTERN) ?? []
    if (filenameEmails.length > 0) {
      addViolation(violations, filePath, 'forbidden-email-address')
    }
    if (containsPhoneNumber(physicalBasename)) {
      addViolation(violations, filePath, 'forbidden-phone-number')
    }

    const extension = extname(filePath).toLowerCase()
    if (
      extension === '.pdf'
      && published
      && (regularFile || symbolicLink)
      && process.env.ALLOW_PUBLIC_CV !== 'true'
    ) {
      addViolation(violations, filePath, 'unapproved-pdf')
    }

    if (symbolicLink) {
      addViolation(violations, filePath, 'forbidden-symlink')
      continue
    }

    if (!regularFile) continue

    if (!TEXT_EXTENSIONS.has(extension)) continue

    const contents = decodeText(await readFile(filePath))
    if (contents === null) {
      addViolation(violations, filePath, 'unsupported-text-encoding')
      continue
    }
    if (PRIVATE_TOPIC_PATTERN.test(contents)) {
      addViolation(violations, filePath, 'forbidden-private-topic')
    }
    if (FORBIDDEN_SOURCE_FILE_REFERENCE_PATTERN.test(contents)) {
      addViolation(violations, filePath, 'forbidden-source-file')
    }
    const contactSafeContents = contents
      .replace(NON_CONTACT_PROTOCOL_KEY_PATTERN, '$1')
      .replace(APPROVED_MAILTO_PATTERN, '')
    if (
      CONTACT_LINK_PATTERN.test(contactSafeContents)
      || ENCODED_CONTACT_LINK_PATTERN.test(contents)
    ) {
      addViolation(violations, filePath, 'forbidden-contact-link')
    }

    const emailAddresses = contents.match(EMAIL_ADDRESS_PATTERN) ?? []
    if (emailAddresses.some((email) => !ALLOWED_EMAILS.has(email))) {
      addViolation(violations, filePath, 'forbidden-email-address')
    }
    if (containsPhoneNumber(contents)) {
      addViolation(violations, filePath, 'forbidden-phone-number')
    }
    if (OBSOLETE_REPORT_URL_PATTERN.test(contents)) {
      addViolation(violations, filePath, 'obsolete-report-url')
    }
    if (
      isAssistantSourcePath(filePath)
      && !isTestSourcePath(filePath)
      && containsAssistantCapability(contents)
    ) {
      addViolation(violations, filePath, 'forbidden-assistant-capability')
    }
    if (
      contents.includes('localStorage')
      && isSourcePath(filePath)
      && !isTestSourcePath(filePath)
      && !isThemeTogglePath(filePath)
    ) {
      addViolation(violations, filePath, 'forbidden-local-storage')
    }
    if (
      contents.includes('localStorage')
      && basename(filePath).toLowerCase() === 'index.html'
      && !indexUsesOnlyExactThemeStorage(filePath, contents)
    ) {
      addViolation(violations, filePath, 'forbidden-local-storage')
    }
  }

  await auditBuiltAssistantArtifacts(entries, violations)

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
  const violations = await auditPaths(
    paths.length > 0 ? paths : ['src', 'public', 'index.html', 'dist']
  )

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
