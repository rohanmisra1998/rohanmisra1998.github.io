import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { afterEach } from 'node:test'
import { measureAssistantAssets } from './assistant-budget.mjs'

const temporaryDirectories = []

async function makeAssets(files) {
  const rootDirectory = await mkdtemp(join(tmpdir(), 'portfolio-assistant-budget-'))
  temporaryDirectories.push(rootDirectory)
  for (const [file, contents] of Object.entries(files)) {
    const output = join(rootDirectory, file)
    await mkdir(join(output, '..'), { recursive: true })
    await writeFile(output, contents)
  }
  return rootDirectory
}

function fixtureManifest(overrides = {}) {
  return {
    'index.html': {
      file: 'assets/main.js',
      src: 'index.html',
      isEntry: true,
      imports: ['_framework.js'],
      dynamicImports: ['src/components/assistant/AssistantFeature.tsx'],
      css: ['assets/base.css']
    },
    '_framework.js': { file: 'assets/framework.js' },
    'src/components/assistant/AssistantFeature.tsx': {
      file: 'assets/assistant.js',
      src: 'src/components/assistant/AssistantFeature.tsx',
      isDynamicEntry: true,
      imports: ['_framework.js', 'src/assistant/localAdapter.ts'],
      css: ['assets/assistant.css']
    },
    'src/assistant/localAdapter.ts': {
      file: 'assets/adapter.js',
      src: 'src/assistant/localAdapter.ts',
      imports: ['src/content/assistant-knowledge.ts']
    },
    'src/content/assistant-knowledge.ts': {
      file: 'assets/knowledge.js',
      src: 'src/content/assistant-knowledge.ts'
    },
    ...overrides
  }
}

async function makeViteFixture({ mainSources = ['../../src/App.tsx'], assistantSources } = {}) {
  const sources = assistantSources ?? [
    '../../src/content/assistant-knowledge.ts',
    '../../src/assistant/localAdapter.ts',
    '../../src/components/assistant/AskRohan.tsx',
    '../../src/components/assistant/AssistantFeature.tsx'
  ]
  const rootDirectory = await makeAssets({
    'assets/main.js': 'const app = true\n//# sourceMappingURL=main.js.map',
    'assets/main.js.map': JSON.stringify({
      version: 3,
      file: 'main.js',
      sources: mainSources,
      sourcesContent: mainSources.map(() => 'export const app = true'),
      names: [],
      mappings: ''
    }),
    'assets/assistant.js': 'const assistant = true\n//# sourceMappingURL=assistant.js.map',
    'assets/assistant.js.map': JSON.stringify({
      version: 3,
      file: 'assistant.js',
      sources,
      sourcesContent: sources.map(() => 'export const assistant = true'),
      names: [],
      mappings: ''
    }),
    'assets/base.css': 'body { margin: 0 }',
    'assets/assistant.css': '.assistant { display: block }'
  })
  const manifest = {
    'index.html': {
      file: 'assets/main.js',
      src: 'index.html',
      isEntry: true,
      dynamicImports: ['src/components/assistant/AssistantFeature.tsx'],
      css: ['assets/base.css']
    },
    'src/components/assistant/AssistantFeature.tsx': {
      file: 'assets/assistant.js',
      src: 'src/components/assistant/AssistantFeature.tsx',
      isDynamicEntry: true,
      css: ['assets/assistant.css']
    }
  }
  return { manifest, rootDirectory }
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  )
})

test('fails when the AssistantFeature dynamic entry is absent or leaks into the eager graph', async () => {
  const rootDirectory = await makeAssets({
    'assets/main.js': 'main entry',
    'assets/framework.js': 'shared react framework',
    'assets/base.css': 'body{}',
    'assets/assistant.js': 'assistant feature UI',
    'assets/adapter.js': 'local adapter',
    'assets/knowledge.js': 'assistant knowledge corpus',
    'assets/assistant.css': '.assistant{}'
  })
  const absent = fixtureManifest()
  delete absent['src/components/assistant/AssistantFeature.tsx']
  await assert.rejects(
    measureAssistantAssets(absent, { rootDirectory }),
    /AssistantFeature.*dynamic entry.*absent/i
  )

  const eager = fixtureManifest({
    'index.html': {
      ...fixtureManifest()['index.html'],
      imports: ['_framework.js', 'src/components/assistant/AssistantFeature.tsx']
    }
  })
  await assert.rejects(
    measureAssistantAssets(eager, { rootDirectory }),
    /AssistantFeature.*eager/i
  )
})

