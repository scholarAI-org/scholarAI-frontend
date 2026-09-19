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

const featurePath = fileURLToPath(new URL('../src/features/admin/manual-scholarship', import.meta.url));

const {
  toOptionalTrimmedString,
  toTrimmedLines,
  normalizeDeadline,
  toManualScholarshipCreatePayload,
} = loadModule(path.join(featurePath, 'lib/normalizers.ts'));

const { createManualScholarshipSchema } = loadModule(path.join(featurePath, 'schemas/manual-scholarship.schema.ts'));

test('toOptionalTrimmedString normalizes null, undefined, blank and valid strings', () => {
  assert.equal(toOptionalTrimmedString(null), null);
  assert.equal(toOptionalTrimmedString(undefined), null);
  assert.equal(toOptionalTrimmedString('   '), null);
  assert.equal(toOptionalTrimmedString('  Harvard University  '), 'Harvard University');
});

test('toTrimmedLines splits multiline strings, trims lines, and filters empty lines', () => {
  assert.equal(toTrimmedLines(null), null);
  assert.equal(toTrimmedLines('   \n  \n'), null);
  assert.deepEqual(toTrimmedLines(' Computer Science \n \n  Data Science \n '), [
    'Computer Science',
    'Data Science',
  ]);
});

test('normalizeDeadline clears deadline when no_deadline is true', () => {
  assert.equal(normalizeDeadline(true, '2026-12-31'), null);
  assert.equal(normalizeDeadline(false, '2026-12-31 '), '2026-12-31');
  assert.equal(normalizeDeadline(false, '   '), null);
});

test('toManualScholarshipCreatePayload constructs valid payload with ingestion_type manual', () => {
  const formValues = {
    title_ar: 'منحة تركيا  ',
    title_en: '  Turkiye Scholarship',
    organization_name: '  Government of Turkiye',
    country: 'Turkiye ',
    university_name: ' Istanbul University ',
    study_level: 'Bachelor',
    funding_type: 'Full',
    funding_amount: ' 1000 USD ',
    deadline: '2026-12-31',
    no_deadline: false,
    majors: 'Engineering\nMedicine',
    language_requirements: 'English B2',
    eligibility_criteria: 'GPA 3.0+',
    required_documents: 'Passport\nTranscript',
    apply_link: ' https://turkiyeburslari.gov.tr/apply ',
    image_url: ' https://example.org/photo.jpg ',
    source_url: ' https://example.org/source ',
    description_html: ' Full scholarship coverage ',
    apply_email: ' info@example.org ',
    apply_phone: ' +90 500 000 0000 ',
  };

  const payload = toManualScholarshipCreatePayload(formValues);

  assert.equal(payload.ingestion_type, 'manual');
  assert.equal(payload.title_ar, 'منحة تركيا');
  assert.equal(payload.title_en, 'Turkiye Scholarship');
  assert.equal(payload.organization_name, 'Government of Turkiye');
  assert.equal(payload.country, 'Turkiye');
  assert.equal(payload.university_name, 'Istanbul University');
  assert.equal(payload.study_level, 'Bachelor');
  assert.equal(payload.funding_type, 'Full');
  assert.equal(payload.funding_amount, '1000 USD');
  assert.equal(payload.deadline, '2026-12-31');
  assert.equal(payload.no_deadline, false);
  assert.deepEqual(payload.majors, ['Engineering', 'Medicine']);
  assert.deepEqual(payload.language_requirements, ['English B2']);
  assert.deepEqual(payload.eligibility_criteria, ['GPA 3.0+']);
  assert.deepEqual(payload.required_documents, ['Passport', 'Transcript']);
  assert.equal(payload.apply_link, 'https://turkiyeburslari.gov.tr/apply');
  assert.equal(payload.image_url, 'https://example.org/photo.jpg');
  assert.equal(payload.source_url, 'https://example.org/source');
  assert.equal(payload.description_html, 'Full scholarship coverage');
  assert.equal(payload.apply_email, 'info@example.org');
  assert.equal(payload.apply_phone, '+90 500 000 0000');
});

test('createManualScholarshipSchema enforces required fields and HTTP(S) URL validation', () => {
  const schema = createManualScholarshipSchema({
    required: 'Required',
    invalidHttpUrl: 'Invalid URL',
    deadlineRequired: 'Deadline required',
    invalidDeadline: 'Invalid deadline',
  });

  const validData = {
    title_ar: 'منحة',
    title_en: 'Scholarship',
    organization_name: 'Org',
    country: 'Palestine',
    study_level: 'Master',
    funding_type: 'Full',
    no_deadline: true,
    apply_link: 'https://example.org/apply',
    image_url: 'https://example.org/image.jpg',
  };

  const validResult = schema.safeParse(validData);
  assert.equal(validResult.success, true);

  const invalidUrlData = {
    ...validData,
    apply_link: 'javascript:alert(1)',
  };
  const invalidUrlResult = schema.safeParse(invalidUrlData);
  assert.equal(invalidUrlResult.success, false);

  const missingDeadlineData = {
    ...validData,
    no_deadline: false,
    deadline: '',
  };
  const missingDeadlineResult = schema.safeParse(missingDeadlineData);
  assert.equal(missingDeadlineResult.success, false);
});
