import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://127.0.0.1:${PORT}`

/**
 * E2E runs against a production build (PRD 14.3: measure production, not dev).
 * The Catalog Service is stubbed at the network layer inside each spec, so the
 * suite needs no backend and no database.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],

  webServer: {
    // `--host 127.0.0.1` matters: preview binds to localhost by default, which
    // does not always resolve to the address Playwright polls.
    command: `npm run build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: BASE_URL,
    // Never reuse: the command bakes a fresh `npm run build`, so a reused
    // server would silently test a stale bundle.
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
