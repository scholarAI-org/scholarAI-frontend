// Entry point for `pnpm test:e2e`: make sure a production build exists, then run Playwright.
// The build is reused between runs; set E2E_REBUILD=1 after changing application code.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const nextBin = 'node_modules/next/dist/bin/next';
const playwrightBin = 'node_modules/@playwright/test/cli.js';
const remote = Boolean(process.env.E2E_BASE_URL);

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!remote && (process.env.E2E_REBUILD === '1' || !existsSync('.next/BUILD_ID'))) {
  console.log('[e2e] building the app (reused on the next run; E2E_REBUILD=1 forces a rebuild)');
  run([nextBin, 'build']);
}

run([playwrightBin, 'test', ...process.argv.slice(2)]);
