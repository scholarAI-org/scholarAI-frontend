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
  discoveryUpdates,
  normalizeDiscoveryQuery,
  parseDiscoveryQuery,
  planDiscoveryNavigation,
  serializeDiscoveryQuery,
  toDiscoveryRequestParams,
  withFilterChange,
  withPage,
  withSearch,
  withSort,
} = load('lib/discovery-query-state.ts');
const { withClearedFilters } = load('lib/discovery-query-state.ts');
const { SEARCH_DEBOUNCE_MS, createDebouncer } = load('lib/debounce.ts');
const { resolveDraftFromUrl } = load('lib/search-draft.ts');
const { createDiscoveryNavigator } = load('lib/discovery-navigator.ts');
const { useScholarshipFilterOptions } = load('hooks/useScholarshipFilterOptions.ts');
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
      '&country=Germany&country=Germany&country=&country=%20%20&country=United%20Kingdom'
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

test('country values round-trip exactly as filter-options returns them', async () => {
  const query = parse('country=%20X%20&country=X&country=%20%20%20&country=%20X%20');
  assert.deepEqual(query.countries, [' X ', 'X']);
  assert.deepEqual(serializeDiscoveryQuery(query).getAll('country'), [' X ', 'X']);
  assert.deepEqual(parse(serializeDiscoveryQuery(query).toString()).countries, [' X ', 'X']);
  assert.deepEqual(
    withFilterChange(defaultDiscoveryQuery, { countries: [' X ', '   ', ''] }).countries,
    [' X ']
  );

  mockFetch({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 });
  await getScholarships(query);
  assert.deepEqual(calls[0].url.searchParams.getAll('country'), [' X ', 'X']);
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

test('each update helper maps to its navigation mode', () => {
  const modes = Object.fromEntries(
    Object.entries(discoveryUpdates).map(([action, { update, mode }]) => [
      action,
      `${update.name}:${mode}`,
    ])
  );
  assert.deepEqual(modes, {
    setSearch: 'withSearch:replace',
    setFilters: 'withFilterChange:push',
    setSort: 'withSort:push',
    setPage: 'withPage:push',
    clearFilters: 'withClearedFilters:push',
    reconcilePage: 'withPage:replace',
  });
  assert.equal(discoveryUpdates.setSearch.update, withSearch);
  assert.equal(discoveryUpdates.setFilters.update, withFilterChange);
  assert.equal(discoveryUpdates.setSort.update, withSort);
  assert.equal(discoveryUpdates.setPage.update, withPage);
});

test('navigation plan carries the mode and skips unchanged URLs', () => {
  const path = '/student/scholarships';
  const base = parse('country=Germany&page=3');
  assert.deepEqual(planDiscoveryNavigation(path, base, withPage(base, 4), 'push'), {
    href: '/student/scholarships?country=Germany&page=4',
    mode: 'push',
  });
  assert.deepEqual(planDiscoveryNavigation(path, base, withSearch(base, 'ai'), 'replace'), {
    href: '/student/scholarships?search=ai&country=Germany',
    mode: 'replace',
  });
  assert.equal(planDiscoveryNavigation(path, base, withPage(base, 3), 'push'), null);
  // Blank search on page 3 still navigates because it resets the page; on page 1 it is a no-op.
  assert.equal(
    planDiscoveryNavigation(path, base, withSearch(base, '   '), 'replace')?.href,
    '/student/scholarships?country=Germany'
  );
  const firstPage = parse('country=Germany');
  assert.equal(
    planDiscoveryNavigation(path, firstPage, withSearch(firstPage, '   '), 'replace'),
    null
  );
  assert.equal(
    planDiscoveryNavigation(path, base, withFilterChange(base, { countries: ['Germany'] }), 'push')
      ?.href,
    '/student/scholarships?country=Germany'
  );
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

// --- Search debounce (T025) ----------------------------------------------------

test('debounced search commits once, about 300ms after the last keystroke', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const commits = [];
  const debouncer = createDebouncer(SEARCH_DEBOUNCE_MS, (value) => commits.push(value));
  assert.equal(SEARCH_DEBOUNCE_MS, 300);

  for (const draft of ['m', 'me', 'med', 'medi']) {
    debouncer.schedule(draft);
    t.mock.timers.tick(100);
  }
  assert.deepEqual(commits, [], 'no commit while typing');
  t.mock.timers.tick(199);
  assert.deepEqual(commits, [], 'not before 300ms of idle time');
  t.mock.timers.tick(1);
  assert.deepEqual(commits, ['medi'], 'one commit with the last draft');
  assert.equal(debouncer.isPending(), false);
});

test('Enter flushes immediately and drops the pending commit', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const commits = [];
  const debouncer = createDebouncer(SEARCH_DEBOUNCE_MS, (value) => commits.push(value));
  debouncer.schedule('law');
  debouncer.flush('law');
  t.mock.timers.tick(1000);
  assert.deepEqual(commits, ['law']);
});

test('cancel (unmount or URL change) prevents a pending commit', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const commits = [];
  const debouncer = createDebouncer(SEARCH_DEBOUNCE_MS, (value) => commits.push(value));
  debouncer.schedule('physics');
  assert.equal(debouncer.isPending(), true);
  debouncer.cancel();
  t.mock.timers.tick(1000);
  assert.deepEqual(commits, []);
  assert.equal(debouncer.isPending(), false);
});

// --- Draft re-sync (T025) --------------------------------------------------------

test('the search draft re-syncs from the URL only when the URL means something else', () => {
  // Our own debounced commit: keep the student's typing, including a trailing space.
  assert.equal(resolveDraftFromUrl('data ', 'data'), 'data ');
  assert.equal(resolveDraftFromUrl('  data   science', 'data science'), '  data   science');
  // Back/Forward or an external change: take the URL value.
  assert.equal(resolveDraftFromUrl('data science', 'medicine'), 'medicine');
  assert.equal(resolveDraftFromUrl('data', undefined), '');
  assert.equal(resolveDraftFromUrl('   ', undefined), '   ');
  assert.equal(resolveDraftFromUrl('', 'law'), 'law');
});

// --- Router wiring (T021) --------------------------------------------------------

const fakeRouter = () => {
  const calls = [];
  return {
    calls,
    push: (href, options) => calls.push(['push', href, options]),
    replace: (href, options) => calls.push(['replace', href, options]),
  };
};

test('navigator uses replace for search and push for filters, sort, page and clear', () => {
  const path = '/student/scholarships';
  const query = parse('country=Germany&page=3');
  const router = fakeRouter();
  const nav = createDiscoveryNavigator(router, path, query);

  nav.setSearch('ai');
  nav.setFilters({ fundingTypes: ['full'] });
  nav.setSort('deadline_soon');
  nav.setPage(4);
  nav.clearFilters();

  assert.deepEqual(router.calls, [
    ['replace', `${path}?search=ai&country=Germany`, { scroll: false }],
    ['push', `${path}?funding_type=full&country=Germany`, { scroll: false }],
    ['push', `${path}?country=Germany&sort=deadline_soon`, { scroll: false }],
    ['push', `${path}?country=Germany&page=4`, { scroll: false }],
    ['push', path, { scroll: false }],
  ]);
});

test('navigator resets page to 1 for filter and sort changes and skips no-op changes', () => {
  const path = '/student/scholarships';
  const query = parse('search=ai&sort=deadline_soon&page=5');
  const router = fakeRouter();
  const nav = createDiscoveryNavigator(router, path, query);

  nav.setFilters({ academicLevels: ['master'] });
  nav.setSort('newest');
  assert.deepEqual(
    router.calls.map(([, href]) => new URL(href, 'https://x.test').searchParams.get('page')),
    [null, null]
  );

  const before = router.calls.length;
  assert.equal(nav.setPage(5), null);
  // On page 1 the same sort and an equivalent search do not change the URL.
  const firstPage = createDiscoveryNavigator(router, path, parse('search=ai&sort=deadline_soon'));
  assert.equal(firstPage.setSort('deadline_soon'), null);
  assert.equal(firstPage.setSearch(' ai '), null);
  assert.equal(router.calls.length, before, 'no navigation when the URL would not change');
});

test('clear all resets filters and page but keeps search and sort', () => {
  const query = parse(
    'search=ai&academic_level=phd&funding_type=full&opportunity_type=training&country=%20X%20&sort=deadline_soon&page=4'
  );
  const cleared = withClearedFilters(query);
  assert.deepEqual(cleared, { ...defaultDiscoveryQuery, search: 'ai', sort: 'deadline_soon' });
});

test('Back/Forward: the query is derived from the URL alone', () => {
  const history = [
    '',
    'country=Germany',
    'funding_type=full&country=Germany',
    'country=Germany&page=2',
  ];
  const queries = history.map(parse);
  // Going back to an entry yields exactly the state that entry was pushed with.
  for (const [index, search] of history.entries()) {
    assert.deepEqual(parse(search), queries[index]);
    assert.equal(serializeDiscoveryQuery(queries[index]).toString(), search);
  }
});

// --- Country options independence (T018/T028) -------------------------------------

test('country options are keyed and fetched independently of discovery params', () => {
  assert.equal(useScholarshipFilterOptions.length, 0, 'the hook takes no discovery input');
  const keys = [
    parse(''),
    parse('country=Germany'),
    withFilterChange(parse('page=3'), { academicLevels: ['phd'] }),
    withSort(parse(''), 'deadline_soon'),
    withSearch(parse(''), 'law'),
  ].map(() => JSON.stringify(studentScholarshipKeys.filterOptions()));
  assert.equal(new Set(keys).size, 1);
  assert.notDeepEqual(
    studentScholarshipKeys.filterOptions(),
    studentScholarshipKeys.discovery(parse('')).slice(0, 2)
  );
});

// --- Filters (T026) ---------------------------------------------------------------

test('toggling a checkbox adds or removes one value and keeps order', () => {
  const { toggleValue } = load('lib/filter-values.ts');
  assert.deepEqual(toggleValue([], 'master'), ['master']);
  assert.deepEqual(toggleValue(['bachelor', 'master'], 'phd'), ['bachelor', 'master', 'phd']);
  assert.deepEqual(toggleValue(['bachelor', 'master', 'phd'], 'master'), ['bachelor', 'phd']);
  assert.deepEqual(toggleValue([' X '], 'X'), [' X ', 'X'], 'exact string match');
});

test('every filter value has a label in both locales', () => {
  const read = (locale) =>
    JSON.parse(fs.readFileSync(path.join(srcPath, `messages/${locale}.json`), 'utf8'))
      .StudentScholarshipDiscovery.filters;
  const { academicLevels, fundingTypes, opportunityTypes } = load('constants.ts');
  for (const locale of ['ar', 'en']) {
    const filters = read(locale);
    for (const [group, values] of [
      ['academicLevel', academicLevels],
      ['funding', fundingTypes],
      ['opportunity', opportunityTypes],
    ]) {
      assert.ok(filters[group].legend, `${locale} ${group}.legend`);
      for (const value of values) assert.ok(filters[group][value], `${locale} ${group}.${value}`);
    }
  }
});

// --- Countries (T027/T028) ------------------------------------------------------

test('country options keep backend strings unchanged and add selected values from the URL', () => {
  const { mergeCountryOptions } = load('lib/filter-values.ts');
  assert.deepEqual(mergeCountryOptions(['Germany', ' Côte d’Ivoire '], []), [
    'Germany',
    ' Côte d’Ivoire ',
  ]);
  assert.deepEqual(mergeCountryOptions(['Germany'], ['Germany', 'Atlantis']), [
    'Germany',
    'Atlantis',
  ]);
  assert.deepEqual(mergeCountryOptions([], [' X ']), [' X '], 'still removable when options fail');
  assert.deepEqual(mergeCountryOptions(['X', 'X'], ['x']), ['X', 'x'], 'exact, case-sensitive');
});

test('selecting countries serializes repeated country params unchanged and resets the page', () => {
  const router = fakeRouter();
  const nav = createDiscoveryNavigator(router, '/student/scholarships', parse('page=4'));
  nav.setFilters({ countries: [' Côte d’Ivoire ', 'Germany'] });
  const url = new URL(router.calls[0][1], 'https://x.test');
  assert.equal(router.calls[0][0], 'push');
  assert.deepEqual(url.searchParams.getAll('country'), [' Côte d’Ivoire ', 'Germany']);
  assert.equal(url.searchParams.get('page'), null);
});

// --- View toggle (T024/T034) ------------------------------------------------------

test('switching Grid/List never refetches results or country options', async () => {
  const { QueryClient, QueryObserver } = loadModule('@tanstack/react-query');
  const { discoveryQueryOptions, filterOptionsQueryOptions } = load('lib/queries.ts');
  const hits = { discovery: 0, filterOptions: 0 };
  globalThis.fetch = async (url) => {
    const { pathname } = new URL(url);
    const isOptions = pathname.endsWith('/filter-options');
    hits[isOptions ? 'filterOptions' : 'discovery'] += 1;
    const body = isOptions
      ? { countries: ['Germany'] }
      : { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 };
    return new Response(JSON.stringify(body), { status: 200 });
  };

  const client = new QueryClient();
  const query = parse('country=Germany&sort=deadline_soon');
  // What ScholarshipDiscoveryPage does on every render: options come from the URL
  // query only. The Grid/List view is not an input to either builder.
  const render = (view) => {
    void view;
    return [discoveryQueryOptions(query), filterOptionsQueryOptions()];
  };
  const [discoveryOptions, countryOptions] = render('grid');
  const discovery = new QueryObserver(client, discoveryOptions);
  const countries = new QueryObserver(client, countryOptions);
  const unsubscribe = [discovery.subscribe(() => {}), countries.subscribe(() => {})];
  const settled = () =>
    discovery.getCurrentResult().status === 'success' &&
    countries.getCurrentResult().status === 'success';
  for (let i = 0; i < 200 && !settled(); i += 1) await new Promise((r) => setTimeout(r, 5));
  assert.ok(settled(), 'both queries resolved');
  assert.deepEqual(hits, { discovery: 1, filterOptions: 1 });

  for (const view of ['list', 'grid', 'list', 'grid']) {
    const [nextDiscovery, nextCountries] = render(view);
    discovery.setOptions(nextDiscovery);
    countries.setOptions(nextCountries);
    await new Promise((r) => setTimeout(r, 20));
  }
  assert.deepEqual(hits, { discovery: 1, filterOptions: 1 }, 'no refetch on view changes');
  assert.equal(discoveryQueryOptions.length, 1, 'discovery options take only the URL query');
  assert.equal(filterOptionsQueryOptions.length, 0, 'country options take no input');

  unsubscribe.forEach((stop) => stop());
  client.clear();
});

// --- Cards and images (T031-T035) ---------------------------------------------------

test('image URLs: only absolute http(s) URLs are rendered', () => {
  const { getSafeImageUrl } = load('lib/image-url.ts');
  assert.equal(getSafeImageUrl('https://cdn.example.org/a.png'), 'https://cdn.example.org/a.png');
  assert.equal(getSafeImageUrl('  http://example.org/b.jpg  '), 'http://example.org/b.jpg');
  for (const bad of [
    undefined,
    null,
    '',
    '   ',
    '/uploads/a.png',
    '//cdn.example.org/a.png',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'ftp://example.org/a.png',
    'not a url',
  ]) {
    assert.equal(getSafeImageUrl(bad), null, String(bad));
  }
});

test('the image fallback is a local asset and the img exception exists exactly once', () => {
  const imageSource = fs.readFileSync(
    path.join(featurePath, 'components/ScholarshipImage.tsx'),
    'utf8'
  );
  assert.match(imageSource, /FALLBACK_SRC = '\/images\/student\/scholarship-image-fallback\.svg'/);
  assert.ok(
    fs.existsSync(path.join(srcPath, '../public/images/student/scholarship-image-fallback.svg'))
  );
  assert.match(imageSource, /loading="lazy"/);
  assert.match(imageSource, /alt=\{showFallback \? '' : alt\}/);

  const walk = (dir) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((entry) =>
        entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
      );
  // Feature 005 code (the student area). The profile avatar's older exception in
  // components/profile/ProfileSummaryCard.tsx predates this feature.
  const suppressions = walk(path.join(srcPath, 'features/student')).filter(
    (file) => /\.(t|j)sx?$/.test(file) && fs.readFileSync(file, 'utf8').includes('no-img-element')
  );
  assert.deepEqual(
    suppressions.map((file) => path.relative(srcPath, file)),
    ['features/student/scholarship-discovery/components/ScholarshipImage.tsx']
  );
  assert.equal(imageSource.match(/eslint-disable/g)?.length, 1);
  const eslintConfig = fs.readFileSync(path.join(srcPath, '../eslint.config.mjs'), 'utf8');
  assert.equal(eslintConfig.includes('no-img-element'), false, 'no global rule change');
});

test('details links stay off until the details route exists (and vice versa)', () => {
  const { SCHOLARSHIP_DETAILS_ROUTE_ENABLED, getScholarshipDetailsHref } =
    load('lib/details-link.ts');
  const routeExists = fs.existsSync(
    path.join(srcPath, 'app/[locale]/student/scholarships/[id]/page.tsx')
  );
  assert.equal(
    SCHOLARSHIP_DETAILS_ROUTE_ENABLED,
    routeExists,
    routeExists
      ? 'the [id] route exists: enable SCHOLARSHIP_DETAILS_ROUTE_ENABLED'
      : 'no [id] route yet: details links must stay disabled'
  );
  if (!SCHOLARSHIP_DETAILS_ROUTE_ENABLED) {
    assert.equal(getScholarshipDetailsHref(7), null);
  } else {
    assert.equal(getScholarshipDetailsHref(7), '/student/scholarships/7');
    assert.equal(getScholarshipDetailsHref(0), null);
  }
});

test('the match badge shows only authoritative data and nothing by default', () => {
  const { getMatchBadgeDisplay } = load('lib/match-badge.ts');
  assert.equal(getMatchBadgeDisplay(undefined), null);
  assert.equal(getMatchBadgeDisplay(null), null);
  assert.equal(getMatchBadgeDisplay({}), null);
  assert.equal(getMatchBadgeDisplay({ score: null, level: null, reasons: [] }), null);
  assert.equal(getMatchBadgeDisplay({ level: 'very-high' }), null);
  assert.equal(getMatchBadgeDisplay({ score: Number.NaN }), null);
  // A future authoritative fixture renders as given.
  assert.deepEqual(getMatchBadgeDisplay({ level: 'high', score: 86.6 }), {
    level: 'high',
    score: 87,
  });
  assert.deepEqual(getMatchBadgeDisplay({ score: 40 }), { level: undefined, score: 40 });
  // The adapter never supplies match data in Feature 005.
  assert.equal(toScholarshipCard({ id: 1, title: 'T', is_saved: false }, 'en').match, null);
});

test('rule A1: known values are translated in any case, others shown raw, blanks hidden', () => {
  const { getFundingLabel, getStudyLevelLabel } = load('lib/card-labels.ts');
  // Known enum values, any letter case or surrounding space.
  assert.deepEqual(getFundingLabel('FULL'), { kind: 'translated', key: 'filters.funding.full' });
  assert.deepEqual(getFundingLabel('Full'), { kind: 'translated', key: 'filters.funding.full' });
  assert.deepEqual(getFundingLabel(' partial '), {
    kind: 'translated',
    key: 'filters.funding.partial',
  });
  assert.deepEqual(getStudyLevelLabel('Master'), {
    kind: 'translated',
    key: 'filters.academicLevel.master',
  });
  assert.deepEqual(getStudyLevelLabel('PHD'), {
    kind: 'translated',
    key: 'filters.academicLevel.phd',
  });
  assert.deepEqual(getStudyLevelLabel('exchange'), {
    kind: 'translated',
    key: 'filters.academicLevel.exchange',
  });
  // Unknown values: shown exactly as received.
  for (const raw of ['ممولة بالكامل', 'Self-funded', 'Fully Funded']) {
    assert.deepEqual(getFundingLabel(raw), { kind: 'raw', text: raw });
  }
  for (const raw of ['ماجستير ودكتوراه', 'Master, PhD', 'Diploma']) {
    assert.deepEqual(getStudyLevelLabel(raw), { kind: 'raw', text: raw });
  }
  // Hidden only for null, empty or blank (or a non-string from a malformed card).
  for (const empty of [null, undefined, '', '   ', 42]) {
    assert.equal(getFundingLabel(empty), null, String(empty));
    assert.equal(getStudyLevelLabel(empty), null, String(empty));
  }
  // The adapter keeps both fields for the card; blanks become absent.
  const card = toScholarshipCard(
    { id: 9, title: 'T', is_saved: false, funding_type: 'FULL', study_level: 'ماجستير ودكتوراه' },
    'ar'
  );
  assert.equal(card.fundingType, 'FULL');
  assert.equal(card.studyLevel, 'ماجستير ودكتوراه');
  const blank = toScholarshipCard(
    { id: 9, title: 'T', is_saved: false, funding_type: '  ', study_level: null },
    'ar'
  );
  assert.equal(blank.fundingType, undefined);
  assert.equal(blank.studyLevel, undefined);
});

test('the card adapter tolerates wrongly typed optional fields', () => {
  const model = toScholarshipCard(
    {
      id: 3,
      title: 'Scholarship',
      is_saved: false,
      country: 42,
      image_url: { href: 'x' },
      deadline: 20261231,
      no_deadline: 'yes',
      opportunity_type: 'internship',
      funding_type: ['full'],
    },
    'en'
  );
  assert.equal(model.country, undefined);
  assert.equal(model.imageUrl, undefined);
  assert.equal(model.deadline, undefined);
  assert.equal(model.noDeadline, false);
  assert.equal(model.opportunityType, undefined);
  assert.equal(model.fundingType, undefined);
});

// --- Deadlines (T041) ---------------------------------------------------------------

const deadlines = () => load('lib/deadlines.ts');
const withTimeZone = (timeZone, run) => {
  const previous = process.env.TZ;
  process.env.TZ = timeZone;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
};

test('deadline dates parse as calendar dates and reject malformed values', () => {
  const { parseCalendarDate } = deadlines();
  assert.deepEqual(parseCalendarDate('2026-12-31'), { year: 2026, month: 12, day: 31 });
  assert.deepEqual(parseCalendarDate(' 2028-02-29 '), { year: 2028, month: 2, day: 29 });
  for (const bad of [
    '2026-02-30',
    '2027-02-29',
    '2026-13-01',
    '2026-12-31T00:00:00Z',
    '31/12/2026',
    '',
    null,
    undefined,
  ]) {
    assert.equal(parseCalendarDate(bad), null, String(bad));
  }
});

test('deadline status covers no deadline, missing, past, today and days left', () => {
  const { getDeadlineStatus } = deadlines();
  withTimeZone('Asia/Gaza', () => {
    const now = new Date(2026, 9, 3, 12, 0); // 3 Oct 2026, local noon
    assert.deepEqual(getDeadlineStatus('2026-12-31', true, now), { kind: 'none' });
    assert.deepEqual(getDeadlineStatus(undefined, false, now), { kind: 'unspecified' });
    assert.deepEqual(getDeadlineStatus('not-a-date', false, now), { kind: 'unspecified' });
    assert.equal(getDeadlineStatus('2026-10-02', false, now).kind, 'past');
    assert.equal(getDeadlineStatus('2026-10-03', false, now).kind, 'today');
    assert.deepEqual(getDeadlineStatus('2026-10-04', false, now).daysLeft, 1);
    assert.deepEqual(getDeadlineStatus('2027-10-03', false, now).daysLeft, 365);
  });
});

test('days left flip exactly at local midnight, across a DST change', () => {
  const { getDeadlineStatus } = deadlines();
  withTimeZone('America/New_York', () => {
    // US DST ends on 1 Nov 2026; the count must still be whole calendar days.
    const beforeMidnight = new Date(2026, 9, 31, 23, 59, 59, 999);
    const atMidnight = new Date(2026, 10, 1, 0, 0, 0, 0);
    assert.equal(getDeadlineStatus('2026-11-02', false, beforeMidnight).daysLeft, 2);
    assert.equal(getDeadlineStatus('2026-11-02', false, atMidnight).daysLeft, 1);
    assert.equal(getDeadlineStatus('2026-11-01', false, beforeMidnight).daysLeft, 1);
    assert.equal(getDeadlineStatus('2026-11-01', false, atMidnight).kind, 'today');
  });
});

test('the same instant gives each time zone its own "today", never a UTC shift', () => {
  const { getDeadlineStatus } = deadlines();
  const instant = new Date('2026-12-31T07:30:00Z');
  const status = (timeZone) =>
    withTimeZone(timeZone, () => {
      assert.equal(instant.getTimezoneOffset() === 0, timeZone === 'UTC', `TZ ${timeZone} active`);
      return getDeadlineStatus('2026-12-31', false, instant);
    });
  assert.deepEqual(status('America/Los_Angeles'), {
    kind: 'upcoming',
    date: { year: 2026, month: 12, day: 31 },
    daysLeft: 1,
  }); // still 30 Dec locally
  assert.equal(status('UTC').kind, 'today');
  assert.equal(status('Asia/Gaza').kind, 'today');
  assert.equal(status('Pacific/Kiritimati').kind, 'today'); // 21:30 on 31 Dec locally (UTC+14)
  const later = new Date('2026-12-31T10:30:00Z'); // 00:30 on 1 Jan in UTC+14
  withTimeZone('Pacific/Kiritimati', () => {
    assert.equal(getDeadlineStatus('2026-12-31', false, later).kind, 'past');
  });
  withTimeZone('America/Los_Angeles', () => {
    assert.equal(getDeadlineStatus('2026-12-31', false, later).kind, 'today'); // 02:30 on 31 Dec
  });
});

test('deadline dates format as the stored day with Latin digits in every time zone', () => {
  const { formatCalendarDate, toIsoCalendarDate } = deadlines();
  const date = { year: 2026, month: 12, day: 31 };
  for (const timeZone of ['America/Los_Angeles', 'UTC', 'Asia/Gaza', 'Pacific/Kiritimati']) {
    withTimeZone(timeZone, () => {
      const ar = formatCalendarDate(date, 'ar');
      assert.match(ar, /31/, `${timeZone}: ${ar}`);
      assert.match(ar, /2026/);
      assert.equal(/[٠-٩]/.test(ar), false, `Latin digits: ${ar}`);
      assert.match(formatCalendarDate(date, 'en'), /December 31, 2026/);
    });
  }
  assert.equal(toIsoCalendarDate({ year: 2026, month: 1, day: 5 }), '2026-01-05');
});

// --- Pagination (T042/T043) ----------------------------------------------------------

const pagesOf = (items) => items.map((item) => (item.type === 'page' ? item.page : '…'));

test('page window: small, first, middle, last and large ranges', () => {
  const { getPageWindow } = load('lib/pagination.ts');
  assert.deepEqual(pagesOf(getPageWindow(1, 0)), []);
  assert.deepEqual(pagesOf(getPageWindow(1, 1)), [1]);
  assert.deepEqual(pagesOf(getPageWindow(2, 3)), [1, 2, 3]);
  assert.deepEqual(pagesOf(getPageWindow(4, 7)), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(pagesOf(getPageWindow(1, 10)), [1, 2, 3, 4, 5, '…', 10]);
  assert.deepEqual(pagesOf(getPageWindow(4, 10)), [1, '…', 3, 4, 5, '…', 10]);
  assert.deepEqual(pagesOf(getPageWindow(5, 10)), [1, '…', 4, 5, 6, '…', 10]);
  assert.deepEqual(pagesOf(getPageWindow(7, 10)), [1, '…', 6, 7, 8, '…', 10]);
  assert.deepEqual(pagesOf(getPageWindow(10, 10)), [1, '…', 6, 7, 8, 9, 10]);
  assert.deepEqual(pagesOf(getPageWindow(250, 500)), [1, '…', 249, 250, 251, '…', 500]);
  // Out-of-range or invalid current pages are clamped for display only.
  assert.deepEqual(pagesOf(getPageWindow(99, 10)), [1, '…', 6, 7, 8, 9, 10]);
  assert.deepEqual(pagesOf(getPageWindow(0, 10)), [1, 2, 3, 4, 5, '…', 10]);
  // Bounded: never more than 7 slots with one sibling, and keys stay unique.
  for (let total = 1; total <= 40; total += 1) {
    for (let current = 1; current <= total; current += 1) {
      const items = getPageWindow(current, total);
      assert.ok(items.length <= 7, `${current}/${total}`);
      assert.ok(items.some((item) => item.type === 'page' && item.page === current));
      const keys = items.map((item) => (item.type === 'page' ? item.page : item.key));
      assert.equal(new Set(keys).size, keys.length);
    }
  }
});

test('out-of-range pages reconcile to the last page, or page 1 with no results', () => {
  const { getOutOfRangeTarget } = load('lib/pagination.ts');
  assert.equal(getOutOfRangeTarget(3, 5), null);
  assert.equal(getOutOfRangeTarget(5, 5), null);
  assert.equal(getOutOfRangeTarget(9, 5), 5);
  assert.equal(getOutOfRangeTarget(1, 0), null);
  assert.equal(getOutOfRangeTarget(4, 0), 1);
});

test('the out-of-range notice survives the reconciling replace and clears afterwards', () => {
  const { reduceOutOfRangeNotice } = load('lib/pagination.ts');
  const source = 'country=Germany&page=9';
  const target = 'country=Germany&page=3';
  const detected = { requested: 9, page: 3, targetKey: target };

  const first = reduceOutOfRangeNotice(null, source, detected);
  assert.deepEqual(first, { requested: 9, page: 3, sourceKey: source, targetKey: target });
  // Stable across re-renders (no render loop).
  assert.equal(reduceOutOfRangeNotice(first, source, detected), first);
  // After the replace, the target page is valid: keep the notice.
  assert.equal(reduceOutOfRangeNotice(first, target, null), first);
  // Any further navigation clears it.
  assert.equal(reduceOutOfRangeNotice(first, 'country=Germany&page=2', null), null);
  assert.equal(reduceOutOfRangeNotice(null, target, null), null);
});

test('reconciling an out-of-range page uses replace, so Back skips the invalid page', () => {
  const router = fakeRouter();
  const nav = createDiscoveryNavigator(
    router,
    '/student/scholarships',
    parse('country=Germany&page=9')
  );
  nav.reconcilePage(3);
  assert.deepEqual(router.calls, [
    ['replace', '/student/scholarships?country=Germany&page=3', { scroll: false }],
  ]);
  const toFirst = createDiscoveryNavigator(router, '/student/scholarships', parse('page=4'));
  toFirst.reconcilePage(1);
  assert.deepEqual(router.calls.at(-1), ['replace', '/student/scholarships', { scroll: false }]);
});

// --- Data states (T044-T047) ---------------------------------------------------------

const responseOf = (items, overrides = {}) => ({
  items,
  total: items.length,
  page: 1,
  page_size: 20,
  total_pages: items.length ? 1 : 0,
  ...overrides,
});
const validItem = { id: 1, title: 'Scholarship', is_saved: false };

test('results state: loading, updating with previous results, and settled results', () => {
  const { getDiscoveryResultsState } = load('lib/results-state.ts');
  const base = { query: parse(''), error: null, isFetching: false, isPlaceholderData: false };
  assert.deepEqual(getDiscoveryResultsState({ ...base, data: undefined, isFetching: true }), {
    kind: 'loading',
  });
  // keepPreviousData: the old page stays visible while the new one loads.
  assert.deepEqual(
    getDiscoveryResultsState({
      ...base,
      data: responseOf([validItem]),
      isFetching: true,
      isPlaceholderData: true,
    }),
    { kind: 'results', updating: true, refreshError: null }
  );
  // A previous empty page is not shown as "no matches" for the next query.
  assert.deepEqual(
    getDiscoveryResultsState({
      ...base,
      data: responseOf([]),
      isFetching: true,
      isPlaceholderData: true,
    }),
    { kind: 'loading' }
  );
  assert.deepEqual(getDiscoveryResultsState({ ...base, data: responseOf([validItem]) }), {
    kind: 'results',
    updating: false,
    refreshError: null,
  });
  assert.deepEqual(
    getDiscoveryResultsState({ ...base, data: responseOf([validItem]), isFetching: true }),
    { kind: 'results', updating: true, refreshError: null }
  );
});

test('results state: each error type, and errors never look like empty results', () => {
  const { getDiscoveryResultsState, getDiscoveryErrorReason } = load('lib/results-state.ts');
  const base = { query: parse('country=Germany'), isFetching: false, isPlaceholderData: false };
  const errorFor = (status) => new ApiError('x', [], status);
  assert.equal(getDiscoveryErrorReason(errorFor(401)), 'unauthorized');
  assert.equal(getDiscoveryErrorReason(errorFor(403)), 'forbidden');
  assert.equal(getDiscoveryErrorReason(errorFor(422)), 'validation');
  assert.equal(getDiscoveryErrorReason(errorFor(500)), 'generic');
  assert.equal(getDiscoveryErrorReason(new TypeError('Failed to fetch')), 'generic');
  for (const [status, reason] of [
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [422, 'validation'],
    [503, 'generic'],
  ]) {
    assert.deepEqual(
      getDiscoveryResultsState({ ...base, data: undefined, error: errorFor(status) }),
      {
        kind: 'error',
        reason,
      }
    );
  }
  // A malformed response is an error, not an empty list.
  for (const data of [
    {},
    { items: 'x', total: 0, page: 1, total_pages: 0 },
    { items: [], total: '3' },
  ]) {
    assert.deepEqual(getDiscoveryResultsState({ ...base, data, error: null }), {
      kind: 'error',
      reason: 'generic',
    });
  }
  // A failed background refresh keeps the results and reports the error inline.
  assert.deepEqual(
    getDiscoveryResultsState({ ...base, data: responseOf([validItem]), error: errorFor(500) }),
    { kind: 'results', updating: false, refreshError: 'generic' }
  );
});

test('results state: noScholarships vs noMatches, and out-of-range before empty', () => {
  const { getDiscoveryResultsState } = load('lib/results-state.ts');
  const settled = (search, data) =>
    getDiscoveryResultsState({
      query: parse(search),
      data,
      error: null,
      isFetching: false,
      isPlaceholderData: false,
    });
  assert.deepEqual(settled('', responseOf([])), { kind: 'empty', variant: 'noScholarships' });
  assert.deepEqual(settled('sort=deadline_soon', responseOf([])), {
    kind: 'empty',
    variant: 'noScholarships',
  });
  assert.deepEqual(settled('search=zzz', responseOf([])), { kind: 'empty', variant: 'noMatches' });
  assert.deepEqual(settled('funding_type=partial', responseOf([])), {
    kind: 'empty',
    variant: 'noMatches',
  });
  assert.deepEqual(settled('country=%20X%20', responseOf([])), {
    kind: 'empty',
    variant: 'noMatches',
  });
  // Page 9 of 3: reconcile, do not claim "no matches".
  assert.deepEqual(settled('page=9', responseOf([], { total: 45, total_pages: 3, page: 9 })), {
    kind: 'outOfRange',
    lastPage: 3,
  });
  assert.deepEqual(settled('page=2', responseOf([], { total: 0, total_pages: 0, page: 2 })), {
    kind: 'outOfRange',
    lastPage: 1,
  });
});

test('malformed cards are skipped and reported without breaking the list', () => {
  const { toScholarshipCardEntries, isDiscoveryCardShape } = load('adapters/scholarship.ts');
  const entries = toScholarshipCardEntries(
    [
      validItem,
      null,
      'card',
      { id: 0, title: 'x', is_saved: false },
      { id: 2.5, title: 'x', is_saved: false },
      { id: 3, title: 42, is_saved: false },
      { id: 4, title: 'x' },
      { id: 5, title: '   ', is_saved: true },
    ],
    'en'
  );
  assert.deepEqual(
    entries.map((entry) => (entry.kind === 'card' ? entry.card.id : entry.key)),
    [1, 'malformed-1', 'malformed-2', 'malformed-3', 'malformed-4', 'malformed-5', 'malformed-6', 5]
  );
  assert.equal(entries.at(-1).card.title, undefined, 'blank title falls back to card.untitled');
  assert.equal(isDiscoveryCardShape(validItem), true);
});

test('hasActiveFilters ignores search and sort; hasActiveSearchOrFilters includes search', () => {
  const { hasActiveFilters, hasActiveSearchOrFilters } = load('lib/results-state.ts');
  assert.equal(hasActiveFilters(parse('search=ai&sort=deadline_soon')), false);
  assert.equal(hasActiveSearchOrFilters(parse('search=ai')), true);
  assert.equal(hasActiveFilters(parse('academic_level=phd')), true);
  assert.equal(hasActiveSearchOrFilters(parse('sort=deadline_soon&page=2')), false);
});

// --- History-based navigation (no RSC round-trip) -------------------------------------

const fakeWindow = (initial) => {
  const url = new URL(initial, 'https://app.test');
  const entries = [];
  const apply = (kind) => (state, unused, href) => {
    entries.push([kind, href]);
    const next = new URL(href, url);
    url.pathname = next.pathname;
    url.search = next.search;
  };
  return {
    entries,
    location: url,
    history: { pushState: apply('push'), replaceState: apply('replace') },
  };
};

test('the history router writes the locale-prefixed URL and skips the current URL', () => {
  const { createHistoryRouter } = load('lib/history-router.ts');
  const win = fakeWindow('/ar/student/scholarships');
  const router = createHistoryRouter(() => win);
  router.push('/ar/student/scholarships?academic_level=master');
  router.push('/ar/student/scholarships?academic_level=master'); // already there
  router.replace('/ar/student/scholarships?academic_level=master'); // already there
  router.replace('/ar/student/scholarships?academic_level=master&page=2');
  assert.deepEqual(win.entries, [
    ['push', '/ar/student/scholarships?academic_level=master'],
    ['replace', '/ar/student/scholarships?academic_level=master&page=2'],
  ]);
});

test('one user action creates exactly one history entry, even from a stale render', () => {
  const { createHistoryRouter } = load('lib/history-router.ts');
  const win = fakeWindow('/ar/student/scholarships');
  const router = createHistoryRouter(() => win);
  const path = '/ar/student/scholarships';
  const staleQuery = parse('');

  // First click: one push.
  createDiscoveryNavigator(router, path, staleQuery).setFilters({ academicLevels: ['master'] });
  // A second click lands before React re-renders with the new URL: same target, no entry.
  createDiscoveryNavigator(router, path, staleQuery).setFilters({ academicLevels: ['master'] });
  assert.deepEqual(win.entries, [['push', '/ar/student/scholarships?academic_level=master']]);

  // From the updated URL, unticking is one more entry; nothing else navigates.
  const current = parse(win.location.search);
  createDiscoveryNavigator(router, path, current).setFilters({ academicLevels: [] });
  assert.deepEqual(win.entries.at(-1), ['push', '/ar/student/scholarships']);
  assert.equal(win.entries.length, 2);

  // Each navigator action makes at most one router call.
  const counting = {
    calls: 0,
    push() {
      this.calls += 1;
    },
    replace() {
      this.calls += 1;
    },
  };
  const nav = createDiscoveryNavigator(counting, path, parse('page=3&country=Germany'));
  for (const run of [
    () => nav.setSearch('ai'),
    () => nav.setFilters({ fundingTypes: ['full'] }),
    () => nav.setSort('deadline_soon'),
    () => nav.setPage(2),
    () => nav.clearFilters(),
    () => nav.reconcilePage(1),
  ]) {
    const before = counting.calls;
    run();
    assert.equal(counting.calls - before, 1);
  }
});

test('the URL-state hook uses the history router and the locale-prefixed pathname', () => {
  const source = fs.readFileSync(path.join(featurePath, 'hooks/useDiscoveryQueryState.ts'), 'utf8');
  assert.match(source, /createHistoryRouter\(\)/);
  assert.match(source, /from 'next\/navigation'/);
  assert.equal(
    /useRouter|router\.push|router\.replace/.test(source),
    false,
    'no Next router round-trip'
  );
});

// --- Canceled requests (React StrictMode double mount in dev) ---------------------------

test('a request canceled by an unmount never leaves the results in an error state', async () => {
  const { QueryClient, QueryObserver } = loadModule('@tanstack/react-query');
  const { discoveryQueryOptions } = load('lib/queries.ts');
  const { getDiscoveryResultsState } = load('lib/results-state.ts');
  const outcomes = [];
  globalThis.fetch = (url, init) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        outcomes.push('200');
        resolve(
          new Response(
            JSON.stringify({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 }),
            {
              status: 200,
            }
          )
        );
      }, 30);
      init.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        outcomes.push('canceled');
        reject(new DOMException('The user aborted a request.', 'AbortError'));
      });
    });

  const client = new QueryClient();
  const query = parse('');
  const seen = [];
  const watch = (observer) =>
    observer.subscribe((result) => {
      seen.push(result.status);
      seen.push(
        getDiscoveryResultsState({
          query,
          data: result.data,
          error: result.error,
          isFetching: result.isFetching,
          isPlaceholderData: result.isPlaceholderData,
        }).kind
      );
    });

  // StrictMode: mount, unmount (aborts the in-flight request), mount again.
  const first = new QueryObserver(client, discoveryQueryOptions(query));
  const stopFirst = watch(first);
  await new Promise((r) => setTimeout(r, 5));
  stopFirst();
  const second = new QueryObserver(client, discoveryQueryOptions(query));
  const stopSecond = watch(second);
  for (let i = 0; i < 100 && second.getCurrentResult().status !== 'success'; i += 1) {
    await new Promise((r) => setTimeout(r, 5));
  }

  assert.deepEqual(outcomes, ['canceled', '200']);
  assert.equal(second.getCurrentResult().status, 'success');
  assert.equal(second.getCurrentResult().error, null);
  assert.equal(seen.includes('error'), false, `states seen: ${seen.join(', ')}`);
  stopSecond();
  client.clear();
});

