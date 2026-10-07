import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { IntlMessageFormat } from 'intl-messageformat';
import { createFormatter, createTranslator } from 'next-intl';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);

loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

const srcPath = fileURLToPath(new URL('../src', import.meta.url));
const { NUMBERING_SYSTEM, intlFormats, toFormattingLocale } = loadModule(
  path.join(srcPath, 'i18n/formatting.ts')
);
const { formatDashboardDate, formatDashboardNumber } = loadModule(
  path.join(srcPath, 'features/admin/dashboard/lib/formatters.ts')
);
const { formatDateTime } = loadModule(
  path.join(srcPath, 'features/admin/scholarship-review/lib/formatters.ts')
);
const ar = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/ar.json'), 'utf8'));

const ARABIC_INDIC = /[٠-٩۰-۹]/;
const assertLatin = (value, label) => {
  assert.equal(typeof value, 'string', label);
  assert.match(value, /[0-9]/, `${label}: no digits in "${value}"`);
  assert.equal(ARABIC_INDIC.test(value), false, `${label}: Arabic-Indic digits in "${value}"`);
};

test('the formatting locale pins Latin digits, and the runtime honours the extension', () => {
  assert.equal(NUMBERING_SYSTEM, 'latn');
  assert.equal(toFormattingLocale('ar'), 'ar-u-nu-latn');
  assert.equal(
    new Intl.NumberFormat(toFormattingLocale('ar')).resolvedOptions().numberingSystem,
    'latn'
  );
  // Control: the same runtime switches to Arabic-Indic when asked, so the pin is what decides.
  assert.match(new Intl.NumberFormat('ar-u-nu-arab').format(3), ARABIC_INDIC);
});

test('/ar plurals render Latin digits through next-intl with the app formats', () => {
  const t = createTranslator({ locale: 'ar', messages: ar, formats: intlFormats });
  const results = (count) => t('StudentScholarshipDiscovery.results.count', { count });
  assert.equal(results(0), 'لا توجد منح');
  assert.equal(results(3), '3 منح');
  assert.equal(results(12), '12 منحة');
  assertLatin(results(1234), 'plural with grouping');
  assertLatin(t('StudentScholarshipDiscovery.card.daysLeft', { count: 5 }), 'daysLeft');

  // Control: the digits come from the named format, not the runtime's `ar` default.
  const arab = createTranslator({
    locale: 'ar',
    messages: ar,
    formats: { number: { integer: { numberingSystem: 'arab' } } },
  });
  assert.equal(arab('StudentScholarshipDiscovery.results.count', { count: 3 }), '٣ منح');
});

test('plural `#` renders Latin digits with the pinned IntlMessageFormat locale', () => {
  const pound = '{count, plural, few {# منح} other {# منحة}}';
  assertLatin(new IntlMessageFormat(pound, toFormattingLocale('ar')).format({ count: 3 }), '#');
});

test('/ar plain arguments render Latin digits', () => {
  const t = createTranslator({ locale: 'ar', messages: ar, formats: intlFormats });
  assert.equal(t('StudentScholarshipDiscovery.pagination.page', { page: 3 }), 'الصفحة 3');
});

test('/ar numbers and dates render Latin digits', () => {
  const format = createFormatter({ locale: 'ar', formats: intlFormats, timeZone: 'UTC' });
  assertLatin(format.number(1234, 'integer'), 'next-intl number');
  assertLatin(format.dateTime(new Date(Date.UTC(2026, 11, 31)), 'medium'), 'next-intl date');
  assertLatin(formatDashboardNumber(1234, 'ar'), 'admin dashboard number');
  assertLatin(formatDashboardDate('2026-12-31T12:00:00Z', 'ar'), 'admin dashboard date');
  assertLatin(formatDateTime('2026-12-31T12:00:00Z', 'ar'), 'admin review date-time');
});

test('student messages never use `#`, which next-intl cannot pin', () => {
  for (const namespace of [
    'StudentLayout',
    'StudentScholarshipDiscovery',
    'StudentScholarshipDetails',
    'StudentSavedScholarships',
  ]) {
    assert.equal(JSON.stringify(ar[namespace]).includes('#'), false, namespace);
  }
});
