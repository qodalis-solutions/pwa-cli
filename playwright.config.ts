import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

/**
 * End-to-end tests run against the production build (`npm run build`), served
 * statically so the service worker behaves as it does when deployed.
 * `npm run screenshots` adds the `store` project, which writes the Google Play
 * and PWA screenshots instead of testing; `npm run intro-images` adds the
 * `intro-images` project, which writes the introduction's pictures.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : 3,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // Tests start at the terminal: the first-run introduction counts as seen (intro.spec.ts clears this).
    storageState: {
      cookies: [],
      origins: [{ origin: `http://localhost:${PORT}`, localStorage: [{ name: 'qcli.introSeen', value: '1' }] }],
    },
  },
  projects: [
    {
      name: 'phone',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    ...(process.env['INTRO_IMAGES']
      ? [
          {
            name: 'intro-images',
            testMatch: /intro\.images\.ts/,
            use: { ...devices['Pixel 7'] },
          },
        ]
      : []),
    ...(process.env['STORE_SCREENSHOTS']
      ? [
          {
            name: 'store',
            testMatch: /store\.screenshots\.ts/,
            use: { ...devices['Pixel 7'] },
          },
        ]
      : []),
  ],
  webServer: {
    command: `npx http-server dist/pwa-cli/browser -p ${PORT} -c-1 --silent`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
  },
});
