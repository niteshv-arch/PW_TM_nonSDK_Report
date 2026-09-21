// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit-report.xml', embedAnnotationsAsProperties: true, includeProjectInTestName: true }],
    ['./reporters/logs-reporter.js'],
  ],
  use: {
    baseURL: 'https://ecommbs-prod.vercel.app',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    // Playwright traces saved to logs/traces/ via logs-reporter.js
    trace: 'on',
    // HAR recorded per-test to test-results/<test>/network.har, then copied to logs/har/ by logs-reporter.js
    har: { outputPath: 'network.har', mode: 'minimal', urlFilter: '**' },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      //metadata: { device: 'Desktop Chrome', os: 'Windows', os_version: '11' },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      //metadata: { device: 'Desktop Firefox', os: 'Windows', os_version: '11' },
    },
    {
      name: 'pixel5',
      use: { ...devices['Pixel 5'] },
      //metadata: { device: 'Google Pixel 5', os: 'Android', os_version: '12' },
    },
    {
      name: 'iphone13',
      use: { ...devices['iPhone 13'] },
      //metadata: { device: 'Apple iPhone 13', os: 'iOS', os_version: '15' },
    },
  ],
});