import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:43917'
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'chromium-mobile',
      use: { browserName: 'chromium', isMobile: true, viewport: { width: 390, height: 844 } }
    }
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 43917 --strictPort',
    url: 'http://127.0.0.1:43917',
    reuseExistingServer: !process.env.CI
  }
})