test('fails when assistant JavaScript or CSS exceeds its gzip budget', async () => {
  const noisy = Buffer.concat(
    Array.from({ length: 768 }, (_, index) => (
      createHash('sha256').update(`assistant-budget-${index}`).digest()
    ))
  )
  const { manifest, rootDirectory } = await makeViteFixture()
  await writeFile(
    join(rootDirectory, 'assets/assistant.js'),
    Buffer.concat([noisy, Buffer.from('\n//# sourceMappingURL=assistant.js.map')])
  )

  await assert.rejects(
    measureAssistantAssets(manifest, { rootDirectory }),
    /JavaScript gzip budget exceeded/i
  )

  await writeFile(
    join(rootDirectory, 'assets/assistant.js'),
    'small\n//# sourceMappingURL=assistant.js.map'
  )
  await writeFile(join(rootDirectory, 'assets/assistant.css'), noisy)
  await assert.rejects(
    measureAssistantAssets(manifest, { rootDirectory }),
    /CSS gzip budget exceeded/i
  )
})

test('rejects manifest asset paths that escape the production output directory', async () => {
  const rootDirectory = await makeAssets({
    'assets/main.js': 'main',
    'assets/framework.js': 'framework',
    'assets/base.css': 'body{}',
    'assets/assistant.css': '.assistant{}',
    'assets/adapter.js': 'adapter',
    'assets/knowledge.js': 'knowledge'
  })
  const manifest = fixtureManifest({
    'src/components/assistant/AssistantFeature.tsx': {
      ...fixtureManifest()['src/components/assistant/AssistantFeature.tsx'],
      file: '../outside.js'
    }
  })

  await assert.rejects(
    measureAssistantAssets(manifest, { rootDirectory }),
    /outside production output/i
  )
})

test('rejects adapter or corpus modules attributed to the eager main chunk', async () => {
  const { manifest, rootDirectory } = await makeViteFixture({
    mainSources: [
      '../../src/App.tsx',
      '../../src/content/assistant-knowledge.ts',
      '../../src/assistant/localAdapter.ts'
    ]
  })

  await assert.rejects(
    measureAssistantAssets(manifest, { rootDirectory }),
    /assistant source.*eager.*assistant-knowledge.*localAdapter/is
  )
})

test('requires adapter, corpus, and assistant UI attribution in the lazy chunk map', async () => {
  const cases = [
    [
      'adapter',
      [
        '../../src/content/assistant-knowledge.ts',
        '../../src/components/assistant/AskRohan.tsx',
        '../../src/components/assistant/AssistantFeature.tsx'
      ]
    ],
    [
      'corpus',
      [
        '../../src/assistant/localAdapter.ts',
        '../../src/components/assistant/AskRohan.tsx',
        '../../src/components/assistant/AssistantFeature.tsx'
      ]
    ],
    [
      'UI',
      [
        '../../src/content/assistant-knowledge.ts',
        '../../src/assistant/localAdapter.ts'
      ]
    ]
  ]

  for (const [label, assistantSources] of cases) {
    const { manifest, rootDirectory } = await makeViteFixture({ assistantSources })
    await assert.rejects(
      measureAssistantAssets(manifest, { rootDirectory }),
      new RegExp(`missing required assistant ${label}`, 'i')
    )
  }
})

test('measures a realistic Vite lazy chunk while excluding the eager main asset', async () => {
  const { manifest, rootDirectory } = await makeViteFixture()

  const result = await measureAssistantAssets(manifest, { rootDirectory })

  assert.deepEqual(result.javascriptFiles, ['assets/assistant.js'])
  assert.deepEqual(result.cssFiles, ['assets/assistant.css'])
})
