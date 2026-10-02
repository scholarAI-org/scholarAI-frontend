import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, test } from 'node:test';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);

loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

// Resolve the `@/` path alias used by feature code to `src/`.
const srcPath = fileURLToPath(new URL('../src', import.meta.url));
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith('@/') ? path.join(srcPath, request.slice(2)) : request;
  return resolveFilename.call(this, target, ...rest);
};

process.env.BACKEND_URL = 'https://backend.test/';

const featurePath = path.join(srcPath, 'features/student/scholarship-discovery');
const load = (file) => loadModule(path.join(featurePath, file));

const {
  buildDiscoveryHref,
  normalizeDiscoveryQuery,
  parseDiscoveryQuery,
  serializeDiscoveryQuery,
  toDiscoveryRequestParams,
  withFilterChange,
  withPage,
  withSearch,
  withSort,
} = load('lib/discovery-query-state.ts');
const { toScholarshipCard, toScholarshipDetails, toStringList } = load('adapters/scholarship.ts');
const {
  getScholarship,
  getScholarshipFilterOptions,
  getScholarships,
  parseFilterOptionsResponse,
  saveScholarship,
  unsaveScholarship,
} = load('api/scholarships.ts');
const { studentScholarshipKeys } = load('query-keys.ts');
const { defaultDiscoveryQuery, discoverySortOptions, discoverySorts, getVisibleSortOptions } =
  load('constants.ts');
const { FILTER_OPTIONS_STALE_TIME } = load('hooks/useScholarshipFilterOptions.ts');
const { shouldRetryScholarshipQuery } = load('lib/query-retry.ts');
const { ApiError } = loadModule(path.join(srcPath, 'lib/api-client.ts'));

const parse = (search) => parseDiscoveryQuery(new URLSearchParams(search));

// --- URL parse / serialize -------------------------------------------------

test('parse maps the deadline_soonest alias and never emits it', () => {
  const query = parse('sort=deadline_soonest');
  assert.equal(query.sort, 'deadline_soon');
  assert.equal(serializeDiscoveryQuery(query).toString(), 'sort=deadline_soon');
  assert.equal(parse('sort=match').sort, 'newest');
  assert.equal(parse('sort=').sort, 'newest');
});

test('parse keeps repeated params, normalizes enums and drops unsupported values', () => {
  const query = parse(
    'academic_level=Bachelor&academic_level=master&academic_level=bachelor&academic_level=postdoc' +
      '&funding_type=FULL&funding_type=none&opportunity_type=training&opportunity_type=internship' +
      '&country=Germany&country=%20Germany%20&country=&country=United%20Kingdom'
  );
  assert.deepEqual(query.academicLevels, ['bachelor', 'master']);
  assert.deepEqual(query.fundingTypes, ['full']);
  assert.deepEqual(query.opportunityTypes, ['training']);
  assert.deepEqual(query.countries, ['Germany', 'United Kingdom']);
  assert.equal(
    serializeDiscoveryQuery(query).toString(),
    'academic_level=bachelor&academic_level=master&funding_type=full&opportunity_type=training' +
      '&country=Germany&country=United+Kingdom'
  );
});

test('parse collapses search whitespace and omits blank search', () => {
  assert.equal(parse('search=%20%20data%20%20%20science%20').search, 'data science');
  assert.equal(parse('search=%20%20%20').search, undefined);
  assert.equal('search' in parse('search='), false);
});

test('parse caps values to the OpenAPI limits', () => {
  const longSearch = 'a'.repeat(350);
  assert.equal(parse(`search=${longSearch}`).search.length, 300);

  const tooLongCountry = 'x'.repeat(101);
  const countries = Array.from({ length: 60 }, (_, i) => `country=C${i}`).join('&');
  const query = parse(`${countries}&country=${tooLongCountry}`);
  assert.equal(query.countries.length, 50);
  assert.equal(query.countries.includes(tooLongCountry), false);
  assert.equal(parse(`country=${'y'.repeat(100)}`).countries.length, 1);
});

test('parse maps invalid pages to 1', () => {
  for (const page of ['0', '-2', '1.5', 'abc', '', '1e400']) {
    assert.equal(parse(`page=${page}`).page, 1, `page=${page}`);
  }
  assert.equal(parse('page=3').page, 3);
});

