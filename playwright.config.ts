/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 1 : 0,
  workers: IS_CI ? 1 : undefined,
  reporter: IS_CI
    ? [['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    // QA debug bundle: capture video, trace, and a final screenshot for EVERY test
    // (not just failures). Heavier disk footprint, but the team can replay any
    // scenario from playwright-report/. Tighten back to 'retain-on-failure'
    // before merging to develop if the artefact size becomes a problem.
    trace: 'on',
    video: 'on',
    screenshot: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
