import { defineConfig, devices } from '@playwright/test';

// Run through `pnpm e2e`, which wraps this in `firebase emulators:exec --project
// demo-bronze-horse --import ./emulator-data`. The project must match
// EMULATOR_FIREBASE_ENVIRONMENT's projectId, because firebase.json sets singleProjectMode.
// ADMIN_PORT must match the admin serve port in angular.json.
const WEB_PORT = 4200;
const ADMIN_PORT = 4201;
const WEB_URL = `http://localhost:${WEB_PORT}`;
const ADMIN_URL = `http://localhost:${ADMIN_PORT}`;

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  // The admin sign-in popup loads gapi from apis.google.com, which occasionally stalls.
  retries: process.env['CI'] ? 2 : 0,
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
      command: `pnpm ng serve web --port ${WEB_PORT}`,
      url: WEB_URL,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
    {
      command: `pnpm ng serve admin --port ${ADMIN_PORT}`,
      url: ADMIN_URL,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
  ],
});