test('serialize omits defaults and page_size never appears in the browser URL', () => {
  assert.equal(serializeDiscoveryQuery(defaultDiscoveryQuery).toString(), '');
  const query = parse('page=2&page_size=100&sort=newest');
  const url = serializeDiscoveryQuery(query).toString();
  assert.equal(url, 'page=2');
  assert.equal(url.includes('page_size'), false);
  assert.equal(
    buildDiscoveryHref('/student/scholarships', defaultDiscoveryQuery),
    '/student/scholarships'
  );
  assert.equal(buildDiscoveryHref('/student/scholarships', query), '/student/scholarships?page=2');
});

test('parse → serialize → parse is stable', () => {
  const query = parse('country=Germany&sort=deadline_soonest&page=4&search=%20ai%20');
  assert.deepEqual(parse(serializeDiscoveryQuery(query).toString()), query);
});

test('update helpers reset page for search/filter/sort and only change page for pagination', () => {
  const base = parse('page=5&country=Germany&sort=deadline_soon');

  const searched = withSearch(base, '  medicine  ');
  assert.equal(searched.page, 1);
  assert.equal(searched.search, 'medicine');
  assert.equal(withSearch(base, '   ').search, undefined);

  const filtered = withFilterChange(base, {
    countries: ['France', 'France'],
    fundingTypes: ['full'],
  });
  assert.equal(filtered.page, 1);
  assert.deepEqual(filtered.countries, ['France']);
  assert.deepEqual(filtered.fundingTypes, ['full']);
  assert.equal(filtered.sort, 'deadline_soon');

  const sorted = withSort(base, 'newest');
  assert.equal(sorted.page, 1);
  assert.equal(sorted.sort, 'newest');

  const paged = withPage(base, 7);
  assert.deepEqual(paged, { ...base, page: 7 });
  assert.equal(withPage(base, 0).page, 1);
  assert.equal(withPage(base, -3).page, 1);
});

test('normalizeDiscoveryQuery guards the page for the discovery hook', () => {
  assert.equal(normalizeDiscoveryQuery({ ...defaultDiscoveryQuery, page: 0 }).page, 1);
  assert.equal(normalizeDiscoveryQuery({ ...defaultDiscoveryQuery, page: Number.NaN }).page, 1);
  assert.equal(normalizeDiscoveryQuery({ ...defaultDiscoveryQuery, page: 2.5 }).page, 1);
  assert.equal(normalizeDiscoveryQuery({ ...defaultDiscoveryQuery, page: 9 }).page, 9);
});

// --- Adapters --------------------------------------------------------------

const card = {
  id: 7,
  title: 'Fallback title',
  title_ar: 'منحة ألمانيا',
  title_en: 'Germany Scholarship',
  organization_name: '  DAAD  ',
  university_name: null,
  country: 'Germany',
  study_level: '',
  funding_type: 'FULL',
  opportunity_type: 'scholarship',
  image_url: '   ',
  deadline: '2026-12-31',
  no_deadline: null,
  is_saved: true,
};

test('card adapter selects the localized title, then title, then undefined', () => {
  assert.equal(toScholarshipCard(card, 'ar').title, 'منحة ألمانيا');
  assert.equal(toScholarshipCard(card, 'en').title, 'Germany Scholarship');
  assert.equal(toScholarshipCard({ ...card, title_ar: '  ' }, 'ar').title, 'Fallback title');
  assert.equal(
    toScholarshipCard({ ...card, title: ' ', title_ar: null, title_en: null }, 'en').title,
    undefined
  );
});

test('card adapter cleans nullable fields and never supplies match data', () => {
  const model = toScholarshipCard(card, 'en');
  assert.equal(model.organizationName, 'DAAD');
  assert.equal(model.universityName, undefined);
  assert.equal(model.studyLevel, undefined);
  assert.equal(model.imageUrl, undefined);
  assert.equal(model.opportunityType, 'scholarship');
  assert.equal(model.noDeadline, false);
  assert.equal(model.isSaved, true);
  assert.equal(model.match, null);
  assert.equal(
    toScholarshipCard({ ...card, opportunity_type: null }, 'en').opportunityType,
    undefined
  );
});

test('toStringList normalizes list-or-string fields', () => {
  assert.deepEqual(toStringList(null), []);
  assert.deepEqual(toStringList(undefined), []);
  assert.deepEqual(toStringList('   '), []);
  assert.deepEqual(toStringList(' Computer Science \n\n Data Science \r\n'), [
    'Computer Science',
    'Data Science',
  ]);
  assert.deepEqual(toStringList([' Passport ', '', 42, 'CV']), ['Passport', 'CV']);
});

