import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const workflowPath = fileURLToPath(
  new URL('../.github/workflows/deploy-pages.yml', import.meta.url)
)

test('rebuilds the repository-specific Pages artifact after verification', async () => {
  const workflow = await readFile(workflowPath, 'utf8')
  const verifyStep = workflow.indexOf('- run: npm run verify')
  const finalBuildStep = workflow.lastIndexOf('- run: npm run build')
  const uploadStep = workflow.indexOf('- uses: actions/upload-pages-artifact@v3')

  assert.notEqual(verifyStep, -1, 'the exact verification gate must remain present')
  assert.notEqual(uploadStep, -1, 'the Pages artifact upload step must remain present')
  assert.ok(
    finalBuildStep > verifyStep,
    'a final repository-specific build must run after verification rewrites dist'
  )
  assert.ok(
    finalBuildStep < uploadStep,
    'the final repository-specific build must finish before dist is uploaded'
  )
})

test('preserves transient Playwright diffs when verification fails', async () => {
  const workflow = await readFile(workflowPath, 'utf8')
  const verifyStep = workflow.indexOf('- run: npm run verify')
  const workflowSteps = workflow.split(/\r?\n(?=      - )/)
  const failureUploadStep = workflowSteps.find((step) => (
    step.includes('uses: actions/upload-artifact@v4')
  ))

  assert.notEqual(verifyStep, -1, 'the exact verification gate must remain present')
  assert.ok(failureUploadStep, 'a Playwright failure-artifact upload step must be present')
  assert.ok(
    workflow.indexOf(failureUploadStep) > verifyStep,
    'the failure-artifact upload must run after verification creates test-results'
  )
  assert.match(failureUploadStep, /^\s*if: failure\(\)$/m)
  assert.match(failureUploadStep, /^\s*path: test-results\s*$/m)
  assert.match(failureUploadStep, /^\s*retention-days: 7\s*$/m)
  assert.match(failureUploadStep, /^\s*name: .+\$\{\{ github\.run_id \}\}.+$/m)
})

test('keeps the reviewed Pages deployment guardrails', async () => {
  const workflow = await readFile(workflowPath, 'utf8')

  assert.match(workflow, /runs-on: windows-latest/)
  assert.match(workflow, /permissions:\s+contents: read\s+pages: write\s+id-token: write/)
  assert.match(workflow, /environment:\s+name: github-pages/)
  assert.match(workflow, /concurrency:\s+group: pages\s+cancel-in-progress: true/)
  assert.doesNotMatch(workflow, /update-snapshots|toHaveScreenshot\([^)]*threshold/)
})
