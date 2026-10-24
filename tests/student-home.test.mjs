import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { IntlMessageFormat } from 'intl-messageformat';
import ts from 'typescript';

// Feature 009: Student Home. One file, labelled sections, one per phase/story.

// ----------------------------- harness -------------------------------------

const loadModule = createRequire(import.meta.url);

loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

loadModule.extensions['.tsx'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  module._compile(outputText, filename);
};

const srcPath = fileURLToPath(new URL('../src', import.meta.url));
const rootPath = fileURLToPath(new URL('..', import.meta.url));
const homePath = path.join(srcPath, 'features/student/home');

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith('@/') ? path.join(srcPath, request.slice(2)) : request;
  return resolveFilename.call(this, target, ...rest);
};

process.env.BACKEND_URL = 'https://backend.test/';

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(srcPath, rel), 'utf8'));
const messages = { en: readJson('messages/en.json'), ar: readJson('messages/ar.json') };

const React = loadModule('react');
const { renderToStaticMarkup } = loadModule('react-dom/server');
const { intlFormats } = loadModule(path.join(srcPath, 'i18n/formatting.ts'));

// Mutable view of the "request": tests set locale/pathname before rendering.
const env = { locale: 'en', pathname: '/student' };

const lookup = (namespace, key) =>
  `${namespace}.${key}`
    .split('.')
    .reduce((value, part) => (value && typeof value === 'object' ? value[part] : undefined), messages[env.locale]);

const nextIntlStub = {
  useLocale: () => env.locale,
  useTranslations: (namespace) => (key, values) => {
    const message = lookup(namespace, key);
    if (typeof message !== 'string') return `${namespace}.${key}`;
    return String(new IntlMessageFormat(message, env.locale, intlFormats).format(values));
  },
};

const navigationStub = {
  Link: ({ href, children, ...props }) =>
    React.createElement('a', { href: typeof href === 'string' ? href : href?.pathname, ...props }, children),
  usePathname: () => env.pathname,
  useRouter: () => ({ replace() {}, push() {}, prefetch() {} }),
};

const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === 'next-intl') return nextIntlStub;
  if (request === '@/i18n/navigation') return navigationStub;
  return originalLoad.call(this, request, parent, ...rest);
};

const loadSrc = (rel) => loadModule(path.join(srcPath, rel));
const loadHome = (rel) => loadModule(path.join(homePath, rel));