test('details adapter normalizes list fields, nullable fields and drops description_html', () => {
  const details = toScholarshipDetails(
    {
      ...card,
      ingestion_type: 'manual',
      source: 'manual',
      source_url: null,
      description_html: '<img src=x onerror=alert(1)>',
      funding_amount: ' 1000 EUR ',
      language_requirements: null,
      majors: 'Engineering\nMedicine',
      eligibility_criteria: ['GPA 3.0', '  '],
      required_documents: null,
      apply_link: 'https://apply.test',
      apply_email: '',
      apply_phone: null,
      pdf_url: null,
      attachments: null,
      is_extension: null,
      published_at: '2026-09-01T00:00:00Z',
    },
    'en'
  );
  assert.equal(details.title, 'Germany Scholarship');
  assert.equal(details.ingestionType, 'manual');
  assert.equal(details.fundingAmount, '1000 EUR');
  assert.equal(details.languageRequirements, undefined);
  assert.deepEqual(details.majors, ['Engineering', 'Medicine']);
  assert.deepEqual(details.eligibilityCriteria, ['GPA 3.0']);
  assert.deepEqual(details.requiredDocuments, []);
  assert.deepEqual(details.attachments, []);
  assert.equal(details.applyEmail, undefined);
  assert.equal(details.isExtension, false);
  assert.equal(details.match, null);
  assert.equal('descriptionHtml' in details, false);
  assert.equal(JSON.stringify(details).includes('onerror'), false);
});

// --- API -------------------------------------------------------------------

const realFetch = globalThis.fetch;
let calls = [];
const mockFetch = (body, status = 200) => {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(status === 204 ? null : JSON.stringify(body), { status });
  };
};
afterEach(() => {
  globalThis.fetch = realFetch;
});

test('getScholarships maps the query to GET /api/scholarships/ with page_size and abort signal', async () => {
  mockFetch({ items: [], total: 0, page: 2, page_size: 20, total_pages: 0 });
  const controller = new AbortController();
  const query = parse(
    'search=ai&academic_level=master&academic_level=phd&funding_type=full' +
      '&opportunity_type=research_fellowship&country=C%C3%B4te%20d%E2%80%99Ivoire&country=Germany&page=2'
  );
  await getScholarships(query, controller.signal);

  const [{ url, init }] = calls;
  assert.equal(init.method, undefined);
  assert.equal(init.signal, controller.signal);
  assert.equal(init.credentials, 'include');
  assert.equal(url.origin + url.pathname, 'https://backend.test/api/scholarships/');
  assert.equal(url.searchParams.get('search'), 'ai');
  assert.deepEqual(url.searchParams.getAll('academic_level'), ['master', 'phd']);
  assert.deepEqual(url.searchParams.getAll('funding_type'), ['full']);
  assert.deepEqual(url.searchParams.getAll('opportunity_type'), ['research_fellowship']);
  assert.equal(url.searchParams.get('sort'), 'newest');
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.get('page_size'), '20');
});

test('country strings are sent unchanged, with no ISO-code translation', async () => {
  const countries = ['Côte d’Ivoire', 'United Kingdom', 'germany', 'São Tomé & Príncipe'];
  mockFetch({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 });
  await getScholarships(withFilterChange(defaultDiscoveryQuery, { countries }));
  assert.deepEqual(calls[0].url.searchParams.getAll('country'), countries);
  assert.deepEqual(toDiscoveryRequestParams(defaultDiscoveryQuery).getAll('country'), []);
});

test('detail, save and unsave use the documented methods and paths', async () => {
  mockFetch({ scholarship_id: 9, is_saved: false });
  await getScholarship(9);
  await saveScholarship(9);
  await unsaveScholarship(9);
  assert.deepEqual(
    calls.map(({ url, init }) => [init.method ?? 'GET', url.pathname]),
    [
      ['GET', '/api/scholarships/9'],
      ['POST', '/api/scholarships/9/save'],
      ['DELETE', '/api/scholarships/9/save'],
    ]
  );
  assert.equal(calls[1].init.signal, undefined);
});

test('getScholarshipFilterOptions keeps non-empty strings unchanged', async () => {
  mockFetch({ countries: ['Germany', '  ', '', null, 3, ' Côte d’Ivoire '] });
  const controller = new AbortController();
  const result = await getScholarshipFilterOptions(controller.signal);
  assert.equal(calls[0].url.pathname, '/api/scholarships/filter-options');
  assert.equal(calls[0].init.signal, controller.signal);
  assert.deepEqual(result, { countries: ['Germany', ' Côte d’Ivoire '] });
});

