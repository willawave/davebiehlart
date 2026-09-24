import { defineConfig, devices } from '@playwright/test';

// Neither app initializes Firebase yet, so the dev servers need no backend. Once they
// do, wrap `pnpm e2e` in `firebase emulators:exec --project demo-bronze-horse-e2e` so
// E2E runs can never reach the production project.
const WEB_URL = 'http://localhost:4200';
const ADMIN_URL = 'http://localhost:4201';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'web',
      testDir: 'e2e/web',
      use: { ...devices['Desktop Chrome'], baseURL: WEB_URL },
    },
    {
      name: 'admin',
      testDir: 'e2e/admin',
      use: { ...devices['Desktop Chrome'], baseURL: ADMIN_URL },
    },
  ],
  webServer: [
    {
      command: 'pnpm ng serve web --port 4200',
      url: WEB_URL,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
    {
      command: 'pnpm ng serve admin --port 4201',
      url: ADMIN_URL,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
  ],
});
