import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const read = (file) => fs.readFileSync(path.join(rootDir, file), 'utf8');

const ARABIC = /[؀-ۿ]/;

// These files used to render Arabic copy on /en. Their text now comes from
// src/messages, so any Arabic letter in their code is a regression.
const LOCALIZED_FILES = [
  'src/components/profile/ProfileCompletionRing.tsx',
  'src/components/profile/ProfileSaveContinueButton.tsx',
  'src/components/profile/ProfileSummaryCard.tsx',
  'src/components/ui/DeleteConfirmationModal.tsx',
  'src/features/auth/components/RoleGuard.tsx',
  'src/features/profile/api/avatar-api.ts',
  'src/features/profile/components/ProfilePageContent.tsx',
  'src/features/profile/components/PreferencesSection.tsx',
  'src/features/profile/hooks/useCountries.ts',
  'src/features/profile/schemas/avatar.schema.ts',
];

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

for (const file of LOCALIZED_FILES) {
  test(`${file} has no hardcoded Arabic copy`, () => {
    const offending = stripComments(read(file))
      .split('\n')
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      .filter(({ line }) => ARABIC.test(line));
    assert.deepEqual(offending, [], `Arabic text left in ${file}`);
  });
}

// These files used to show English copy on /ar.
const ENGLISH_LEFTOVERS = [
  [
    'src/features/profile/components/PreferencesSection.tsx',
    /Failed to load countries list|>\s*Retry\s*<|title="Remove"/,
  ],
  ['src/features/profile/components/SkillsAndLanguagesSection.tsx', /title="Remove"/],
  [
    'src/features/profile/components/ExperiencesAndActivitiesSection.tsx',
    /Please sign in again|>Loading\.\.\.</,
  ],
  ['src/features/profile/components/DocumentUploadRow.tsx', /title="Coming soon"/],
];

for (const [file, pattern] of ENGLISH_LEFTOVERS) {
  test(`${file} has no hardcoded English copy`, () => {
    assert.doesNotMatch(read(file), pattern);
  });
}

test('the delete dialog follows the active locale direction instead of forcing RTL', () => {
  assert.doesNotMatch(read('src/components/ui/DeleteConfirmationModal.tsx'), /dir="rtl"/);
  assert.doesNotMatch(read('src/components/profile/ProfileSummaryCard.tsx'), /dir="rtl"/);
});

test('new Profile, DeleteConfirmation and Common keys exist in both locales', () => {
  const flatten = (obj, prefix = '') =>
    Object.entries(obj).flatMap(([key, value]) =>
      value && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`]
    );
  const keys = (locale) => {
    const messages = JSON.parse(read(`src/messages/${locale}.json`));
    return new Set(
      flatten({
        Profile: messages.Profile,
        DeleteConfirmation: messages.DeleteConfirmation,
        Common: messages.Common,
        Preferences: { invalidCountryError: messages.Preferences.invalidCountryError },
      })
    );
  };
  const en = keys('en');
  const ar = keys('ar');
  assert.ok(en.has('Profile.steps.personal'));
  assert.ok(en.has('DeleteConfirmation.descriptions.document'));
  assert.ok(en.has('Common.checkingSession'));
  assert.ok(en.has('Preferences.invalidCountryError'));
  assert.deepEqual([...en].sort(), [...ar].sort());
});
