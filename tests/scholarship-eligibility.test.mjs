import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { loadSrc } from './helpers/load-src.mjs';

const { parseScholarshipEligibility, EligibilityContractError, ELIGIBILITY_CODES } = loadSrc(
  'features/student/scholarship-details/lib/eligibility-adapter.ts'
);
const { getScholarshipEligibility } = loadSrc(
  'features/student/scholarship-details/api/eligibility.ts'
);

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

// Shaped like the live ScholarshipEligibilityResponse (openapi.live.json).
const full = () => ({
  id: 564,
  title: 'YTB',
  extracted_deadline: '2026-08-28',
  allowed_nationalities: ['Egypt', 'Jordan'],
  target_degree_levels: ['master', 'phd'],
  allowed_gender: 'female',
  target_residencies: ['Türkiye'],
  min_gpa_percentage: 70.5,
  max_age: 30,
  allowed_fields_of_study: ['Medicine', 'Engineering'],
  required_languages: ['English'],
  funding_type: 'full',
  is_req_experience: false,
  is_Softskills_required: true,
  required_documents: ['CV'],
});
const nulls = () => Object.fromEntries(Object.keys(full()).map((key) => [key, null]));

test('the codes are stable and ordered', () => {
  assert.deepEqual(ELIGIBILITY_CODES, [
    'nationality',
    'degreeLevel',
    'gender',
    'residency',
    'fieldOfStudy',
    'language',
    'minGpa',
    'maxAge',
    'experience',
    'softSkills',
  ]);
});

test('a full payload becomes criteria with codes, never sentences', () => {
  const { criteria, unknownCount } = parseScholarshipEligibility(full());
  assert.equal(unknownCount, 0);
  assert.deepEqual(
    criteria.map((criterion) => criterion.code),
    [...ELIGIBILITY_CODES]
  );
  const by = (code) => criteria.find((criterion) => criterion.code === code);
  assert.deepEqual(by('nationality'), {
    code: 'nationality',
    kind: 'list',
    values: ['Egypt', 'Jordan'],
  });
  assert.deepEqual(by('degreeLevel'), {
    code: 'degreeLevel',
    kind: 'levels',
    values: ['master', 'phd'],
  });
  assert.deepEqual(by('gender'), { code: 'gender', kind: 'gender', value: 'female' });
  assert.deepEqual(by('minGpa'), { code: 'minGpa', kind: 'percent', value: 70.5 });
  assert.deepEqual(by('maxAge'), { code: 'maxAge', kind: 'years', value: 30 });
  assert.deepEqual(by('experience'), { code: 'experience', kind: 'flag', required: false });
  assert.deepEqual(by('softSkills'), { code: 'softSkills', kind: 'flag', required: true });
});

test('null means unknown: no criterion, counted as unspecified', () => {
  const { criteria, unknownCount } = parseScholarshipEligibility(nulls());
  assert.deepEqual(criteria, []);
  assert.equal(unknownCount, ELIGIBILITY_CODES.length);
});

test('missing keys are unknown too', () => {
  const result = parseScholarshipEligibility({ id: 1, title: 'T' });
  assert.deepEqual(result.criteria, []);
  assert.equal(result.unknownCount, 10);
});

test('false, zero and empty arrays are preserved as known answers', () => {
  const { criteria, unknownCount } = parseScholarshipEligibility({
    ...nulls(),
    allowed_nationalities: [],
    min_gpa_percentage: 0,
    max_age: 0,
    is_req_experience: false,
    is_Softskills_required: false,
  });
  const by = (code) => criteria.find((criterion) => criterion.code === code);
  assert.deepEqual(by('nationality'), { code: 'nationality', kind: 'list', values: [] });
  assert.deepEqual(by('minGpa'), { code: 'minGpa', kind: 'percent', value: 0 });
  assert.deepEqual(by('maxAge'), { code: 'maxAge', kind: 'years', value: 0 });
  assert.equal(by('experience').required, false);
  assert.equal(by('softSkills').required, false);
  assert.equal(unknownCount, 5);
});

test('wrongly typed values are unknown, never an error', () => {
  const { criteria, unknownCount } = parseScholarshipEligibility({
    ...full(),
    allowed_nationalities: 5,
    min_gpa_percentage: '70',
    max_age: 'thirty',
    is_req_experience: 'yes',
    allowed_gender: 3,
    target_degree_levels: [null, 4],
  });
  const codes = criteria.map((criterion) => criterion.code);
  for (const code of ['nationality', 'minGpa', 'maxAge', 'experience', 'gender']) {
    assert.equal(codes.includes(code), false, code);
  }
  // A list with no readable item is an empty list, a known "no restriction".
  assert.deepEqual(
    criteria.find((criterion) => criterion.code === 'degreeLevel'),
    { code: 'degreeLevel', kind: 'levels', values: [] }
  );
  assert.equal(unknownCount, 5);
});

test('a string list is read as one list; blank items are dropped', () => {
  const { criteria } = parseScholarshipEligibility({
    ...nulls(),
    allowed_fields_of_study: 'Medicine\nLaw\n\n',
    required_languages: ['English', '  ', 'Arabic'],
  });
  const by = (code) => criteria.find((criterion) => criterion.code === code);
  assert.deepEqual(by('fieldOfStudy').values, ['Medicine', 'Law']);
  assert.deepEqual(by('language').values, ['English', 'Arabic']);
});

test('a negative or non-finite number is unknown', () => {
  const { criteria } = parseScholarshipEligibility({
    ...nulls(),
    min_gpa_percentage: -5,
    max_age: -1,
  });
  assert.deepEqual(criteria, []);
});

test('a payload that is not an object is a contract error', () => {
  for (const raw of [null, 'x', 5, []]) {
    assert.throws(
      () => parseScholarshipEligibility(raw),
      (error) => error instanceof EligibilityContractError,
      JSON.stringify(raw)
    );
  }
});

test('GET reads /api/scholarships/{id}/eligibility', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(full()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const result = await getScholarshipEligibility(564);
  assert.ok(calls[0].url.endsWith('/api/scholarships/564/eligibility'));
  assert.equal(result.criteria.length, 10);
  await assert.rejects(() => getScholarshipEligibility(0));
  assert.equal(calls.length, 1);
});