function withEnv(vars, fn) {
  const previous = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    if (vars[key] === undefined) delete process.env[key];
    else process.env[key] = vars[key];
  }
  try {
    return fn();
  } finally {
    for (const key of Object.keys(vars)) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

// The machine zone, captured before any test changes TZ. Deleting process.env.TZ
// does not restore it on every platform, so tests restore this explicitly.
const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
function withTimeZone(timeZone, fn) {
  process.env.TZ = timeZone;
  try {
    return fn();
  } finally {
    process.env.TZ = systemTimeZone;
  }
}

function render(element, { locale = 'en' } = {}) {
  env.locale = locale;
  return renderToStaticMarkup(element);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const rel = (file) => path.relative(rootPath, file).split(path.sep).join('/');

// Silence unused-helper lint in sections that are added in later phases.
void [assert, loadSrc, loadHome, withEnv, render, walk, rel, homePath, withTimeZone];

// ----------------------------- smoke ---------------------------------------

test('harness: modules, aliases and the next-intl stub work', () => {
  const { toFormattingLocale } = loadSrc('i18n/formatting.ts');
  assert.equal(toFormattingLocale('ar'), 'ar-u-nu-latn');
  const t = nextIntlStub.useTranslations('StudentLayout');
  assert.equal(t('brand.name'), 'PsScholar');
});

// ----------------------------- fixtures ------------------------------------

// A fixed "now" on the student's local clock (the derivations use local days).
const NOW = new Date(2026, 9, 24, 10, 0, 0);
const pad = (n) => String(n).padStart(2, '0');
const dateIn = (days, base = NOW) => {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const card = (id, overrides = {}) => ({
  id,
  title: `Scholarship ${id}`,
  title_ar: null,
  title_en: null,
  deadline: null,
  no_deadline: false,
  funding_type: 'full',
  study_level: ['master'],
  is_saved: true,
  ...overrides,
});
const tracked = (id, status, scholarship) => ({
  id: id * 10,
  status,
  notes: null,
  status_changed_at: '2026-10-20T08:00:00Z',
  created_at: '2026-10-01T08:00:00Z',
  updated_at: '2026-10-20T08:00:00Z',
  scholarship,
});

// ----------------------------- Phase 2: flag --------------------------------

test('flag: STUDENT_HOME_ENABLED is off unless the literal "true"', () => {
  const { featureFlags } = loadSrc('lib/feature-flags.ts');
  withEnv({ STUDENT_HOME_ENABLED: undefined }, () => assert.equal(featureFlags.studentHomeEnabled, false));
  for (const value of ['', 'false', '0', '1', 'yes', 'TRUE', ' true ', 'True']) {
    withEnv({ STUDENT_HOME_ENABLED: value }, () =>
      assert.equal(featureFlags.studentHomeEnabled, false, `value=${JSON.stringify(value)}`)
    );
  }
  withEnv({ STUDENT_HOME_ENABLED: 'true' }, () => assert.equal(featureFlags.studentHomeEnabled, true));
});

test('flag: static scan finds no NEXT_PUBLIC_ variant and no default-true fallback', () => {
  const flags = fs.readFileSync(path.join(srcPath, 'lib/feature-flags.ts'), 'utf8');
  assert.match(flags, /STUDENT_HOME_ENABLED/);
  assert.doesNotMatch(flags, /\|\|\s*true/);
  const offenders = walk(srcPath)
    .filter((file) => /NEXT_PUBLIC_(STUDENT_)?HOME/.test(fs.readFileSync(file, 'utf8')))
    .map(rel);
  assert.deepEqual(offenders, []);
  const example = fs.readFileSync(path.join(rootPath, '.env.example'), 'utf8');
  assert.match(example, /^STUDENT_HOME_ENABLED=\s*$/m);
  assert.match(example, /^HOME_MOCK_SECTIONS=\s*$/m);
});

// ----------------------------- Phase 2: mock gate (FR-040) ------------------

test('mock gate: the resolver returns [] in production, Vercel production/preview, or when unset', () => {
  const { resolveHomeMockSections } = loadHome('config/resolve-mock-sections.ts');
  const flag = 'notifications,activity,recommendations';
  assert.deepEqual(resolveHomeMockSections({ NODE_ENV: 'production', HOME_MOCK_SECTIONS: flag }), []);
  assert.deepEqual(
    resolveHomeMockSections({ NODE_ENV: 'development', VERCEL_ENV: 'production', HOME_MOCK_SECTIONS: flag }),
    []
  );
  assert.deepEqual(
    resolveHomeMockSections({ NODE_ENV: 'development', VERCEL_ENV: 'preview', HOME_MOCK_SECTIONS: flag }),
    []
  );
  for (const value of [undefined, '', '   ', ',,']) {
    assert.deepEqual(resolveHomeMockSections({ NODE_ENV: 'development', HOME_MOCK_SECTIONS: value }), []);
  }
  assert.deepEqual(resolveHomeMockSections({}), []);
});

test('mock gate: the resolver trims, lower-cases, de-duplicates and drops unknown names', () => {
  const { resolveHomeMockSections } = loadHome('config/resolve-mock-sections.ts');
  assert.deepEqual(
    resolveHomeMockSections({ NODE_ENV: 'development', HOME_MOCK_SECTIONS: ' Notifications , ACTIVITY ,activity' }),
    ['notifications', 'activity']
  );
  assert.deepEqual(
    resolveHomeMockSections({ NODE_ENV: 'development', HOME_MOCK_SECTIONS: 'foo,activity,__proto__' }),
    ['activity']
  );
  assert.deepEqual(
    resolveHomeMockSections({ NODE_ENV: 'test', VERCEL_ENV: 'development', HOME_MOCK_SECTIONS: 'recommendations' }),
    ['recommendations']
  );
});

test('mock gate: the source factory never yields a mock in production, and real beats mock', () => {
  const { createHomeSources } = loadHome('sources/create-home-sources.ts');
  const all = ['notifications', 'activity', 'recommendations'];
  const kinds = (sources) => Object.fromEntries(Object.entries(sources).map(([id, s]) => [id, s.kind]));
  const allUnavailable = { notifications: 'unavailable', activity: 'unavailable', recommendations: 'unavailable' };

  withEnv({ NODE_ENV: 'production' }, () => {
    assert.deepEqual(kinds(createHomeSources({ mockSections: all })), allUnavailable);
  });
  withEnv({ NODE_ENV: 'development' }, () => {
    assert.deepEqual(kinds(createHomeSources({ mockSections: [] })), allUnavailable);
    assert.deepEqual(kinds(createHomeSources({ mockSections: ['activity'] })), {
      ...allUnavailable,
      activity: 'mock',
    });
    assert.deepEqual(
      kinds(
        createHomeSources({
          mockSections: all,
          availability: { notifications: true, activity: false, recommendations: false },
        })
      ),
      { notifications: 'real', activity: 'mock', recommendations: 'mock' }
    );
  });
  // The default availability is all-false until the backend ships (contract-notes.md).
  const { HOME_API_AVAILABILITY } = loadHome('config/home-sections.ts');
  assert.deepEqual(HOME_API_AVAILABILITY, { notifications: false, activity: false, recommendations: false });
  // A real API is used even in production once it exists.
  withEnv({ NODE_ENV: 'production' }, () => {
    const sources = createHomeSources({
      mockSections: [],
      availability: { notifications: true, activity: true, recommendations: true },
    });
    assert.deepEqual(kinds(sources), { notifications: 'real', activity: 'real', recommendations: 'real' });
  });
});

test('mock gate: mock sources load validated data through the same parsers', async () => {
  const { createHomeSources } = loadHome('sources/create-home-sources.ts');
  const sources = withEnv({ NODE_ENV: 'development' }, () =>
    createHomeSources({ mockSections: ['notifications', 'activity', 'recommendations'] })
  );
  const notifications = await sources.notifications.load();
  assert.equal(typeof notifications.unreadCount, 'number');
  const activity = await sources.activity.load();
  assert.equal(activity.length, 4);
  assert.deepEqual(activity.map((item) => item.type).sort(), [
    'application_status_changed',
    'deadline_reminder',
    'new_recommendation',
    'scholarship_saved',
  ]);
  const recommendations = await sources.recommendations.load();
  assert.equal(recommendations.locked, false);
  assert.equal(recommendations.items.length, 3);
});

// ----------------------------- Phase 2: schemas -----------------------------

test('schemas: profile completion defaults, rejects non-numbers', () => {
  const { parseProfileCompletion } = loadHome('schemas/profile-completion.schema.ts');
  const { HomeContractError } = loadHome('schemas/contract-error.ts');
  assert.equal(parseProfileCompletion({ profile_completion_percentage: 40 }), 40);
  assert.equal(parseProfileCompletion({ profile_completion_percentage: 69.6 }), 69.6);
  assert.equal(parseProfileCompletion({}), 0);
  assert.equal(parseProfileCompletion({ profile_completion_percentage: null }), 0);
  for (const bad of [{ profile_completion_percentage: '80' }, { profile_completion_percentage: NaN }, null, 'x']) {
    assert.throws(() => parseProfileCompletion(bad), (error) => error instanceof HomeContractError);
  }
});

test('schemas: tracked applications accept extras, reject unknown statuses, allow null deadlines', () => {
  const { parseTrackedApplications } = loadHome('schemas/tracked-application.schema.ts');
  const { HomeContractError } = loadHome('schemas/contract-error.ts');
  const ok = tracked(1, 'applied', card(1, { deadline: '2026-11-02', extra_field: 'x' }));
  assert.equal(parseTrackedApplications([ok]).length, 1);
  assert.equal(
    parseTrackedApplications([tracked(2, 'closed', card(2, { deadline: null }))])[0].scholarship.deadline,
    null
  );
  assert.deepEqual(parseTrackedApplications([]), []);
  assert.throws(
    () => parseTrackedApplications([tracked(3, 'pending', card(3))]),
    (error) => error instanceof HomeContractError
  );
  assert.throws(() => parseTrackedApplications({ items: [] }), (error) => error instanceof HomeContractError);
  assert.throws(
    () => parseTrackedApplications([{ id: 1, status: 'applied' }]),
    (error) => error instanceof HomeContractError
  );
});

test('schemas: unread notifications must be a non-negative integer', () => {
  const { parseUnreadNotifications } = loadHome('schemas/notifications.schema.ts');
  const { HomeContractError } = loadHome('schemas/contract-error.ts');
  assert.deepEqual(parseUnreadNotifications({ unread_count: 0 }), { unreadCount: 0 });
  assert.deepEqual(parseUnreadNotifications({ unread_count: 12 }), { unreadCount: 12 });
  for (const bad of [{ unread_count: -1 }, { unread_count: 1.5 }, { unread_count: '3' }, {}, null]) {
    assert.throws(() => parseUnreadNotifications(bad), (error) => error instanceof HomeContractError);
  }
});

test('schemas: the activity feed validates per-type data and skips unknown types', () => {
  const { parseActivityFeed } = loadHome('schemas/activity.schema.ts');
  const { HomeContractError } = loadHome('schemas/contract-error.ts');
  const ref = { id: 4, title: 'T', title_ar: 'ت', title_en: 'T' };
  const base = { occurred_at: '2026-10-24T09:12:00Z', scholarship: ref };
  const feed = (...items) => ({ items });

  const items = parseActivityFeed(
    feed(
      { id: 1, type: 'new_recommendation', data: {}, ...base },
      { id: 2, type: 'deadline_reminder', data: { days_left: 7 }, ...base },
      { id: 3, type: 'scholarship_saved', data: {}, ...base },
      { id: 4, type: 'application_status_changed', data: { new_status: 'applied' }, ...base },
      { id: 5, type: 'something_new', data: {}, ...base }
    )
  );
  assert.deepEqual(
    items.map((item) => item.id),
    [1, 2, 3, 4]
  );
  assert.equal(items[1].data.daysLeft, 7);
  assert.equal(items[3].data.newStatus, 'applied');
  assert.equal(
    parseActivityFeed({
      items: [{ id: 1, type: 'scholarship_saved', data: {}, ...base, occurred_at: '2026-10-24T11:00:00+03:00' }],
    }).length,
    1
  );

  const bad = [
    feed({ id: 1, type: 'deadline_reminder', data: {}, ...base }),
    feed({ id: 1, type: 'application_status_changed', data: {}, ...base }),
    feed({ id: 1, type: 'new_recommendation', data: {}, occurred_at: base.occurred_at, scholarship: null }),
    feed({ id: 1, type: 'scholarship_saved', data: {}, ...base, occurred_at: '2026-10-24' }),
    feed({ id: 1, type: 'scholarship_saved', data: {}, ...base, occurred_at: 'yesterday' }),
    { items: 'nope' },
    null,
  ];
  for (const payload of bad) {
    assert.throws(() => parseActivityFeed(payload), (error) => error instanceof HomeContractError);
  }
  assert.deepEqual(parseActivityFeed({ items: [] }), []);
});

test('schemas: recommendations carry locked, cards and an optional 0-100 score', () => {
  const { parseRecommendations } = loadHome('schemas/recommendations.schema.ts');
  const { HomeContractError } = loadHome('schemas/contract-error.ts');
  const ok = parseRecommendations({
    locked: false,
    items: [card(1, { match: { score: 87 } }), card(2, { match: null }), card(3)],
  });
  assert.equal(ok.locked, false);
  assert.equal(ok.items.length, 3);
  assert.equal(ok.items[0].match.score, 87);
  assert.deepEqual(parseRecommendations({ locked: true, items: [] }), { locked: true, items: [] });
  for (const bad of [
    { locked: false, items: [card(1, { match: { score: 101 } })] },
    { locked: false, items: [card(1, { match: { score: -1 } })] },
    { items: [] },
    { locked: 'no', items: [] },
    null,
  ]) {
    assert.throws(() => parseRecommendations(bad), (error) => error instanceof HomeContractError);
  }
});

test('schemas: every mock payload parses with the schema of the contract it imitates', () => {
  const { mockLoaders } = loadHome('mocks/index.ts');
  const { parseUnreadNotifications } = loadHome('schemas/notifications.schema.ts');
  const { parseActivityFeed } = loadHome('schemas/activity.schema.ts');
  const { parseRecommendations } = loadHome('schemas/recommendations.schema.ts');
  assert.doesNotThrow(() => parseUnreadNotifications(mockLoaders.notificationsRaw()));
  assert.doesNotThrow(() => parseActivityFeed(mockLoaders.activityRaw(NOW)));
  assert.doesNotThrow(() => parseRecommendations(mockLoaders.recommendationsRaw()));
  assert.equal(parseActivityFeed(mockLoaders.activityRaw(NOW)).length, 4);
});

// ----------------------------- Phase 2: static guards -----------------------

const srcFiles = () => walk(srcPath);
const read = (file) => fs.readFileSync(file, 'utf8');
const inMocks = (file) => rel(file).startsWith('src/features/student/home/mocks/');

test('guards: only the source factory references home/mocks, and only through import()', () => {
  const factory = path.join(homePath, 'sources/create-home-sources.ts');
  const references = srcFiles().filter(
    (file) => !inMocks(file) && /(\.\.?\/|\/)mocks(['"/])|home\/mocks/.test(read(file))
  );
  assert.deepEqual(references.map(rel), [rel(factory)]);
  const source = read(factory);
  assert.match(source, /import\(\s*['"]\.\.\/mocks['"]\s*\)/);
  assert.doesNotMatch(source, /^\s*import\s[^;]*from\s+['"]\.\.\/mocks['"]/m);
});

test('guards: the mock-section resolver is imported only by server files under src/app', () => {
  const importers = srcFiles().filter(
    (file) => !file.endsWith('resolve-mock-sections.ts') && /resolve-mock-sections/.test(read(file))
  );
  for (const file of importers) {
    assert.ok(rel(file).startsWith('src/app/'), `${rel(file)} must not import the resolver`);
    assert.doesNotMatch(read(file), /^['"]use client['"]/m, `${rel(file)} must be a Server Component`);
  }
});

test('guards: Home never references the unfiltered recommendations feed', () => {
  const offenders = srcFiles()
    .filter((file) => read(file).includes('/api/scholarships/recommendations'))
    .map(rel);
  assert.deepEqual(offenders, []);
});

test('guards: the mock marker never leaves home/mocks and src never imports tests or scripts', () => {
  const leaked = srcFiles()
    .filter((file) => !inMocks(file) && read(file).includes('__HOME_MOCK__'))
    .map(rel);
  assert.deepEqual(leaked, []);
  const marker = srcFiles().filter((file) => inMocks(file) && read(file).includes('__HOME_MOCK__'));
  assert.ok(marker.length > 0, 'mocks must carry the marker for the production-build grep');
  const imports = /(?:from|import\()\s*['"][^'"]*(?:\/tests\/|\/scripts\/|fixtures)[^'"]*['"]/;
  assert.deepEqual(
    srcFiles()
      .filter((file) => imports.test(read(file)))
      .map(rel),
    []
  );
});

test('guards: the shared student layout never imports from the home feature', () => {
  const layoutDir = path.join(srcPath, 'features/student/layout');
  const offenders = walk(layoutDir)
    .filter((file) => /features\/student\/home/.test(read(file)))
    .map(rel);
  assert.deepEqual(offenders, []);
});

// ----------------------------- Phase 2: derivations -------------------------

test('derive: in-progress counts only preparing, ready and applied', () => {
  const { countInProgress } = loadHome('lib/derive-home-summary.ts');
  const items = [
    tracked(1, 'preparing_documents', card(1)),
    tracked(2, 'ready_to_apply', card(2)),
    tracked(3, 'applied', card(3)),
    tracked(4, 'accepted', card(4)),
    tracked(5, 'rejected', card(5)),
    tracked(6, 'closed', card(6)),
  ];
  assert.equal(countInProgress(items), 3);
  assert.equal(countInProgress([]), 0);
});

test('derive: candidates merge saved and tracked by id, saved fields win, terminal tracked drop', () => {
  const { collectDeadlineCandidates } = loadHome('lib/derive-home-summary.ts');
  const saved = [card(1, { title: 'Saved copy' }), card(9, { title: 'Terminal but saved' })];
  const items = [
    tracked(1, 'applied', card(1, { title: 'Tracked copy' })),
    tracked(2, 'preparing_documents', card(2)),
    tracked(3, 'accepted', card(3)),
    tracked(4, 'rejected', card(4)),
    tracked(5, 'closed', card(5)),
    tracked(9, 'closed', card(9, { title: 'Tracked copy' })),
  ];
  const result = collectDeadlineCandidates(saved, items);
  const byId = Object.fromEntries(result.map((c) => [c.id, c]));
  assert.deepEqual(
    result.map((c) => c.id).sort((a, b) => a - b),
    [1, 2, 9]
  );
  assert.equal(byId[1].origin, 'both');
  assert.equal(byId[1].card.title, 'Saved copy');
  assert.equal(byId[2].origin, 'tracked');
  assert.equal(byId[9].origin, 'saved');
});

test('derive: the window is 0..30 days and excludes past, undated and invalid deadlines', () => {
  const { deriveUpcomingDeadlines } = loadHome('lib/derive-home-summary.ts');
  const saved = [
    card(1, { deadline: dateIn(0) }),
    card(2, { deadline: dateIn(1) }),
    card(3, { deadline: dateIn(30) }),
    card(4, { deadline: dateIn(31) }),
    card(5, { deadline: dateIn(-1) }),
    card(6, { deadline: dateIn(5), no_deadline: true }),
    card(7, { deadline: null }),
    card(8, { deadline: '2026-02-30' }),
    card(10, { deadline: `${dateIn(9)}T00:00:00Z` }),
  ];
  const { items, count } = deriveUpcomingDeadlines({ saved, tracked: [], now: NOW });
  assert.equal(count, 4);
  assert.deepEqual(
    items.map((i) => [i.id, i.daysLeft]),
    [
      [1, 0],
      [2, 1],
      [10, 9],
    ]
  );
  assert.deepEqual(deriveUpcomingDeadlines({ saved: [], tracked: [], now: NOW }), { items: [], count: 0 });
});

test('derive: order is days then id, the list caps at 3 while the count keeps counting', () => {
  const { deriveUpcomingDeadlines } = loadHome('lib/derive-home-summary.ts');
  const saved = [
    card(30, { deadline: dateIn(10) }),
    card(20, { deadline: dateIn(10) }),
    card(50, { deadline: dateIn(2) }),
    card(40, { deadline: dateIn(25) }),
    card(60, { deadline: dateIn(12) }),
  ];
  const { items, count } = deriveUpcomingDeadlines({ saved, tracked: [], now: NOW });
  assert.deepEqual(
    items.map((i) => i.id),
    [50, 20, 30]
  );
  assert.equal(count, 5);
  const two = deriveUpcomingDeadlines({ saved: saved.slice(0, 2), tracked: [], now: NOW });
  assert.equal(two.items.length, 2);
});

test('derive: a scholarship that is saved and tracked counts once; terminal tracked items do not count', () => {
  const { deriveUpcomingDeadlines } = loadHome('lib/derive-home-summary.ts');
  const saved = [card(1, { deadline: dateIn(5) })];
  const items = [
    tracked(1, 'applied', card(1, { deadline: dateIn(5) })),
    tracked(2, 'preparing_documents', card(2, { deadline: dateIn(8) })),
    tracked(3, 'accepted', card(3, { deadline: dateIn(3) })),
    tracked(4, 'closed', card(4, { deadline: dateIn(4) })),
  ];
  const result = deriveUpcomingDeadlines({ saved, tracked: items, now: NOW });
  assert.equal(result.count, 2);
  assert.deepEqual(
    result.items.map((i) => [i.id, i.origin]),
    [
      [1, 'both'],
      [2, 'tracked'],
    ]
  );
});

test('derive: the item carries a date, urgency and raw funding/level for labels', () => {
  const { deriveUpcomingDeadlines } = loadHome('lib/derive-home-summary.ts');
  const { items } = deriveUpcomingDeadlines({
    saved: [
      card(1, {
        deadline: dateIn(3),
        title_ar: 'منحة',
        title_en: 'Grant',
        funding_type: 'partial',
        study_level: ['phd', 'master'],
      }),
    ],
    tracked: [],
    now: NOW,
  });
  assert.equal(items[0].urgency, 'urgent');
  assert.deepEqual(items[0].deadline, { year: 2026, month: 10, day: 27 });
  assert.deepEqual(items[0].title, { default: 'Scholarship 1', ar: 'منحة', en: 'Grant' });
  assert.equal(items[0].fundingType, 'partial');
  assert.equal(items[0].studyLevel, 'phd, master');
});

test('derive: urgency thresholds are 0-7 urgent, 8-14 soon, 15-30 comfortable', () => {
  const { urgencyFor } = loadHome('lib/urgency.ts');
  const expected = { 0: 'urgent', 7: 'urgent', 8: 'soon', 14: 'soon', 15: 'comfortable', 30: 'comfortable' };
  for (const [days, urgency] of Object.entries(expected)) {
    assert.equal(urgencyFor(Number(days)), urgency, `days=${days}`);
  }
});

test('derive: days are counted on the student local calendar day, never shifted by UTC', () => {
  const { deriveUpcomingDeadlines } = loadHome('lib/derive-home-summary.ts');
  // 22:30Z on 24 Oct is already 25 Oct 01:30 in Riyadh (UTC+3, no DST) but still 24 Oct in UTC.
  const instant = new Date('2026-10-24T22:30:00Z');
  const saved = [card(1, { deadline: '2026-10-25' })];
  const derive = (now) => deriveUpcomingDeadlines({ saved, tracked: [], now });
  withTimeZone('Asia/Riyadh', () => assert.equal(derive(instant).items[0].daysLeft, 0));
  withTimeZone('UTC', () => assert.equal(derive(instant).items[0].daysLeft, 1));
  // Just after local midnight the previous day's deadline is gone.
  withTimeZone('Asia/Riyadh', () => {
    const after = new Date('2026-10-25T21:30:00Z'); // 26 Oct 00:30 in Riyadh
    assert.equal(derive(after).count, 0);
  });
});

test('today: the next local midnight is computed across month ends and DST changes', () => {
  const { msUntilNextLocalMidnight } = loadHome('lib/today.ts');
  withTimeZone('UTC', () => {
    assert.equal(msUntilNextLocalMidnight(new Date(2026, 9, 24, 23, 59, 59)), 1000);
    assert.equal(msUntilNextLocalMidnight(new Date(2026, 9, 24, 0, 0, 0)), 86_400_000);
    assert.equal(msUntilNextLocalMidnight(new Date(2026, 11, 31, 12, 0, 0)), 12 * 3_600_000);
  });
  // 2026-11-01 is a 25-hour day in New York (clocks go back at 02:00).
  withTimeZone('America/New_York', () => {
    assert.equal(msUntilNextLocalMidnight(new Date(2026, 10, 1, 0, 30, 0)), 88_200_000);
  });
});

test('today: the label is a long date with Latin digits in both languages', () => {
  const { formatTodayLabel } = loadHome('lib/today.ts');
  assert.equal(formatTodayLabel(NOW, 'en'), 'October 24, 2026');
  const ar = formatTodayLabel(NOW, 'ar');
  assert.match(ar, /24/);
  assert.match(ar, /2026/);
  assert.doesNotMatch(ar, /[٠-٩۰-۹]/);
});

test('relative time: buckets, future clock skew and Latin digits in Arabic', () => {
  const { formatRelativeTime } = loadHome('lib/relative-time.ts');
  const ago = (ms) => new Date(NOW.getTime() - ms);
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const fmt = (when, locale = 'en', justNow = 'just now') => formatRelativeTime(when, NOW, locale, justNow);
  assert.equal(fmt(ago(30_000)), 'just now');
  assert.equal(fmt(ago(5 * MIN)), '5 minutes ago');
  assert.equal(fmt(ago(3 * HOUR)), '3 hours ago');
  assert.equal(fmt(ago(DAY)), '1 day ago');
  assert.equal(fmt(ago(2 * DAY)), '2 days ago');
  assert.equal(fmt(ago(14 * DAY)), '2 weeks ago');
  assert.equal(fmt(ago(90 * DAY)), '3 months ago');
  assert.equal(fmt(new Date(NOW.getTime() + 10 * MIN)), 'just now');
  assert.equal(fmt(ago(3 * HOUR).toISOString()), '3 hours ago');
  const ar = fmt(ago(3 * HOUR), 'ar', 'الآن');
  assert.match(ar, /3/);
  assert.doesNotMatch(ar, /[٠-٩۰-۹]/);
  assert.equal(fmt('not a date'), 'just now');
});

test('identity: the first name is the first word, or null', () => {
  const { firstName } = loadHome('lib/identity.ts');
  assert.equal(firstName('Ahmad Hajjar'), 'Ahmad');
  assert.equal(firstName('  أحمد   الحجار '), 'أحمد');
  assert.equal(firstName('Layla'), 'Layla');
  assert.equal(firstName(''), null);
  assert.equal(firstName('   '), null);
  assert.equal(firstName(null), null);
  assert.equal(firstName(undefined), null);
});

test('completion: 70 unlocks, 69.6 stays locked, unknown stays locked, display is clamped', () => {
  const { isRecommendationsUnlocked, toDisplayPercent } = loadHome('lib/unlock.ts');
  assert.equal(isRecommendationsUnlocked(70), true);
  assert.equal(isRecommendationsUnlocked(100), true);
  assert.equal(isRecommendationsUnlocked(69.6), false);
  assert.equal(isRecommendationsUnlocked(0), false);
  assert.equal(isRecommendationsUnlocked(null), false);
  assert.equal(isRecommendationsUnlocked(undefined), false);
  assert.equal(isRecommendationsUnlocked(NaN), false);
  assert.equal(toDisplayPercent(120), 100);
  assert.equal(toDisplayPercent(-3), 0);
  assert.equal(toDisplayPercent(41.6), 42);
  assert.equal(toDisplayPercent(null), 0);
});

test('section state: error, loading, empty, ready and hidden; a 401 is loading, a contract error is error', () => {
  const { getSectionState, shouldInvalidateSession } = loadHome('lib/section-state.ts');
  const { ApiError } = loadSrc('lib/api-client.ts');
  const { HomeContractError } = loadHome('schemas/contract-error.ts');
  const q = (status, error = null) => ({ status, error });

  assert.equal(getSectionState([q('success')]), 'ready');
  assert.equal(getSectionState([q('success')], { empty: true }), 'empty');
  assert.equal(getSectionState([q('pending')]), 'loading');
  assert.equal(getSectionState([q('success'), q('pending')]), 'loading');
  assert.equal(getSectionState([q('error', new ApiError('x', [], 500))]), 'error');
  assert.equal(getSectionState([q('error', new HomeContractError('saved', []))], { empty: true }), 'error');
  assert.equal(getSectionState([q('success'), q('error', new Error('x'))]), 'error');
  assert.equal(getSectionState([q('error', new ApiError('x', [], 401))]), 'loading');
  assert.equal(getSectionState([q('pending')], { hidden: true }), 'hidden');

  assert.equal(shouldInvalidateSession([q('error', new ApiError('x', [], 401))]), true);
  assert.equal(shouldInvalidateSession([q('success'), q('error', new ApiError('x', [], 401))]), true);
  for (const error of [new ApiError('x', [], 403), new ApiError('x', [], 500), new Error('x'), null]) {
    assert.equal(shouldInvalidateSession([q('error', error)]), false);
  }
});

test('section state: retry refetches only the failed queries', async () => {
  const { retryFailed } = loadHome('lib/section-state.ts');
  const calls = [];
  const query = (name, status) => ({
    status,
    error: null,
    refetch: async () => {
      calls.push(name);
      return name;
    },
  });
  await retryFailed([
    query('saved', 'error'),
    query('tracked', 'success'),
    query('profile', 'error'),
    query('x', 'pending'),
  ]);
  assert.deepEqual(calls.sort(), ['profile', 'saved']);
});
