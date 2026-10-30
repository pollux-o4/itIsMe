import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'output/playwright', open: 'never' }]],
  outputDir: 'output/test-results',
  use: {
    baseURL: 'http://127.0.0.1:4323/itIsMe/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    ...[320, 390, 1024, 1440].map(width => ({
      name: `chromium-${width}`,
      use: { browserName: 'chromium' as const, viewport: { width, height: 900 } },
    })),
    { name: 'webkit-mobile', use: { browserName: 'webkit', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'firefox-desktop', use: { browserName: 'firefox', viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'pnpm exec astro preview --host 127.0.0.1 --port 4323 --ignore-lock',
    url: 'http://127.0.0.1:4323/itIsMe/',
    reuseExistingServer: false,
  },
});
