import { defineConfig, devices } from '@playwright/test';
import { E2E_PORTS, E2E_URLS, isRemoteTarget } from './tests/e2e/support/env';

// Smoke tests for the student flow. See docs/e2e/README.md.
//
// Local mode (default): the tests start a fake backend and two production servers of the
// same build, one with the optional features ON and one with every flag OFF. Run them with
// `pnpm test:e2e`, which builds once first (tests/e2e/run.mjs).
//
// Remote mode (E2E_BASE_URL set): nothing is started and only specs tagged @readonly run.
const appEnv = (flags: boolean) => ({
  BACKEND_URL: E2E_URLS.fakeBackend,
  PROXY_SHARED_SECRET: '',
  NEXT_TELEMETRY_DISABLED: '1',
  SAVED_SCHOLARSHIPS_ENABLED: flags ? 'true' : '',
  TRACKING_ENABLED: flags ? 'true' : '',
  STUDENT_HOME_ENABLED: flags ? 'true' : '',
  SCHOLARSHIP_DETAILS_ENABLED: '',
  HOME_MOCK_SECTIONS: '',
});

const nextStart = (port: number) =>
  `node node_modules/next/dist/bin/next start -H 127.0.0.1 -p ${port}`;

export default defineConfig({
  testDir: './tests/e2e/specs',
  outputDir: './node_modules/.cache/e2e/test-results',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './node_modules/.cache/e2e/report' }],
  ],
  // No retries: a test that needs one is flaky and has to be fixed, not hidden.
  retries: 0,
  workers: Number(process.env.E2E_WORKERS ?? 2),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices['Desktop Chrome'],
    // Playwright's bundled Chromium by default; E2E_BROWSER_CHANNEL=msedge|chrome uses an installed browser.
    channel: process.env.E2E_BROWSER_CHANNEL || undefined,
    locale: 'en-US',
    timezoneId: 'UTC',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'flags-on',
      testIgnore: /flags-off\.spec\.ts/,
      grep: isRemoteTarget ? /@readonly/ : undefined,
      use: { baseURL: E2E_URLS.appFlagsOn },
    },
    // Remote mode has one environment, so the flags-off project only exists locally.
    ...(isRemoteTarget
      ? []
      : [
          {
            name: 'flags-off',
            testMatch: /flags-off\.spec\.ts/,
            use: { baseURL: E2E_URLS.appFlagsOff },
          },
        ]),
  ],
  webServer: isRemoteTarget
    ? undefined
    : [
        {
          command: 'node tests/e2e/fake-backend/server.mjs',
          env: { PORT: String(E2E_PORTS.fakeBackend) },
          url: `${E2E_URLS.fakeBackend}/health`,
          reuseExistingServer: false,
          timeout: 30_000,
        },
        {
          command: nextStart(E2E_PORTS.appFlagsOn),
          env: appEnv(true),
          url: `${E2E_URLS.appFlagsOn}/en/login`,
          reuseExistingServer: false,
          timeout: 120_000,
        },
        {
          command: nextStart(E2E_PORTS.appFlagsOff),
          env: appEnv(false),
          url: `${E2E_URLS.appFlagsOff}/en/login`,
          reuseExistingServer: false,
          timeout: 120_000,
        },
      ],
});
