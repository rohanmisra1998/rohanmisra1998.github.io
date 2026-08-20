import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import test, { afterEach } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  THEME_BOOTSTRAP,
  extractHashes,
  hashAllowedInlineScripts,
  secureHtml
} from './production-security.mjs'

const execFileAsync = promisify(execFile)
const securityScript = fileURLToPath(new URL('./production-security.mjs', import.meta.url))
const temporaryDirectories = []
const EXPECTED_THEME_BOOTSTRAP = "(()=>{try{const k='rohan-theme',v=localStorage.getItem(k),m=matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=v==='light'||v==='dark'?v:(m?'dark':'light')}catch{document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})();"

function fixtureHtml(themeScript = EXPECTED_THEME_BOOTSTRAP) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <script data-theme-bootstrap>${themeScript}</script>
    <script type="application/ld+json">{"@context":"https://schema.org","name":"Fixture"}</script>
  </head>
  <body><div id="root"></div><script type="module" src="/assets/main.js"></script></body>
</html>`
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  )
})

test('injects a no-connect CSP whose hashes exactly match allowed inline scripts', () => {
  assert.equal(THEME_BOOTSTRAP, EXPECTED_THEME_BOOTSTRAP)
  const secured = secureHtml(fixtureHtml())

  assert.match(secured, /http-equiv="Content-Security-Policy"/)
  assert.match(secured, /connect-src 'none'/)
  assert.match(secured, /script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/)
  assert.doesNotMatch(secured, /frame-ancestors/)
  assert.deepEqual(extractHashes(secured), hashAllowedInlineScripts(secured))
  assert.deepEqual(extractHashes(secured), [
    'sha256-RTzwWvAJHOe4sKKdp9sdUyM73C1E1o5Wo50HOl7/gTc=',
    'sha256-2N/gjSYTwAIldfRZI2APKwwXIw97NFJz4H9Fj3Eib54='
  ])
  assert.ok(
    secured.indexOf('Content-Security-Policy') < secured.indexOf('data-theme-bootstrap'),
    'the policy must precede the first allowed inline script'
  )
})

test('is idempotent when securing an already secured production document', () => {
  const once = secureHtml(fixtureHtml())
  const twice = secureHtml(once)

  assert.equal(twice, once)
  assert.equal((twice.match(/Content-Security-Policy/g) ?? []).length, 1)
})

test('fails closed for missing, duplicate, or modified theme bootstraps and missing JSON-LD', () => {
  const cases = [
    ['missing theme bootstrap', fixtureHtml().replace(/\s*<script data-theme-bootstrap>.*?<\/script>/s, '')],
    ['duplicate theme bootstrap', fixtureHtml().replace('</head>', `<script data-theme-bootstrap>${THEME_BOOTSTRAP}</script></head>`) ],
    ['non-exact theme bootstrap', fixtureHtml(`${THEME_BOOTSTRAP}/* changed */`)],
    ['missing JSON-LD', fixtureHtml().replace(/\s*<script type="application\/ld\+json">.*?<\/script>/s, '')]
  ]

  for (const [label, html] of cases) {
    assert.throws(() => secureHtml(html), { name: 'Error' }, label)
  }
})

test('rejects a theme bootstrap outside head and active or loading content before it', () => {
  const themeTag = `<script data-theme-bootstrap>${EXPECTED_THEME_BOOTSTRAP}</script>`
  const outsideHead = fixtureHtml().replace(themeTag, '').replace(
    '<body>',
    `<body>${themeTag}`
  )
  const earlierElements = [
    '<script src="/assets/early.js"></script>',
    '<style>html { color: red }</style>',
    '<link rel="stylesheet" href="/assets/early.css">',
    '<link rel="preload" as="script" href="/assets/early.js">'
  ]

  assert.throws(() => secureHtml(outsideHead), /theme bootstrap.*head/i)
  for (const element of earlierElements) {
    const html = fixtureHtml().replace(themeTag, `${element}\n    ${themeTag}`)
    assert.throws(() => secureHtml(html), /active or loading content.*before/i, element)
  }
})

test('recognizes spaced, unquoted, and alternate-case CSP metadata so duplicates cannot hide', () => {
  const hiddenPolicies = [
    '<meta HTTP-EQUIV = Content-Security-Policy content="default-src \'none\'">',
    '<META http-equiv=content-security-policy CONTENT="default-src \'self\'">'
  ].join('\n    ')
  const html = fixtureHtml().replace(
    '<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />\n    ${hiddenPolicies}`
  )

  assert.throws(() => secureHtml(html), /at most one production CSP/i)
})

