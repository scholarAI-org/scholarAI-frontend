import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { loadSrc, read, rootPath, withEnv } from './helpers/notifications-harness.mjs';

// Feature 011: Student Notifications. Pure logic, adapter, registry, copy, flag and guards.
// The rendered markup and the shell wiring are in student-notifications-ui.test.mjs.

const { featureFlags } = loadSrc('lib/feature-flags.ts');

// ----------------------------- flag (FR-003, FR-004) -----------------------

test('flag: NOTIFICATIONS_ENABLED is off when unset and only the literal "true" turns it on', () => {
  withEnv({ NOTIFICATIONS_ENABLED: undefined }, () =>
    assert.equal(featureFlags.notificationsEnabled, false)
  );
  for (const value of ['', 'false', '0', '1', 'yes', 'TRUE', 'True', ' true', 'true ', 'on']) {
    withEnv({ NOTIFICATIONS_ENABLED: value }, () =>
      assert.equal(featureFlags.notificationsEnabled, false, `value=${JSON.stringify(value)}`)
    );
  }
  withEnv({ NOTIFICATIONS_ENABLED: 'true' }, () =>
    assert.equal(featureFlags.notificationsEnabled, true)
  );
});

test('flag: it is read on every access, server-side only, never NEXT_PUBLIC_ and never default-true', () => {
  const flags = read('src/lib/feature-flags.ts');
  assert.match(flags, /process\.env\.NOTIFICATIONS_ENABLED === 'true'/);
  assert.doesNotMatch(flags, /NEXT_PUBLIC_NOTIFICATIONS/);
  assert.doesNotMatch(flags, /NOTIFICATIONS_ENABLED[^\n]*\|\|\s*true/);
  // A getter: flipping process.env between two reads changes the answer.
  withEnv({ NOTIFICATIONS_ENABLED: 'true' }, () =>
    assert.equal(featureFlags.notificationsEnabled, true)
  );
  withEnv({ NOTIFICATIONS_ENABLED: undefined }, () =>
    assert.equal(featureFlags.notificationsEnabled, false)
  );
  assert.doesNotMatch(read('.env.example'), /NEXT_PUBLIC_NOTIFICATIONS/);
});

test('flag: .env.example documents NOTIFICATIONS_ENABLED empty (off)', () => {
  assert.match(read('.env.example'), /^NOTIFICATIONS_ENABLED=\s*$/m);
});

test('flag: NOTIFICATIONS_ENABLED is turned on only in the e2e config', () => {
  // Nothing that ships or deploys may carry the flag: the e2e config enables it for the
  // flags-on server only, .env.example documents it empty and feature-flags.ts reads it.
  const skip = new Set([
    'node_modules',
    '.next',
    '.git',
    'tests',
    'specs',
    'docs',
    '.specify',
    '.claude',
  ]);
  const walk = (directory) =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      if (skip.has(entry.name) || /^\.env.*\.local$|^\.env\.local$/.test(entry.name)) return [];
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
  const carrying = walk(rootPath)
    .filter((file) => !/\.(png|jpe?g|webp|svg|ico|woff2?|lock|yaml)$/.test(file))
    .filter((file) => fs.readFileSync(file, 'utf8').includes('NOTIFICATIONS_ENABLED'))
    .map((file) => path.relative(rootPath, file).replaceAll('\\', '/'))
    .sort();
  assert.deepEqual(carrying, ['.env.example', 'playwright.config.ts', 'src/lib/feature-flags.ts']);

  const playwrightConfig = read('playwright.config.ts');
  assert.match(playwrightConfig, /NOTIFICATIONS_ENABLED: flags \? 'true' : ''/);
});
