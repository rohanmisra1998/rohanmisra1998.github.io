import { createHash } from 'node:crypto'
import { lstat, readFile, realpath, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const THEME_BOOTSTRAP = "(()=>{try{const k='rohan-theme',v=localStorage.getItem(k),m=matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=v==='light'||v==='dark'?v:(m?'dark':'light')}catch{document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})();"

const LOADING_LINK_RELATIONS = new Set([
  'dns-prefetch',
  'icon',
  'manifest',
  'modulepreload',
  'prefetch',
  'preload',
  'preconnect',
  'stylesheet'
])
const ACTIVE_ELEMENTS = new Set([
  'audio',
  'base',
  'embed',
  'iframe',
  'img',
  'object',
  'script',
  'source',
  'style',
  'video'
])

function parseAttributes(text) {
  const attributes = new Map()
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  for (const match of text.matchAll(pattern)) {
    const name = match[1].toLowerCase()
    if (attributes.has(name)) continue
    const rawValue = match[2] ?? match[3] ?? match[4]
    const value = rawValue === undefined ? null : rawValue.replace(
      /&#(?:x([\da-f]+)|(\d+));/gi,
      (_, hexadecimal, decimal) => String.fromCodePoint(parseInt(hexadecimal ?? decimal, hexadecimal ? 16 : 10))
    ).replace(/&(amp|quot|apos|lt|gt);/gi, (_, entity) => ({
      amp: '&',
      quot: '"',
      apos: "'",
      lt: '<',
      gt: '>'
    })[entity.toLowerCase()])
    attributes.set(name, value)
  }
  return attributes
}

function findTagEnd(html, start) {
  let quote = null
  for (let index = start; index < html.length; index += 1) {
    const character = html[index]
    if (quote) {
      if (character === quote) quote = null
    } else if (character === '"' || character === "'") {
      quote = character
    } else if (character === '>') {
      return index + 1
    }
  }
  throw new Error('Malformed HTML tag without a closing angle bracket.')
}

function scanTags(html) {
  const tags = []
  let cursor = 0
  while (cursor < html.length) {
    const start = html.indexOf('<', cursor)
    if (start === -1) break
    if (html.startsWith('<!--', start)) {
      const commentEnd = html.indexOf('-->', start + 4)
      if (commentEnd === -1) throw new Error('Malformed unterminated HTML comment.')
      cursor = commentEnd + 3
      continue
    }
    if (/^<\s*[!/]/.test(html.slice(start))) {
      cursor = findTagEnd(html, start + 1)
      continue
    }
    const nameMatch = /^<\s*([A-Za-z][\w:-]*)/.exec(html.slice(start))
    if (!nameMatch) {
      cursor = start + 1
      continue
    }
    const name = nameMatch[1].toLowerCase()
    const end = findTagEnd(html, start + nameMatch[0].length)
    const nameEnd = start + nameMatch[0].length
    const attributes = parseAttributes(html.slice(nameEnd, end - 1))
    const tag = { name, attributes, start, end, closeStart: null, closeEnd: null }
    if (name === 'script' || name === 'style') {
      const closing = new RegExp(`<\\/\\s*${name}\\s*>`, 'ig')
      closing.lastIndex = end
      const match = closing.exec(html)
      if (!match) throw new Error(`Malformed ${name} element without a closing tag.`)
      tag.closeStart = match.index
      tag.closeEnd = closing.lastIndex
      cursor = tag.closeEnd
    } else {
      cursor = end
    }
    tags.push(tag)
  }
  return tags
}

function headRange(html, tags = scanTags(html)) {
  const heads = tags.filter(({ name }) => name === 'head')
  const closingHeads = [...html.matchAll(/<\/\s*head\s*>/gi)]
  if (heads.length !== 1 || closingHeads.length !== 1) {
    throw new Error('Expected exactly one parseable head element.')
  }
  const head = heads[0]
  const closeStart = closingHeads[0].index
  if (closeStart < head.end) throw new Error('Malformed head element ordering.')
  return { start: head.start, contentStart: head.end, closeStart, closeEnd: closeStart + closingHeads[0][0].length }
}

function isCspMeta(tag) {
  return tag.name === 'meta'
    && tag.attributes.get('http-equiv')?.trim().toLowerCase() === 'content-security-policy'
}

function cspMetas(html, tags = scanTags(html)) {
  return tags.filter(isCspMeta)
}

function isActiveOrLoading(tag) {
  if (ACTIVE_ELEMENTS.has(tag.name)) return true
  if (tag.name === 'meta') {
    return tag.attributes.get('http-equiv')?.trim().toLowerCase() === 'refresh'
  }
  if (tag.name !== 'link') return false
  const relations = (tag.attributes.get('rel') ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  return relations.some((relation) => LOADING_LINK_RELATIONS.has(relation))
}

function scriptDetails(html) {
  const tags = scanTags(html)
  const head = headRange(html, tags)
  const scripts = tags.filter(({ name }) => name === 'script')
  const themes = scripts.filter(({ attributes }) => attributes.has('data-theme-bootstrap'))
  const jsonLd = scripts.filter(({ attributes }) => (
    attributes.get('type')?.trim().toLowerCase() === 'application/ld+json'
  ))
  const external = scripts.filter(({ attributes }) => attributes.has('src'))
  const allowed = new Set([...themes, ...jsonLd])
  const unexpectedInline = scripts.filter((tag) => !external.includes(tag) && !allowed.has(tag))

  if (themes.length !== 1) {
    throw new Error(`Expected exactly one tagged theme bootstrap; found ${themes.length}.`)
  }
  const theme = themes[0]
  const themeText = html.slice(theme.end, theme.closeStart)
  if (themeText !== THEME_BOOTSTRAP) {
    throw new Error('The tagged theme bootstrap does not match the reviewed production bootstrap.')
  }
  if (theme.start < head.contentStart || theme.closeEnd > head.closeStart) {
    throw new Error('The tagged theme bootstrap must be inside head.')
  }
  if (jsonLd.length === 0) {
    throw new Error('Expected at least one static JSON-LD script.')
  }
  if (jsonLd.some(({ attributes }) => attributes.has('src'))) {
    throw new Error('JSON-LD scripts must be static inline content.')
  }
  if (unexpectedInline.length > 0) {
    throw new Error(`Found ${unexpectedInline.length} unapproved inline script(s).`)
  }

  const earlierActive = tags.filter((tag) => (
    tag.start >= head.contentStart
    && tag.start < theme.start
    && isActiveOrLoading(tag)
  ))
  if (earlierActive.length > 0) {
    throw new Error(`Found active or loading content before the CSP/theme sequence: ${earlierActive[0].name}.`)
  }

  return { theme, themeText, jsonLd, tags, head }
}

function hashScriptText(text) {
  return `sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}`
}

export function hashAllowedInlineScripts(html) {
  const { theme, themeText, jsonLd } = scriptDetails(html)
  return [theme, ...jsonLd]
    .sort((left, right) => left.start - right.start)
    .map((tag) => hashScriptText(tag === theme ? themeText : html.slice(tag.end, tag.closeStart)))
}

export function extractHashes(html) {
  const policies = cspMetas(html)
  if (policies.length !== 1) {
    throw new Error(`Expected exactly one production CSP meta tag; found ${policies.length}.`)
  }
  return policies[0].attributes.get('content')?.match(/sha256-[A-Za-z0-9+/=]+/g) ?? []
}

function removeExistingPolicy(html, policy) {
  let start = policy.start
  const lineStart = html.lastIndexOf('\n', start - 1) + 1
  if (/^[ \t]*$/.test(html.slice(lineStart, start))) start = lineStart
  let end = policy.end
  const followingLineBreak = /^[ \t]*\r?\n/.exec(html.slice(end))
  if (followingLineBreak) end += followingLineBreak[0].length
  return `${html.slice(0, start)}${html.slice(end)}`
}

export function secureHtml(html) {
  const initialTags = scanTags(html)
  const initialHead = headRange(html, initialTags)
  const existingPolicies = cspMetas(html, initialTags)
  if (existingPolicies.length > 1) {
    throw new Error(`Expected at most one production CSP meta tag; found ${existingPolicies.length}.`)
  }
  if (
    existingPolicies.length === 1
    && (
      existingPolicies[0].start < initialHead.contentStart
      || existingPolicies[0].end > initialHead.closeStart
    )
  ) {
    throw new Error('Existing production CSP meta must be inside head.')
  }
  const unsecured = existingPolicies.length === 1
    ? removeExistingPolicy(html, existingPolicies[0])
    : html
  const hashes = hashAllowedInlineScripts(unsecured)
  const { theme } = scriptDetails(unsecured)
  const directives = [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "form-action 'none'",
    "img-src 'self' data:",
    "font-src 'self'",
    "style-src 'self'",
    `script-src 'self' ${hashes.map((hash) => `'${hash}'`).join(' ')}`,
    "connect-src 'none'",
    "manifest-src 'self'"
  ].join('; ')
  const meta = `<meta http-equiv="Content-Security-Policy" content="${directives}" />`
  const scriptStart = theme.start
  const lineStart = unsecured.lastIndexOf('\n', scriptStart - 1) + 1
  const indent = unsecured.slice(lineStart, scriptStart)
  const secured = `${unsecured.slice(0, lineStart)}${indent}${meta}\n${unsecured.slice(lineStart)}`

  const securedTags = scanTags(secured)
  const securedHead = headRange(secured, securedTags)
  const securedPolicies = cspMetas(secured, securedTags)
  const securedTheme = scriptDetails(secured).theme
  if (
    securedPolicies.length !== 1
    || securedPolicies[0].start < securedHead.contentStart
    || securedPolicies[0].end > securedHead.closeStart
    || securedPolicies[0].start >= securedTheme.start
  ) {
    throw new Error('Generated CSP must precede the theme bootstrap inside head.')
  }
  const loadingBeforePolicy = securedTags.find((tag) => (
    tag.start >= securedHead.contentStart
    && tag.start < securedPolicies[0].start
    && isActiveOrLoading(tag)
  ))
  if (loadingBeforePolicy) {
    throw new Error(`Generated CSP follows active or loading content: ${loadingBeforePolicy.name}.`)
  }

  if (JSON.stringify(extractHashes(secured)) !== JSON.stringify(hashAllowedInlineScripts(secured))) {
    throw new Error('Generated CSP hashes do not match the allowed inline scripts.')
  }
  return secured
}

async function runCli() {
  const expected = resolve(process.cwd(), 'dist', 'index.html')
  const input = resolve(process.argv[2] ?? expected)
  if (input !== expected) {
    throw new Error(`Production security may write only canonical ${expected}.`)
  }
  const distDirectory = dirname(expected)
  const [distEntry, inputEntry] = await Promise.all([lstat(distDirectory), lstat(expected)])
  if (distEntry.isSymbolicLink() || inputEntry.isSymbolicLink()) {
    throw new Error('Production security rejects symbolic or redirected dist/index.html paths.')
  }
  const [realCwd, realDist, realInput] = await Promise.all([
    realpath(process.cwd()),
    realpath(distDirectory),
    realpath(expected)
  ])
  const comparable = (value) => process.platform === 'win32' ? value.toLowerCase() : value
  if (
    comparable(realDist) !== comparable(resolve(realCwd, 'dist'))
    || comparable(realInput) !== comparable(resolve(realCwd, 'dist', 'index.html'))
  ) {
    throw new Error('Production security rejects symbolic or redirected dist/index.html paths.')
  }
  const original = await readFile(input, 'utf8')
  const secured = secureHtml(original)
  if (secured !== original) await writeFile(input, secured)
  console.log(`Production CSP secured ${input} with ${extractHashes(secured).join(', ')}.`)
}

const isMain = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isMain) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
