import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadSrc } from './helpers/load-src.mjs';

const { parseScholarshipDetails, toDetailsView, DetailsContractError } = loadSrc(
  'features/student/scholarship-details/lib/adapter.ts'
);

// Shaped like the live ScholarshipDetailsResponse (openapi.live.json).
const full = () => ({
  id: 564,
  title: 'YTB Scholarship',
  title_ar: 'منحة تركيا',
  title_en: 'Türkiye Scholarships',
  slug: 'ytb',
  organization_name: 'YTB',
  university_name: 'Istanbul University',
  country: 'Türkiye',
  image_url: 'https://cdn.example.org/a.jpg',
  study_level: ['master', 'phd'],
  funding_type: 'full',
  opportunity_type: 'scholarship',
  application_status: 'open',
  deadline: '2026-08-28',
  no_deadline: false,
  opening_date: '2026-01-10',
  is_saved: true,
  ingestion_type: 'scraped',
  source: 'ytb.gov.tr',
  source_url: 'https://ytb.gov.tr/scholarships',
  funding_amount: '1,400 EUR / month',
  language_requirements: 'IELTS 6.5',
  eligible_nationalities: 'All nationalities',
  academic_year: '2026/2027',
  gpa_requirement: '70%',
  age_requirement: 'Under 30',
  majors: ['Medicine', 'Engineering'],
  eligibility_criteria: ['Hold a bachelor degree', 'Be under 30'],
  required_documents: ['Transcript', 'Passport'],
  apply_link: 'https://apply.example.org',
  apply_email: 'apply@example.org',
  apply_phone: '+90 212 555 0100',
  pdf_url: 'https://cdn.example.org/guide.pdf',
  attachments: ['https://cdn.example.org/a1.pdf'],
  is_extension: false,
  published_at: '2026-05-01T10:00:00Z',
  description_html: '<p>ignored</p>',
});

test('a full live payload maps to the view model', () => {
  const view = toDetailsView(parseScholarshipDetails(full()), 'en');
  assert.equal(view.id, 564);
  assert.equal(view.title, 'Türkiye Scholarships');
  assert.equal(view.organizationName, 'YTB');
  assert.deepEqual(view.studyLevels, ['master', 'phd']);
  assert.equal(view.fundingType, 'full');
  assert.equal(view.applicationStatus, 'open');
  assert.equal(view.deadline, '2026-08-28');
  assert.equal(view.openingDate, '2026-01-10');
  assert.equal(view.gpaRequirement, '70%');
  assert.equal(view.ageRequirement, 'Under 30');
  assert.equal(view.eligibleNationalities, 'All nationalities');
  assert.equal(view.academicYear, '2026/2027');
  assert.deepEqual(view.requiredDocuments, ['Transcript', 'Passport']);
  assert.equal(view.apply.link, 'https://apply.example.org/');
  assert.equal(view.isSaved, true);
});

test('the title follows the locale and falls back to title', () => {
  const data = parseScholarshipDetails(full());
  assert.equal(toDetailsView(data, 'ar').title, 'منحة تركيا');
  const noLocalised = parseScholarshipDetails({ ...full(), title_ar: null, title_en: '  ' });
  assert.equal(toDetailsView(noLocalised, 'ar').title, 'YTB Scholarship');
  assert.equal(toDetailsView(noLocalised, 'en').title, 'YTB Scholarship');
});

test('only id, title and is_saved are required', () => {
  const minimal = parseScholarshipDetails({ id: 1, title: 'T', is_saved: false });
  const view = toDetailsView(minimal, 'en');
  assert.equal(view.title, 'T');
  assert.equal(view.isSaved, false);
  assert.deepEqual(view.studyLevels, []);
  assert.deepEqual(view.majors, []);
  assert.deepEqual(view.eligibilityCriteria, []);
  assert.deepEqual(view.requiredDocuments, []);
  assert.deepEqual(view.attachments, []);
  assert.equal(view.applicationStatus, 'unknown');
  assert.equal(view.noDeadline, false);
  for (const key of [
    'organizationName',
    'fundingType',
    'deadline',
    'openingDate',
    'publishedAt',
    'sourceUrl',
    'gpaRequirement',
  ]) {
    assert.equal(view[key], undefined, key);
  }
  assert.deepEqual(view.apply, {});
});

