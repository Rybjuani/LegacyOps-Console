import { defineConfig } from '@playwright/test';

/**
 * Playwright config for screenshot capture.
 *
 * This is NOT part of the main CI `verify` job. Screenshots are captured
 * on demand via `pnpm screenshot:web`. See docs/UI_SCREENSHOTS.md.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5174',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    screenshot: 'off',
    trace: 'off'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ]
});
