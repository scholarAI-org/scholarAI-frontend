import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadSrc, srcPath } from './helpers/load-src.mjs';

// GET /api/scholarships/{id}/details?lang= (SCHOLARSHIP_DETAIL_VIEW_ENABLED).

const fixture = (name) =>
  JSON.parse(
    fs.readFileSync(
      fileURLToPath(new URL(`./fixtures/scholarship-detail-view/${name}.json`, import.meta.url)),
      'utf8'
    )
  );

const { parseScholarshipDetailView, toDetailsViewFromDetailView } = loadSrc(
  'features/student/scholarship-details/lib/detail-view-adapter.ts'
);
const { DetailsContractError } = loadSrc('features/student/scholarship-details/lib/adapter.ts');
const { getVisibleSections, getEligibilityFacts, getDateFacts } = loadSrc(
  'features/student/scholarship-details/lib/sections.ts'
);
const { studentScholarshipKeys } = loadSrc('features/student/scholarship-discovery/query-keys.ts');

const view = (raw, locale = 'ar') =>
  toDetailsViewFromDetailView(parseScholarshipDetailView(raw), locale);

test('a complete listing maps every group to the view model', () => {
  const v = view(fixture('detail-12-ar'));
  assert.equal(v.id, 12);
  assert.equal(v.title, 'منحة المستقبل للدراسات العليا');
  assert.equal(v.isSaved, true);
  assert.equal(v.organizationName, 'مؤسسة المستقبل للمنح');
  assert.equal(v.universityName, 'Example Technical University');
  assert.equal(v.country, 'تركيا');
  assert.match(v.description, /^تقدّم مؤسسة المستقبل/);
  assert.match(v.description, /\n\n/);
  assert.deepEqual(v.studyLevels, ['master', 'phd']);
  assert.equal(v.fundingType, 'full');
  assert.equal(v.opportunityType, 'scholarship');
  assert.equal(v.applicationStatus, 'open');
  assert.equal(v.deadline, '2026-12-15');
  assert.equal(v.noDeadline, false);
  assert.equal(v.openingDate, '2026-09-01');
  assert.equal(v.lastUpdatedAt, '2026-11-07T09:30:00Z');
  assert.equal(v.publishedAt, '2026-10-21T09:30:00Z');
  assert.deepEqual(v.fundingDuration, { min: 24, max: 36 });
  assert.equal(v.benefits.length, 4);
  assert.match(v.fundingSummary, /تغطية كاملة/);
  assert.deepEqual(v.majors, ['الهندسة', 'علوم الحاسوب']);
  assert.equal(v.fieldsOfStudyScope, 'specific');
  assert.equal(v.eligibleNationalities, 'حاملو الجنسية الفلسطينية');
  assert.equal(v.gpaRequirement, '70% فما فوق');
  assert.equal(v.ageRequirement, '35 سنة كحد أقصى');
  assert.equal(v.languageRequirements, 'TOEFL 80 أو IELTS 6.5');
  assert.equal(v.academicYear, '2027/2028');
  assert.equal(v.eligibilityCriteria.length, 2);
  assert.equal(v.requiredDocuments.length, 7);
  assert.deepEqual(v.requiredDocuments[0], {
    name: 'جواز السفر',
    type: 'passport',
    mandatory: true,
  });
  assert.equal(v.requiredDocuments[5].mandatory, false);
  assert.equal(v.apply.link, 'https://example.org/apply/future-graduate-2027');
  assert.equal(v.apply.email, 'mailto:apply@example.org');
  assert.equal(v.source, 'for9a');
  assert.equal(v.sourceUrl, 'https://example.org/scholarships/future-graduate-2027');
  assert.equal(v.pdfUrl, 'https://example.org/files/future-graduate-guide.pdf');
  assert.deepEqual(v.attachments, ['https://example.org/files/faq.pdf']);
});

