import assert from 'node:assert/strict';
import fs from 'node:fs';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadSrc } from './helpers/load-src.mjs';

const { featureFlags } = loadSrc('lib/feature-flags.ts');

// FE-12 flags: the report dialog and the eligibility indicator stay off until
// their endpoints are accepted against a real session (and, for the personal
// match, until the backend provides it).
const FLAGS = [
  ['scholarshipReportsEnabled', 'SCHOLARSHIP_REPORTS_ENABLED'],
  ['scholarshipEligibilityEnabled', 'SCHOLARSHIP_ELIGIBILITY_ENABLED'],
];

const saved = Object.fromEntries(FLAGS.map(([, name]) => [name, process.env[name]]));
afterEach(() => {
  for (const [name, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

for (const [key, name] of FLAGS) {
  test(`${name} is off when unset`, () => {
    delete process.env[name];
    assert.equal(featureFlags[key], false);
  });

  test(`${name} is on only for the literal string "true"`, () => {
    for (const value of ['', 'false', '0', '1', 'TRUE', 'True', 'yes', ' true', 'true ']) {
      process.env[name] = value;
      assert.equal(featureFlags[key], false, JSON.stringify(value));
    }
    process.env[name] = 'true';
    assert.equal(featureFlags[key], true);
  });

  test(`${name} is server-only and ships empty in .env.example`, () => {
    const source = fs.readFileSync(
      fileURLToPath(new URL('../src/lib/feature-flags.ts', import.meta.url)),
      'utf8'
    );
    assert.equal(source.includes(`NEXT_PUBLIC_${name}`), false);
    const example = fs.readFileSync(
      fileURLToPath(new URL('../.env.example', import.meta.url)),
      'utf8'
    );
    assert.match(example, new RegExp(`^${name}=\\s*$`, 'm'));
  });
}

test('the route passes the flags down and nothing else decides them', () => {
  const route = fs.readFileSync(
    fileURLToPath(
      new URL('../src/app/[locale]/student/scholarships/[id]/page.tsx', import.meta.url)
    ),
    'utf8'
  );
  assert.match(route, /reportEnabled=\{featureFlags\.scholarshipReportsEnabled\}/);
  assert.match(route, /eligibilityEnabled=\{featureFlags\.scholarshipEligibilityEnabled\}/);
  assert.match(route, /trackingEnabled=\{featureFlags\.trackingEnabled\}/);
});
