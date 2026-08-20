import { readFile } from 'node:fs/promises'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'

export const ASSISTANT_ENTRY = 'src/components/assistant/AssistantFeature.tsx'

export function normalizedSource(value = '') {
  return value.replaceAll('\\', '/')
}

export function isAssistantSource(source) {
  const normalized = normalizedSource(source)
  return /(?:^|\/)src\/assistant\//.test(normalized)
    || /(?:^|\/)src\/components\/assistant\//.test(normalized)
    || /(?:^|\/)src\/content\/assistant-knowledge\.ts$/.test(normalized)
    || /(?:^|\/)src\/styles\/assistant\.css$/.test(normalized)
}

export function isAssistantTestSource(source) {
  return /\.(?:test|spec)\.[^/]+$/i.test(normalizedSource(source))
}

export function safeOutputPath(rootDirectory, asset) {
  const root = resolve(rootDirectory)
  const output = resolve(root, asset)
  const pathFromRoot = relative(root, output)
  if (
    pathFromRoot === '..'
    || pathFromRoot.startsWith(`..\\`)
    || pathFromRoot.startsWith('../')
    || isAbsolute(pathFromRoot)
  ) {
    throw new Error(`Manifest asset resolves outside production output: ${asset}.`)
  }
  return output
}

function traverse(manifest, initialKeys) {
  const visited = new Set()
  const pending = [...initialKeys]
  while (pending.length > 0) {
    const key = pending.pop()
    if (visited.has(key)) continue
    const record = manifest[key]
    if (!record) throw new Error(`Manifest references missing chunk: ${key}.`)
    visited.add(key)
    pending.push(...(record.imports ?? []))
  }
  return visited
}

export function resolveAssistantGraph(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Vite manifest must be a JSON object.')
  }
  const entryMatches = Object.entries(manifest).filter(([key, record]) => (
    normalizedSource(record?.src ?? key) === ASSISTANT_ENTRY
    && record?.isDynamicEntry === true
  ))
  if (entryMatches.length !== 1) {
    throw new Error(`AssistantFeature dynamic entry is absent or ambiguous; found ${entryMatches.length}.`)
  }
  const [assistantEntryKey] = entryMatches[0]
  const eagerEntries = Object.entries(manifest)
    .filter(([, record]) => record?.isEntry === true)
    .map(([key]) => key)
  if (eagerEntries.length === 0) throw new Error('Manifest has no eager application entry.')
  const eagerGraph = traverse(manifest, eagerEntries)
  const assistantGraph = traverse(manifest, [assistantEntryKey])
  const exclusiveGraph = new Set([...assistantGraph].filter((key) => !eagerGraph.has(key)))
  const eagerCss = new Set([...eagerGraph].flatMap((key) => manifest[key].css ?? []))
  const javascriptFiles = [...new Set(
    [...exclusiveGraph]
      .map((key) => manifest[key].file)
      .filter((file) => typeof file === 'string' && ['.js', '.mjs'].includes(extname(file)))
  )].sort()
  const eagerJavascriptFiles = [...new Set(
    [...eagerGraph]
      .map((key) => manifest[key].file)
      .filter((file) => typeof file === 'string' && ['.js', '.mjs'].includes(extname(file)))
  )].sort()
  const cssFiles = [...new Set(
    [...exclusiveGraph]
      .flatMap((key) => manifest[key].css ?? [])
      .filter((file) => !eagerCss.has(file))
  )].sort()
  return {
    assistantEntryKey,
    eagerGraph,
    exclusiveGraph,
    javascriptFiles,
    eagerJavascriptFiles,
    cssFiles
  }
}

function sourceMapReference(chunkContents) {
  const matches = [...chunkContents.matchAll(/(?:\/\/[#@]|\/\*[#@])\s*sourceMappingURL=([^\s*]+)(?:\s*\*\/)?/g)]
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one external source map reference; found ${matches.length}.`)
  }
  const reference = matches[0][1]
  if (/^(?:data:|[a-z][a-z+.-]*:|\/)/i.test(reference)) {
    throw new Error('Source map reference must be a relative production asset.')
  }
  return reference
}

export async function readChunkAttribution(rootDirectory, file) {
  const filePath = safeOutputPath(rootDirectory, file)
  const chunkContents = await readFile(filePath, 'utf8')
  const reference = sourceMapReference(chunkContents)
  const mapPath = safeOutputPath(
    rootDirectory,
    relative(resolve(rootDirectory), resolve(dirname(filePath), reference))
  )
  let sourceMap
  try {
    sourceMap = JSON.parse(await readFile(mapPath, 'utf8'))
  } catch (error) {
    throw new Error(`Unable to read source map for ${file}: ${error instanceof Error ? error.message : error}`)
  }
  if (!Array.isArray(sourceMap.sources) || !Array.isArray(sourceMap.sourcesContent)) {
    throw new Error(`Source map for ${file} must contain sources and sourcesContent arrays.`)
  }
  if (sourceMap.sources.length !== sourceMap.sourcesContent.length) {
    throw new Error(`Source map for ${file} has unaligned sources and sourcesContent.`)
  }
  const modules = sourceMap.sources.map((source, index) => ({
    source: normalizedSource(String(source)),
    content: sourceMap.sourcesContent[index]
  }))
  return { file, filePath, mapPath, chunkContents, modules }
}
