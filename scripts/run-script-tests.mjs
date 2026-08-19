import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const defaultDirectory = fileURLToPath(new URL('.', import.meta.url))
const testDirectory = resolve(process.argv[2] ?? defaultDirectory)
const entries = await readdir(testDirectory, { withFileTypes: true })
const testFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.test.mjs'))
  .map((entry) => resolve(testDirectory, entry.name))
  .sort((left, right) => left.localeCompare(right))
const { NODE_TEST_CONTEXT: _nodeTestContext, ...childEnvironment } = process.env

if (testFiles.length === 0) {
  console.error(`No script tests found in ${testDirectory}`)
  process.exitCode = 1
} else {
  let aggregateExitCode = 0
  for (const testFile of testFiles) {
    const exitCode = await new Promise((resolveExitCode, reject) => {
      const child = spawn(process.execPath, ['--test', testFile], {
        env: childEnvironment,
        shell: false,
        stdio: 'inherit',
        windowsHide: true
      })
      child.once('error', reject)
      child.once('exit', (code) => resolveExitCode(code ?? 1))
    })
    if (exitCode !== 0) aggregateExitCode = exitCode
  }
  process.exitCode = aggregateExitCode
}