// --- Country dropdown keyboard movement (item 4) ---------------------------------------

test('dropdown arrow keys move between options and wrap; other keys do not move', () => {
  const { getRovingFocusIndex } = load('lib/roving-focus.ts');
  assert.equal(getRovingFocusIndex(-1, 4, 'ArrowDown'), 0);
  assert.equal(getRovingFocusIndex(0, 4, 'ArrowDown'), 1);
  assert.equal(getRovingFocusIndex(3, 4, 'ArrowDown'), 0);
  assert.equal(getRovingFocusIndex(0, 4, 'ArrowUp'), 3);
  assert.equal(getRovingFocusIndex(-1, 4, 'ArrowUp'), 3);
  assert.equal(getRovingFocusIndex(2, 4, 'ArrowUp'), 1);
  assert.equal(getRovingFocusIndex(2, 4, 'Home'), 0);
  assert.equal(getRovingFocusIndex(1, 4, 'End'), 3);
  assert.equal(getRovingFocusIndex(1, 4, ' '), null, 'Space toggles natively, no move');
  assert.equal(getRovingFocusIndex(1, 4, 'Tab'), null);
  assert.equal(getRovingFocusIndex(0, 0, 'ArrowDown'), null);
});

test('the country dropdown is an accessible overlay that keeps selected values', () => {
  const source = fs.readFileSync(path.join(featurePath, 'components/CountryFilter.tsx'), 'utf8');
  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.match(source, /aria-controls=\{panelId\}/);
  assert.match(source, /hidden=\{!isOpen\}/);
  assert.match(source, /absolute inset-x-0 top-full/, 'panel overlays instead of pushing content');
  assert.match(source, /event\.key === 'ArrowDown' && !isOpen/, 'ArrowDown opens');
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /addEventListener\('pointerdown'/, 'outside click closes');
  assert.match(source, /mergeCountryOptions\(options\.data\?\.countries \?\? \[\], selected\)/);
  for (const state of ['loading', 'unavailable', 'retry', 'empty']) {
    assert.match(source, new RegExp(`filters\\.country\\.${state}`), state);
  }
});
