import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadSrc } from './helpers/load-src.mjs';

const { parseScholarshipDetails, toDetailsView } = loadSrc(
  'features/student/scholarship-details/lib/adapter.ts'
);
const { getVisibleSections, getEligibilityFacts, getDateFacts, getSourceItems } = loadSrc(
  'features/student/scholarship-details/lib/sections.ts'
);

const view = (extra = {}) =>
  toDetailsView(parseScholarshipDetails({ id: 1, title: 'T', is_saved: false, ...extra }), 'en');

test('a bare scholarship shows only the dates section (the deadline always shows)', () => {
  assert.deepEqual(getVisibleSections(view()), {
    about: false,
    funding: false,
    eligibility: false,
    documents: false,
    dates: true,
    source: false,
  });
});

test('each section appears only when it has something to show', () => {
  assert.equal(getVisibleSections(view({ organization_name: 'YTB' })).about, true);
  assert.equal(getVisibleSections(view({ country: 'Türkiye' })).about, true);
  assert.equal(getVisibleSections(view({ funding_amount: '1,400 EUR' })).funding, true);
  assert.equal(getVisibleSections(view({ funding_type: 'full' })).funding, true);
  assert.equal(getVisibleSections(view({ gpa_requirement: '70%' })).eligibility, true);
  assert.equal(getVisibleSections(view({ eligibility_criteria: ['Be 18+'] })).eligibility, true);
  assert.equal(getVisibleSections(view({ study_level: ['master'] })).eligibility, true);
  assert.equal(getVisibleSections(view({ required_documents: ['CV'] })).documents, true);
  assert.equal(getVisibleSections(view({ source: 'ytb.gov.tr' })).source, true);
  assert.equal(getVisibleSections(view({ pdf_url: 'https://a.example.org/x.pdf' })).source, true);
});

test('blank, null and wrongly typed values do not open a section', () => {
  const sections = getVisibleSections(
    view({
      organization_name: '  ',
      funding_amount: null,
      majors: [null, 3],
      eligibility_criteria: '\n\n',
      required_documents: [],
      source: 5,
      source_url: 'javascript:alert(1)',
      attachments: ['javascript:x'],
    })
  );
  assert.equal(sections.about, false);
  assert.equal(sections.funding, false);
  assert.equal(sections.eligibility, false);
  assert.equal(sections.documents, false);
  assert.equal(sections.source, false);
});

test('eligibility facts keep a stable order and skip empty ones', () => {
  const facts = getEligibilityFacts(
    view({
      age_requirement: 'Under 30',
      study_level: ['master', 'phd'],
      academic_year: '2026/2027',
      majors: ['Law'],
      eligible_nationalities: 'Arab nationals',
      language_requirements: 'IELTS 6.5',
      gpa_requirement: '70%',
    })
  );
  assert.deepEqual(
    facts.map((fact) => fact.field),
    [
      'studyLevels',
      'majors',
      'eligibleNationalities',
      'languageRequirements',
      'gpaRequirement',
      'ageRequirement',
      'academicYear',
    ]
  );
  assert.deepEqual(facts[0], { field: 'studyLevels', kind: 'levels', levels: ['master', 'phd'] });
  assert.deepEqual(facts[1], { field: 'majors', kind: 'chips', items: ['Law'] });
  assert.deepEqual(facts[4], { field: 'gpaRequirement', kind: 'text', text: '70%' });
  assert.deepEqual(getEligibilityFacts(view()), []);
});

test('dates: the deadline always shows, opening and published only when readable', () => {
  assert.deepEqual(
    getDateFacts(view()).map((fact) => fact.field),
    ['deadline']
  );
  const all = getDateFacts(
    view({
      opening_date: '2026-01-10',
      deadline: '2026-08-28',
      published_at: '2026-05-01T10:00:00Z',
    })
  );
  assert.deepEqual(
    all.map((fact) => fact.field),
    ['openingDate', 'deadline', 'publishedAt']
  );
  assert.equal(all[0].value, '2026-01-10');
  const broken = getDateFacts(view({ opening_date: 'next spring', published_at: 'yesterday' }));
  assert.deepEqual(
    broken.map((fact) => fact.field),
    ['deadline']
  );
  // 2026-02-31 is not a real calendar day.
  assert.deepEqual(
    getDateFacts(view({ opening_date: '2026-02-31' })).map((fact) => fact.field),
    ['deadline']
  );
});

test('source items: name, safe link, pdf and attachments', () => {
  const items = getSourceItems(
    view({
      source: 'ytb.gov.tr',
      source_url: 'https://ytb.gov.tr/x',
      pdf_url: 'https://cdn.example.org/guide.pdf',
      attachments: ['https://cdn.example.org/a.pdf', 'javascript:x'],
    })
  );
  assert.deepEqual(items, {
    source: { text: 'ytb.gov.tr', href: 'https://ytb.gov.tr/x' },
    pdfUrl: 'https://cdn.example.org/guide.pdf',
    attachments: ['https://cdn.example.org/a.pdf'],
  });
  assert.deepEqual(getSourceItems(view({ source: 'manual entry' })), {
    source: { text: 'manual entry', href: null },
    attachments: [],
  });
});