test('the English response keeps the same shape; a fallback name stays as received', () => {
  const v = view(fixture('detail-12-en'), 'en');
  assert.equal(v.title, 'Future Graduate Scholarship');
  assert.equal(v.country, 'Türkiye');
  assert.deepEqual(v.majors, ['Engineering', 'Computer Science']);
  assert.equal(v.requiredDocuments.at(-1).name, 'شهادات الخبرة (إن وجدت)');
});

test('several countries are joined with the page language separator', () => {
  const raw = fixture('detail-12-ar');
  raw.overview.countries = [
    { code: 'TR', name: 'تركيا' },
    { code: 'DE', name: 'ألمانيا' },
  ];
  assert.equal(view(raw, 'ar').country, 'تركيا، ألمانيا');
  assert.equal(view(raw, 'en').country, 'تركيا, ألمانيا');
});

test('a poor scraped listing shows what it has and hides the rest', () => {
  const v = view(fixture('detail-13-ar'));
  assert.equal(v.imageUrl, undefined);
  assert.equal(v.noDeadline, true);
  assert.equal(v.applicationStatus, 'unknown');
  assert.equal(v.fundingType, undefined);
  assert.equal(v.fundingDuration, undefined);
  assert.deepEqual(v.benefits, []);
  assert.equal(v.fieldsOfStudyScope, undefined);
  assert.deepEqual(v.requiredDocuments, [
    { name: 'جواز السفر', type: undefined, mandatory: undefined },
  ]);
  assert.deepEqual(v.apply, {});
  assert.equal(v.lastUpdatedAt, undefined);

  const sections = getVisibleSections(v);
  assert.equal(sections.about, true); // description, provider, country
  assert.equal(sections.funding, false);
  assert.equal(sections.eligibility, true);
  assert.equal(sections.documents, true);
  assert.equal(sections.source, true);
});

test('only id, title and is_saved are required', () => {
  const minimal = view({ id: 5, title: 'T', is_saved: false });
  assert.equal(minimal.title, 'T');
  assert.deepEqual(minimal.requiredDocuments, []);
  assert.deepEqual(getVisibleSections(minimal), {
    about: false,
    funding: false,
    eligibility: false,
    documents: false,
    dates: true,
    source: false,
  });

  const reasons = [
    [null, 'not-object'],
    [[], 'not-object'],
    [{ title: 'T', is_saved: false }, 'invalid-id'],
    [{ id: 5, is_saved: false }, 'missing-title'],
    [{ id: 5, title: 'T' }, 'missing-is-saved'],
  ];
  for (const [raw, reason] of reasons) {
    assert.throws(
      () => parseScholarshipDetailView(raw),
      (error) => error instanceof DetailsContractError && error.reason === reason,
      reason
    );
  }
});

test('wrong types and unsafe links are dropped, never thrown on', () => {
  const v = view({
    id: 5,
    title: 'T',
    is_saved: false,
    overview: 'not an object',
    funding: { benefits: 'one string', duration_months: { min: 36, max: 12 } },
    eligibility: { criteria: [null, 3, ' ok '] },
    application: {
      link: 'javascript:alert(1)',
      pdf_url: 'data:text/html,x',
      attachments: ['javascript:x', 'https://a.example.org/f.pdf'],
      documents: [{ name: '' }, { name: 'CV', type: 7, mandatory: 'yes' }, 'x'],
    },
    source: { url: 'javascript:alert(1)', name: 'site' },
    deadline: { status: 'archived', days_left: -3 },
  });
  assert.deepEqual(v.benefits, []);
  assert.equal(v.fundingDuration, undefined);
  assert.deepEqual(v.eligibilityCriteria, ['ok']);
  assert.equal(v.apply.link, undefined);
  assert.equal(v.pdfUrl, undefined);
  assert.deepEqual(v.attachments, ['https://a.example.org/f.pdf']);
  assert.deepEqual(v.requiredDocuments, [{ name: 'CV', type: undefined, mandatory: undefined }]);
  assert.equal(v.sourceUrl, undefined);
  assert.equal(v.applicationStatus, 'unknown');
});

