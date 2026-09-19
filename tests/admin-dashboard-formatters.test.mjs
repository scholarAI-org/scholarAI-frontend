import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);

loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

const feature = fileURLToPath(new URL('../src/features/admin/dashboard', import.meta.url));
const {
  formatDashboardDate,
  formatDashboardNumber,
  getDeadlinePresentation,
  getDisplayableDashboardText,
  getSafeExternalUrl,
  getSourceDomain,
} = loadModule(path.join(feature, 'lib/formatters.ts'));

test('formats finite numbers with the supplied locale and rejects invalid values', () => {
  assert.equal(formatDashboardNumber(1234, 'en-US'), '1,234');
  assert.equal(formatDashboardNumber(Number.NaN, 'en-US'), null);
  assert.equal(formatDashboardNumber(null, 'ar'), null);
});

test('returns null for absent or invalid dates', () => {
  assert.equal(formatDashboardDate(null, 'en-US'), null);
  assert.equal(formatDashboardDate('not-a-date', 'en-US'), null);
  assert.notEqual(formatDashboardDate('2026-09-17T12:00:00Z', 'ar'), null);
});

test('gives no_deadline precedence over any supplied deadline', () => {
  assert.deepEqual(getDeadlinePresentation('2026-12-31', true, 'en-US'), {
    kind: 'no-deadline',
  });
  assert.deepEqual(getDeadlinePresentation(null, false, 'en-US'), { kind: 'unavailable' });
  assert.equal(getDeadlinePresentation('2026-12-31', false, 'en-US').kind, 'date');
});

test('accepts only safe external HTTP(S) URLs and extracts their domain', () => {
  assert.equal(getSafeExternalUrl(null), null);
  assert.equal(getSafeExternalUrl('not a url'), null);
  assert.equal(getSafeExternalUrl('javascript:alert(1)'), null);
  assert.equal(getSourceDomain('https://example.org/path?q=1'), 'example.org');
});

test('normalizes nullable or blank status and action values without UI copy', () => {
  assert.equal(getDisplayableDashboardText(null), null);
  assert.equal(getDisplayableDashboardText('   '), null);
  assert.equal(getDisplayableDashboardText('approved'), 'approved');
});
