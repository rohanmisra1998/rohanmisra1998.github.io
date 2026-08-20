import { defineConfig } from '@playwright/test'

const productionUrl = 'http://127.0.0.1:43918'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'production-csp.spec.ts',
  use: {
    baseURL: productionUrl,
    viewport: { width: 1440, height: 900 }
  },
  projects: [
    {
      name: 'chromium-production',
      use: { browserName: 'chromium' }
    }
  ],
  webServer: {
    command: 'npm run preview:dist -- --host 127.0.0.1 --port 43918 --strictPort',
    url: productionUrl,
    reuseExistingServer: false
  }
})
