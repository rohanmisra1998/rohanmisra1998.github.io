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
const NON_CONTACT_PROTOCOL_KEY_PATTERN =
  /([,{](?:\s|\\[nrt])*)(?:mailto|tel)\s*:\s*(?:true|false|![01])(?=(?:\s|\\[nrt])*[,}])/gi
const EMAIL_ADDRESS_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const LOCAL_PHONE_NUMBER_PATTERN =
  /(?:\+?1[\s.-]*)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]*\d{3}[\s.-]*\d{4}\b|(?:\+?91[\s.-]*)?[6-9]\d{4}[\s.-]*\d{5}\b/i
const INTERNATIONAL_PHONE_CANDIDATE_PATTERN =
  /(?:^|[\s"'=:(>])((?:\+\d|00\d)[\d\s().-]{6,30}\d)/gm
const OBSOLETE_REPORT_URL_PATTERN =
  /https?:\/\/(?:www\.)?laureatesandleaders\.org\/a-fair-share-for-children-preventing-the-loss-of-a-generation-to-covid-19\/?/i
const APPROVED_PUBLIC_EMAIL = 'misrarohan619@gmail.com'
const APPROVED_MAILTO = `mailto:${APPROVED_PUBLIC_EMAIL}`
const CONTACT_SCHEME_PATTERN = /(?:m[\s\u0000-\u001f\u007f]*a[\s\u0000-\u001f\u007f]*i[\s\u0000-\u001f\u007f]*l[\s\u0000-\u001f\u007f]*t[\s\u0000-\u001f\u007f]*o|t[\s\u0000-\u001f\u007f]*e[\s\u0000-\u001f\u007f]*l)[\s\u0000-\u001f\u007f]*:/gi
const CONTACT_DECODE_LIMIT = 32
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

function decodeContactLayer(contents) {
  return contents
    .replace(/&#(x[0-9a-f]+|\d+);?/gi, (match, encoded) => {
      const hexadecimal = encoded[0].toLowerCase() === 'x'
      const codePoint = Number.parseInt(hexadecimal ? encoded.slice(1) : encoded, hexadecimal ? 16 : 10)
      return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : match
    })
    .replace(/\\+x([0-9a-f]{2})/gi, (_match, encoded) => String.fromCodePoint(Number.parseInt(encoded, 16)))
    .replace(/\\+u(?:\{([0-9a-f]{1,6})\}|([0-9a-f]{4}))/gi, (match, braced, fixed) => {
      const codePoint = Number.parseInt(braced ?? fixed, 16)
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match
    })
    .replace(/%([0-9a-f]{2})/gi, (_match, encoded) => String.fromCodePoint(Number.parseInt(encoded, 16)))
}

function countExactToken(contents, token, validBefore, validAfter) {
  let count = 0
  let start = 0
  while (start < contents.length) {
    const index = contents.indexOf(token, start)
    if (index === -1) break
    const before = index === 0 ? undefined : contents[index - 1]
    const afterIndex = index + token.length
    const after = afterIndex === contents.length ? undefined : contents[afterIndex]
    if (validBefore(before) && validAfter(after)) count += 1
    start = index + token.length
  }
  return count
}

const isEmailBoundary = (value) => value === undefined || !/[A-Za-z0-9@._%+-]/.test(value)

function isEscaped(contents, index) {
  let slashes = 0
  for (let cursor = index - 1; cursor >= 0 && contents[cursor] === '\\'; cursor -= 1) slashes += 1
  return slashes % 2 === 1
}

function findClosingQuote(contents, start, quote, escapedDelimiter = false) {
  for (let index = start + 1; index < contents.length; index += 1) {
    if (contents[index] === quote && isEscaped(contents, index) === escapedDelimiter) return index
  }
  return -1
}

function findHtmlHrefContext(contents, targetIndex) {
  const tagStart = contents.lastIndexOf('<', targetIndex)
  if (tagStart === -1 || contents.lastIndexOf('>', targetIndex) > tagStart) return undefined
  const prefix = contents.slice(tagStart, targetIndex + 1)
  const pattern = /\bhref\s*=\s*/gi
  for (const match of prefix.matchAll(pattern)) {
    const valueStart = tagStart + match.index + match[0].length
    const quote = contents[valueStart]
    if (quote === '"' || quote === "'" || quote === '`') {
      const valueEnd = findClosingQuote(contents, valueStart, quote)
      if (valueEnd !== -1 && targetIndex > valueStart && targetIndex < valueEnd) {
        return {
          kind: 'html-quoted',
          start: valueStart + 1,
          end: valueEnd,
          value: contents.slice(valueStart + 1, valueEnd)
        }
      }
      continue
    }
    let valueEnd = valueStart
    while (valueEnd < contents.length && !/[\s>]/.test(contents[valueEnd])) valueEnd += 1
    if (targetIndex >= valueStart && targetIndex < valueEnd) {
      return {
        kind: 'html-unquoted',
        start: valueStart,
        end: valueEnd,
        value: contents.slice(valueStart, valueEnd)
      }
    }
  }
  return undefined
}

function quotedContexts(contents, targetIndex) {
  const contexts = []
  for (const quote of ['"', "'", '`']) {
    for (const escapedDelimiter of [false, true]) {
      let open = -1
      for (let index = 0; index < contents.length; index += 1) {
        if (contents[index] !== quote || isEscaped(contents, index) !== escapedDelimiter) continue
        if (open === -1) {
          open = index
          continue
        }
        if (targetIndex > open && targetIndex < index) {
          contexts.push({
            kind: 'quoted',
            start: open + 1,
            end: index,
            value: contents.slice(open + 1, index)
          })
        }
        open = -1
      }
    }
  }
  return contexts
}

function findMarkdownDestinationContext(contents, targetIndex) {
  const destinationStart = contents.lastIndexOf('](', targetIndex)
  if (destinationStart === -1) return undefined
  const valueStart = destinationStart + 2
  for (let valueEnd = valueStart; valueEnd < contents.length; valueEnd += 1) {
    if (contents[valueEnd] !== ')' || isEscaped(contents, valueEnd)) continue
    if (targetIndex >= valueStart && targetIndex < valueEnd) {
      return {
        kind: 'markdown-destination',
        start: valueStart,
        end: valueEnd,
        value: contents.slice(valueStart, valueEnd)
      }
    }
    return undefined
  }
  return undefined
}

function findBareContext(contents, targetIndex) {
  let start = targetIndex
  while (start > 0 && !/[\s"'`<>=]/.test(contents[start - 1])) start -= 1
  let end = targetIndex
  while (end < contents.length && !/[\s"'`<>]/.test(contents[end])) end += 1
  return { kind: 'bare', start, end, value: contents.slice(start, end) }
}

function findValueContext(contents, targetIndex) {
  const html = findHtmlHrefContext(contents, targetIndex)
  if (html) return html
  const markdown = findMarkdownDestinationContext(contents, targetIndex)
  if (markdown) return markdown
  const quoted = quotedContexts(contents, targetIndex)
    .sort((left, right) => (left.end - left.start) - (right.end - right.start))[0]
  return quoted ?? findBareContext(contents, targetIndex)
}

function isApprovedMailtoOccurrence(contents, mailtoIndex) {
  return findValueContext(contents, mailtoIndex).value === APPROVED_MAILTO
}

function exactMailtoCount(contents) {
  let count = 0
  let start = 0
  while (start < contents.length) {
    const index = contents.indexOf(APPROVED_MAILTO, start)
    if (index === -1) break
    if (isApprovedMailtoOccurrence(contents, index)) count += 1
    start = index + APPROVED_MAILTO.length
  }
  return count
}

function exactEmailCount(contents) {
  return countExactToken(contents, APPROVED_PUBLIC_EMAIL, isEmailBoundary, isEmailBoundary)
}

function protocolKeyRanges(contents) {
  return [...contents.matchAll(NON_CONTACT_PROTOCOL_KEY_PATTERN)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length
  }))
}

function hasForbiddenScheme(contents) {
  const ignoredRanges = protocolKeyRanges(contents)
  const matches = [...contents.matchAll(CONTACT_SCHEME_PATTERN)]
  for (const match of matches) {
    if (ignoredRanges.some((range) => match.index >= range.start && match.index < range.end)) continue
    const index = match.index
    if (
      match[0] === 'mailto:'
      && contents.startsWith(APPROVED_MAILTO, index)
      && isApprovedMailtoOccurrence(contents, index)
    ) continue
    return true
  }
  return false
}

function schemeSkeleton(prefix) {
  let normalized = prefix
  for (let pass = 0; pass < CONTACT_DECODE_LIMIT; pass += 1) {
    const decoded = decodeContactLayer(normalized)
    if (decoded === normalized) break
    normalized = decoded
  }
  normalized = normalized
    .replace(/%[^\s"'`<>:]{0,2}/g, '')
    .replace(/\\(?:x[^\s"'`<>:]{0,2}|u(?:\{[^}]*\}|[^\s"'`<>:]{0,6}))/gi, '')
    .replace(/&#[^;\s"'`<>:]*;?/g, '')
  return normalized.toLowerCase().replace(/[^a-z]/g, '')
}

function hasForbiddenEmailContactCandidate(contents) {
  const emailPattern = new RegExp(APPROVED_PUBLIC_EMAIL.replace('.', '\\.'), 'g')
  for (const match of contents.matchAll(emailPattern)) {
    const before = match.index === 0 ? undefined : contents[match.index - 1]
    const afterIndex = match.index + APPROVED_PUBLIC_EMAIL.length
    const after = afterIndex === contents.length ? undefined : contents[afterIndex]
    if (!isEmailBoundary(before) || !isEmailBoundary(after)) continue

    const context = findValueContext(contents, match.index)
    const relativeEmailIndex = match.index - context.start
    const colonIndex = context.value.lastIndexOf(':', relativeEmailIndex)
    if (colonIndex === -1) continue
    const skeleton = schemeSkeleton(context.value.slice(0, colonIndex))
    if (skeleton.includes('mailto') || skeleton === 'tel') {
      if (context.value !== APPROVED_MAILTO) return true
    }
  }
  return false
}

function analyzeContactEncoding(contents) {
  let normalized = contents
  const layers = [contents]
  for (let pass = 0; pass < CONTACT_DECODE_LIMIT; pass += 1) {
    const decoded = decodeContactLayer(normalized)
    if (decoded === normalized) return { normalized, layers, exhausted: false }
    normalized = decoded
    layers.push(normalized)
  }
  return {
    normalized,
    layers,
    exhausted: decodeContactLayer(normalized) !== normalized
  }
}

function hasForbiddenContact(contents) {
  const analysis = analyzeContactEncoding(contents)
  if (analysis.exhausted) return true
  for (const layer of analysis.layers) {
    if (hasForbiddenScheme(layer) || hasForbiddenEmailContactCandidate(layer)) return true
  }
  for (let index = 1; index < analysis.layers.length; index += 1) {
    const previous = analysis.layers[index - 1]
    const decoded = analysis.layers[index]
    if (exactMailtoCount(decoded) > exactMailtoCount(previous)) return true
    if (exactEmailCount(decoded) > exactEmailCount(previous)) return true
  }
  return false
}

function hasForbiddenContactForFile(filePath, contents) {
  if (!filePath.toLowerCase().endsWith('.map')) return hasForbiddenContact(contents)

  try {
    const sourceMap = JSON.parse(contents)
    if (!sourceMap || typeof sourceMap !== 'object' || Array.isArray(sourceMap)) {
      return hasForbiddenContact(contents)
    }

    const sourcesContent = Array.isArray(sourceMap.sourcesContent)
      ? sourceMap.sourcesContent.filter((source) => typeof source === 'string')
      : []
    const mapMetadata = { ...sourceMap, sourcesContent: [] }

    return hasForbiddenContact(JSON.stringify(mapMetadata))
      || sourcesContent.some((source) => hasForbiddenContact(source))
  } catch {
    return hasForbiddenContact(contents)
  }
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
    const contactAnalysis = analyzeContactEncoding(contents)
    if (hasForbiddenContactForFile(filePath, contents)) {
      addViolation(violations, filePath, 'forbidden-contact-link')
    }

    const emailAddresses = contactAnalysis.normalized.match(EMAIL_ADDRESS_PATTERN) ?? []
    if (emailAddresses.some((email) => email !== APPROVED_PUBLIC_EMAIL)) {
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