test('recognizes entity-encoded CSP values and browser-first duplicate attributes', () => {
  const hiddenPolicies = [
    '<meta http-equiv="Content&#45;Security-Policy" content="default-src \'none\'">',
    '<meta http-equiv=content-security-policy http-equiv=refresh content="default-src \'self\'">'
  ].join('\n    ')
  const html = fixtureHtml().replace(
    '<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />\n    ${hiddenPolicies}`
  )

  assert.throws(() => secureHtml(html), /at most one production CSP/i)
})

test('CLI rewrites only a final dist/index.html and preserves identical bytes on rerun', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-production-security-'))
  temporaryDirectories.push(directory)
  const distDirectory = join(directory, 'dist')
  const finalHtml = join(distDirectory, 'index.html')
  const nonFinalHtml = join(directory, 'index.html')
  await mkdir(distDirectory)
  await writeFile(finalHtml, fixtureHtml())
  await writeFile(nonFinalHtml, fixtureHtml())

  await execFileAsync(process.execPath, [securityScript, 'dist/index.html'], { cwd: directory })
  const once = await readFile(finalHtml, 'utf8')
  await execFileAsync(process.execPath, [securityScript, 'dist/index.html'], { cwd: directory })
  assert.equal(await readFile(finalHtml, 'utf8'), once)
  assert.equal(await readFile(nonFinalHtml, 'utf8'), fixtureHtml())

  await assert.rejects(
    execFileAsync(process.execPath, [securityScript, nonFinalHtml], { cwd: directory }),
    (error) => error.code === 1 && /dist[\\/]index\.html/.test(error.stderr)
  )
})

test('CLI rejects an out-of-project dist suffix and a redirected canonical dist path', async (t) => {
  const project = await mkdtemp(join(tmpdir(), 'portfolio-production-project-'))
  const outside = await mkdtemp(join(tmpdir(), 'portfolio-production-outside-'))
  temporaryDirectories.push(project, outside)
  const outsideDist = join(outside, 'dist')
  const outsideHtml = join(outsideDist, 'index.html')
  await mkdir(outsideDist)
  await writeFile(outsideHtml, fixtureHtml())

  await assert.rejects(
    execFileAsync(process.execPath, [securityScript, outsideHtml], { cwd: project }),
    (error) => error.code === 1 && /canonical.*dist[\\/]index\.html/i.test(error.stderr)
  )
  assert.equal(await readFile(outsideHtml, 'utf8'), fixtureHtml())

  try {
    await symlink(outsideDist, join(project, 'dist'), process.platform === 'win32' ? 'junction' : 'dir')
  } catch (error) {
    if (['EACCES', 'EPERM', 'ENOSYS', 'UNKNOWN'].includes(error?.code)) {
      t.skip(`Symbolic-link creation is unavailable on this platform: ${error.code}`)
      return
    }
    throw error
  }
  await assert.rejects(
    execFileAsync(process.execPath, [securityScript, 'dist/index.html'], { cwd: project }),
    (error) => error.code === 1 && /symbolic|redirect/i.test(error.stderr)
  )
  assert.equal(await readFile(outsideHtml, 'utf8'), fixtureHtml())
})