test('all-null optional fields behave like missing ones', () => {
  const nulls = Object.fromEntries(Object.keys(full()).map((key) => [key, null]));
  const view = toDetailsView(
    parseScholarshipDetails({ ...nulls, id: 9, title: 'T', is_saved: true }),
    'en'
  );
  assert.deepEqual(view.studyLevels, []);
  assert.equal(view.fundingAmount, undefined);
  assert.equal(view.applicationStatus, 'unknown');
  assert.deepEqual(view.apply, {});
});

test('wrongly typed optional fields are dropped, never thrown on', () => {
  const view = toDetailsView(
    parseScholarshipDetails({
      id: 2,
      title: 'T',
      is_saved: true,
      country: 42,
      deadline: { a: 1 },
      no_deadline: 'yes',
      study_level: 'master',
      majors: [1, 'Law', null, '  '],
      required_documents: 'CV\r\nPassport\n\n',
      attachments: 'x',
      application_status: 'archived',
      opportunity_type: 'mystery',
      published_at: 7,
    }),
    'en'
  );
  assert.equal(view.country, undefined);
  assert.equal(view.deadline, undefined);
  assert.equal(view.noDeadline, false);
  assert.deepEqual(view.studyLevels, ['master']);
  assert.deepEqual(view.majors, ['Law']);
  assert.deepEqual(view.requiredDocuments, ['CV', 'Passport']);
  assert.deepEqual(view.attachments, []);
  assert.equal(view.applicationStatus, 'unknown');
  assert.equal(view.opportunityType, undefined);
  assert.equal(view.publishedAt, undefined);
});

test('unknown study level and funding values are kept as received', () => {
  const view = toDetailsView(
    parseScholarshipDetails({
      id: 3,
      title: 'T',
      is_saved: false,
      study_level: ['diploma'],
      funding_type: 'stipend',
    }),
    'en'
  );
  assert.deepEqual(view.studyLevels, ['diploma']);
  assert.equal(view.fundingType, 'stipend');
});

test('unsafe apply and source links are dropped', () => {
  const view = toDetailsView(
    parseScholarshipDetails({
      id: 4,
      title: 'T',
      is_saved: false,
      apply_link: 'javascript:alert(1)',
      source_url: 'data:text/html,x',
      pdf_url: 'ftp://files.example.org/a.pdf',
      apply_email: 'not an email',
      apply_phone: 'call me',
      attachments: ['https://ok.example.org/a.pdf', 'javascript:x', '/relative'],
    }),
    'en'
  );
  assert.deepEqual(view.apply, {});
  assert.equal(view.sourceUrl, undefined);
  assert.equal(view.pdfUrl, undefined);
  assert.deepEqual(view.attachments, ['https://ok.example.org/a.pdf']);
});

test('a valid email and phone become mailto and tel links', () => {
  const view = toDetailsView(
    parseScholarshipDetails({
      ...full(),
      apply_email: 'apply@example.org',
      apply_phone: '+90 212 555 0100',
    }),
    'en'
  );
  assert.equal(view.apply.email, 'mailto:apply@example.org');
  assert.equal(view.apply.phone, 'tel:+902125550100');
});

test('missing required fields raise DetailsContractError with a reason', () => {
  const cases = [
    [null, 'not-object'],
    ['x', 'not-object'],
    [[], 'not-object'],
    [{ title: 'T', is_saved: true }, 'invalid-id'],
    [{ id: 0, title: 'T', is_saved: true }, 'invalid-id'],
    [{ id: 1.5, title: 'T', is_saved: true }, 'invalid-id'],
    [{ id: 1, is_saved: true }, 'missing-title'],
    [{ id: 1, title: 'T' }, 'missing-is-saved'],
    [{ id: 1, title: 'T', is_saved: 'true' }, 'missing-is-saved'],
  ];
  for (const [raw, reason] of cases) {
    assert.throws(
      () => parseScholarshipDetails(raw),
      (error) => error instanceof DetailsContractError && error.reason === reason,
      `${JSON.stringify(raw)} -> ${reason}`
    );
  }
});

test('description_html is never carried into the model', () => {
  const view = toDetailsView(parseScholarshipDetails(full()), 'en');
  assert.equal(JSON.stringify(view).includes('ignored'), false);
});
