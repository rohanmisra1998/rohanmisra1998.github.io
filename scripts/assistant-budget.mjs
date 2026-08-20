import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { pathToFileURL } from 'node:url'
import {
  isAssistantSource,
  isAssistantTestSource,
  normalizedSource,
  readChunkAttribution,
  resolveAssistantGraph,
  safeOutputPath
} from './assistant-artifacts.mjs'

const JAVASCRIPT_BUDGET = 15 * 1024
const CSS_BUDGET = 4 * 1024

function assistantSource(key, record) {
  return isAssistantSource(normalizedSource(record?.src ?? key))
}

async function gzipTotal(rootDirectory, files) {
  let total = 0
  for (const file of files) {
    total += gzipSync(await readFile(safeOutputPath(rootDirectory, file))).byteLength
  }
  return total
}

export async function measureAssistantAssets(manifest, options = {}) {
  const rootDirectory = resolve(options.rootDirectory ?? 'dist')
  const {
    eagerGraph,
    javascriptFiles,
    eagerJavascriptFiles,
    cssFiles
  } = resolveAssistantGraph(manifest)
  const eagerAssistant = [...eagerGraph].filter((key) => assistantSource(key, manifest[key]))
  if (eagerAssistant.length > 0) {
    throw new Error(`AssistantFeature graph leaked into eager assets: ${eagerAssistant.join(', ')}.`)
  }
  if (javascriptFiles.length === 0) throw new Error('AssistantFeature graph contains no JavaScript assets.')
  if (cssFiles.length === 0) throw new Error('AssistantFeature graph contains no assistant CSS assets.')

  for (const file of [...javascriptFiles, ...eagerJavascriptFiles]) {
    safeOutputPath(rootDirectory, file)
  }
  const [lazyAttribution, eagerAttribution] = await Promise.all([
    Promise.all(javascriptFiles.map((file) => readChunkAttribution(rootDirectory, file))),
    Promise.all(eagerJavascriptFiles.map((file) => readChunkAttribution(rootDirectory, file)))
  ])
  const eagerAttributedSources = eagerAttribution
    .flatMap(({ modules }) => modules)
    .map(({ source }) => source)
    .filter((source) => isAssistantSource(source) && !isAssistantTestSource(source))
  if (eagerAttributedSources.length > 0) {
    throw new Error(`Assistant source modules leaked into eager assets: ${eagerAttributedSources.join(', ')}.`)
  }
  const lazySources = new Set(
    lazyAttribution
      .flatMap(({ modules }) => modules)
      .map(({ source }) => source)
      .filter((source) => isAssistantSource(source) && !isAssistantTestSource(source))
  )
  const required = [
    ['adapter', (source) => /(?:^|\/)src\/assistant\/localAdapter\.ts$/.test(source)],
    ['corpus', (source) => /(?:^|\/)src\/content\/assistant-knowledge\.ts$/.test(source)],
    ['UI', (source) => /(?:^|\/)src\/components\/assistant\/AssistantFeature\.tsx$/.test(source)]
  ]
  for (const [label, predicate] of required) {
    if (![...lazySources].some(predicate)) {
      throw new Error(`Lazy graph is missing required assistant ${label} source attribution.`)
    }
  }

  const javascriptGzipBytes = await gzipTotal(rootDirectory, javascriptFiles)
  const cssGzipBytes = await gzipTotal(rootDirectory, cssFiles)
  if (javascriptGzipBytes > JAVASCRIPT_BUDGET) {
    throw new Error(`Assistant JavaScript gzip budget exceeded: ${javascriptGzipBytes} > ${JAVASCRIPT_BUDGET} bytes.`)
  }
  if (cssGzipBytes > CSS_BUDGET) {
    throw new Error(`Assistant CSS gzip budget exceeded: ${cssGzipBytes} > ${CSS_BUDGET} bytes.`)
  }
  return { javascriptGzipBytes, cssGzipBytes, javascriptFiles, cssFiles }
}

async function runCli() {
  const manifestPath = resolve(process.argv[2] ?? 'dist/.vite/manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const result = await measureAssistantAssets(manifest, {
    rootDirectory: resolve(dirname(manifestPath), '..')
  })
  console.log(
    `Assistant budget passed: JS ${result.javascriptGzipBytes}/${JAVASCRIPT_BUDGET} gzip bytes; CSS ${result.cssGzipBytes}/${CSS_BUDGET} gzip bytes.`
  )
  console.log(`Assistant JS: ${result.javascriptFiles.join(', ')}`)
  console.log(`Assistant CSS: ${result.cssFiles.join(', ')}`)
}

const isMain = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isMain) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