test('filter-options validation throws a clear error on malformed payloads', async () => {
  for (const payload of [null, {}, { countries: 'Germany' }, [], 'x']) {
    assert.throws(() => parseFilterOptionsResponse(payload), /Malformed filter-options response/);
  }
  mockFetch({ countries: { de: 'Germany' } });
  await assert.rejects(getScholarshipFilterOptions(), /Malformed filter-options response/);
});

test('API errors surface as ApiError with status, and 401/403/422 are not retried', async () => {
  mockFetch({ detail: 'Not authenticated' }, 401);
  await assert.rejects(getScholarships(defaultDiscoveryQuery), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    return true;
  });
  for (const status of [401, 403, 422]) {
    assert.equal(shouldRetryScholarshipQuery(0, new ApiError('x', [], status)), false);
  }
  assert.equal(shouldRetryScholarshipQuery(0, new ApiError('x', [], 500)), true);
  assert.equal(shouldRetryScholarshipQuery(2, new Error('network')), false);
});

// --- Query keys --------------------------------------------------------------

test('query keys are stable and hierarchical', () => {
  const query = parse('country=Germany&page=2');
  assert.deepEqual(
    studentScholarshipKeys.discovery(query),
    studentScholarshipKeys.discovery(parse('page=2&country=Germany'))
  );
  assert.deepEqual(
    studentScholarshipKeys.discovery(query).slice(0, 2),
    studentScholarshipKeys.discoveries()
  );
  assert.deepEqual(studentScholarshipKeys.detail(4).slice(0, 2), studentScholarshipKeys.details());
  assert.deepEqual(studentScholarshipKeys.saved().slice(0, 2), studentScholarshipKeys.savedLists());
  assert.equal(studentScholarshipKeys.saved.length, 0);
  assert.deepEqual(studentScholarshipKeys.filterOptions(), [
    'student-scholarships',
    'filter-options',
  ]);
  for (const key of [
    studentScholarshipKeys.discoveries(),
    studentScholarshipKeys.details(),
    studentScholarshipKeys.savedLists(),
    studentScholarshipKeys.filterOptions(),
  ]) {
    assert.deepEqual(key.slice(0, 1), studentScholarshipKeys.all);
  }
});

test('Grid/List view state never reaches the URL query or any key', () => {
  const withView = parse('country=Germany&view=list&layout=grid&mode=list');
  const withoutView = parse('country=Germany');
  assert.deepEqual(withView, withoutView);
  assert.deepEqual(Object.keys(withView).sort(), [
    'academicLevels',
    'countries',
    'fundingTypes',
    'opportunityTypes',
    'page',
    'sort',
  ]);
  assert.equal(serializeDiscoveryQuery(withView).has('view'), false);
  const keys = JSON.stringify([
    studentScholarshipKeys.discovery(withView),
    studentScholarshipKeys.filterOptions(),
    studentScholarshipKeys.saved(),
    studentScholarshipKeys.detail(1),
  ]);
  assert.equal(/view|grid|layout/i.test(keys), false);
});

test('filter options are cached longer than discovery and keyed independently', () => {
  assert.ok(FILTER_OPTIONS_STALE_TIME >= 10 * 60 * 1000);
  assert.deepEqual(studentScholarshipKeys.filterOptions(), studentScholarshipKeys.filterOptions());
  assert.equal(JSON.stringify(studentScholarshipKeys.filterOptions()).includes('page'), false);
});

// --- T003a sort config -------------------------------------------------------

test('sort config exposes only newest and deadline_soon', () => {
  assert.deepEqual(
    getVisibleSortOptions(discoverySortOptions).map((option) => option.value),
    ['newest', 'deadline_soon']
  );
  assert.deepEqual(discoverySorts, ['newest', 'deadline_soon']);
  for (const option of discoverySortOptions) assert.equal(typeof option.labelKey, 'string');
});

test('a hidden future match sort does not change visible options or URL parsing', () => {
  const withMatch = [
    ...discoverySortOptions,
    { value: 'match', labelKey: 'sort.match', available: false },
  ];
  assert.deepEqual(getVisibleSortOptions(withMatch), getVisibleSortOptions(discoverySortOptions));
  assert.equal(parse('sort=match').sort, 'newest');
});