test('new fields open their sections: description, funding details, all fields, last update', () => {
  const base = { id: 5, title: 'T', is_saved: false };
  assert.equal(
    getVisibleSections(view({ ...base, overview: { description: 'Text' } })).about,
    true
  );
  assert.equal(
    getVisibleSections(view({ ...base, funding: { benefits: ['Stipend'] } })).funding,
    true
  );
  assert.equal(
    getVisibleSections(view({ ...base, funding: { duration_months: { min: 12, max: 12 } } }))
      .funding,
    true
  );
  assert.equal(getVisibleSections(view({ ...base, funding: { summary: 'Full' } })).funding, true);

  // "all" shows a fact; null (unknown) does not, and an empty list is never read as "all".
  const allFields = view({
    ...base,
    overview: { fields_of_study: [], fields_of_study_scope: 'all' },
  });
  assert.deepEqual(getEligibilityFacts(allFields), [{ field: 'majors', kind: 'allFields' }]);
  assert.deepEqual(getEligibilityFacts(view({ ...base, overview: { fields_of_study: [] } })), []);

  const dated = view({ ...base, last_updated_at: '2026-11-07T09:30:00Z' });
  const fact = getDateFacts(dated).find((entry) => entry.field === 'lastUpdatedAt');
  assert.equal(fact.value.toISOString(), '2026-11-07T09:30:00.000Z');
  assert.equal(
    getDateFacts(view({ ...base, last_updated_at: 'not a date' })).some(
      (entry) => entry.field === 'lastUpdatedAt'
    ),
    false
  );
});

test('the view query is keyed per language under the scholarship detail key', () => {
  const detail = studentScholarshipKeys.detail(12);
  const ar = studentScholarshipKeys.detailView(12, 'ar');
  const en = studentScholarshipKeys.detailView(12, 'en');
  assert.deepEqual(ar.slice(0, detail.length), [...detail]);
  assert.notDeepEqual(ar, en);
});

test('a bookmark change updates the cached view in every language', () => {
  const { QueryClient } = createRequire(import.meta.url)('@tanstack/react-query');
  const { applyOptimisticBookmark, rollbackBookmark } = loadSrc(
    'features/student/scholarship-discovery/lib/bookmark-cache.ts'
  );
  const client = new QueryClient();
  const ar = studentScholarshipKeys.detailView(12, 'ar');
  const en = studentScholarshipKeys.detailView(12, 'en');
  client.setQueryData(
    ar,
    parseScholarshipDetailView({ ...fixture('detail-12-ar'), is_saved: false })
  );
  client.setQueryData(
    en,
    parseScholarshipDetailView({ ...fixture('detail-12-en'), is_saved: false })
  );

  const snapshot = applyOptimisticBookmark(client, 12, true);
  assert.equal(client.getQueryData(ar).is_saved, true);
  assert.equal(client.getQueryData(en).is_saved, true);

  rollbackBookmark(client, 12, snapshot);
  assert.equal(client.getQueryData(ar).is_saved, false);
  assert.equal(client.getQueryData(en).is_saved, false);
  client.clear();
});

