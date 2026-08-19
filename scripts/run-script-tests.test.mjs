import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const runner = fileURLToPath(new URL('./run-script-tests.mjs', import.meta.url))

test('script-test runner discovers tests and propagates a failing exit code', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-script-tests-'))

  try {
    await writeFile(
      join(directory, 'passing.test.mjs'),
      "import test from 'node:test'; test('passes', () => {});"
    )
    await execFileAsync(process.execPath, [runner, directory])

    await writeFile(
      join(directory, 'failing.test.mjs'),
      "import assert from 'node:assert/strict'; import test from 'node:test'; test('fails', () => assert.equal(1, 2));"
    )
    const result = await execFileAsync(process.execPath, [runner, directory]).then(
      ({ stdout, stderr }) => ({ code: 0, stdout, stderr }),
      (error) => ({ code: error.code, stdout: error.stdout, stderr: error.stderr })
    )
    assert.equal(result.code, 1, JSON.stringify(result))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
