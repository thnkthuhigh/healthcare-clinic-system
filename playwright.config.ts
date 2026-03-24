import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: path.join(__dirname, 'tests', 'e2e', 'specs'),
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  outputDir: path.join(__dirname, 'test-results', 'e2e'),
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: path.join(__dirname, 'playwright-report', 'e2e'),
        open: 'never',
      },
    ],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 1024 },
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
  globalSetup: path.join(__dirname, 'tests', 'e2e', 'global-setup.ts'),
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