test('the request sends lang and nothing else', async () => {
  const requests = [];
  const api = loadSrc('lib/api-client.ts');
  const original = api.apiClient;
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    return new Response(JSON.stringify(fixture('detail-12-en')), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  try {
    const { getScholarshipDetailView } = loadSrc(
      'features/student/scholarship-details/api/scholarship-details.ts'
    );
    const data = await getScholarshipDetailView(12, 'en');
    assert.equal(data.id, 12);
    assert.equal(requests.length, 1);
    const url = new URL(requests[0], 'http://localhost');
    assert.match(url.pathname, /\/api\/scholarships\/12\/details$/);
    assert.deepEqual([...url.searchParams.keys()], ['lang']);
    assert.equal(url.searchParams.get('lang'), 'en');
  } finally {
    globalThis.fetch = fetchOriginal;
    assert.equal(api.apiClient, original);
  }
});

test('the page renders the new sections from the view endpoint when the flag is on', () => {
  const requireModule = createRequire(import.meta.url);
  const React = requireModule('react');
  const { renderToStaticMarkup } = requireModule('react-dom/server');
  const { QueryClient, QueryClientProvider } = requireModule('@tanstack/react-query');
  const { IntlMessageFormat } = requireModule('intl-messageformat');
  const originalLoad = Module._load;
  const calls = { original: [], view: [] };

  const render = (locale, data) => {
    const messages = JSON.parse(
      fs.readFileSync(path.join(srcPath, `messages/${locale}.json`), 'utf8')
    );
    Module._load = function (request, parent, ...rest) {
      if (request === '@/i18n/navigation')
        return { Link: ({ children, ...props }) => React.createElement('a', props, children) };
      if (request === 'next-intl')
        return {
          useLocale: () => locale,
          useTranslations: (namespace) => {
            const t = (key, values) => {
              const message = `${namespace}.${key}`
                .split('.')
                .reduce((value, part) => (value ? value[part] : undefined), messages);
              if (typeof message !== 'string') return `${namespace}.${key}`;
              return new IntlMessageFormat(message, locale).format(values);
            };
            t.rich = t;
            t.has = () => true;
            return t;
          },
        };
      return originalLoad.call(this, request, parent, ...rest);
    };
    const hookPath = path.join(
      srcPath,
      'features/student/scholarship-details/hooks/useScholarshipDetailsQuery.ts'
    );
    const pagePath = path.join(
      srcPath,
      'features/student/scholarship-details/components/ScholarshipDetailsPage.tsx'
    );
    for (const key of Object.keys(requireModule.cache)) {
      if (key.includes(`${path.sep}src${path.sep}`)) delete requireModule.cache[key];
    }
    requireModule.cache[requireModule.resolve(hookPath)] = {
      exports: {
        useScholarshipDetailsQuery: (id, options) => {
          calls.original.push(options?.enabled);
          return { isFetching: false, data: undefined, error: null, refetch: async () => {} };
        },
        useScholarshipDetailViewQuery: (id, lang, options) => {
          calls.view.push([lang, options?.enabled]);
          return { isFetching: false, data, error: null, refetch: async () => {} };
        },
      },
    };
    const { ScholarshipDetailsPage } = requireModule(pagePath);
    const client = new QueryClient();
    try {
      return renderToStaticMarkup(
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(ScholarshipDetailsPage, { rawId: '12', detailViewEnabled: true })
        )
      );
    } finally {
      client.clear();
      Module._load = originalLoad;
    }
  };

  const en = render('en', parseScholarshipDetailView(fixture('detail-12-en')));
  assert.deepEqual(calls.original.at(-1), false, 'the original endpoint is not requested');
  assert.deepEqual(calls.view.at(-1), ['en', true]);
  assert.ok(en.includes('Future Graduate Scholarship'));
  assert.ok(en.includes('offers full graduate scholarships'), 'description');
  assert.ok(en.includes('What the scholarship covers'), 'benefits heading');
  assert.ok(en.includes('Return flight ticket'), 'a benefit');
  assert.ok(en.includes('24–36 months'), 'funding duration');
  assert.ok(en.includes('Required') && en.includes('Optional'), 'document badges');
  assert.ok(en.includes('Last updated'), 'last update date');
  assert.equal(/<[a-z]+[^>]*>\s*<script/i.test(en), false);

  const ar = render('ar', parseScholarshipDetailView(fixture('detail-12-ar')));
  assert.deepEqual(calls.view.at(-1), ['ar', true]);
  assert.ok(ar.includes('ما تشمله المنحة'));
  assert.ok(ar.includes('24–36 شهراً'));
  assert.ok(ar.includes('إلزامي') && ar.includes('اختياري'));
});
