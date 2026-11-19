import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { IntlMessageFormat } from 'intl-messageformat';
import {
  QueryClient,
  React,
  env,
  format,
  loadFeature,
  loadPackage,
  loadSrc,
  lookup,
  messages,
  read,
  render,
  rootPath,
  withEnv,
} from './helpers/notifications-harness.mjs';

// Feature 011: Student Notifications. Pure logic, adapter, registry, copy, flag and guards.
// The rendered markup and the shell wiring are in student-notifications-ui.test.mjs.

const { featureFlags } = loadSrc('lib/feature-flags.ts');

// ----------------------------- flag (FR-003, FR-004) -----------------------

test('flag: NOTIFICATIONS_ENABLED is off when unset and only the literal "true" turns it on', () => {
  withEnv({ NOTIFICATIONS_ENABLED: undefined }, () =>
    assert.equal(featureFlags.notificationsEnabled, false)
  );
  for (const value of ['', 'false', '0', '1', 'yes', 'TRUE', 'True', ' true', 'true ', 'on']) {
    withEnv({ NOTIFICATIONS_ENABLED: value }, () =>
      assert.equal(featureFlags.notificationsEnabled, false, `value=${JSON.stringify(value)}`)
    );
  }
  withEnv({ NOTIFICATIONS_ENABLED: 'true' }, () =>
    assert.equal(featureFlags.notificationsEnabled, true)
  );
});

test('flag: it is read on every access, server-side only, never NEXT_PUBLIC_ and never default-true', () => {
  const flags = read('src/lib/feature-flags.ts');
  assert.match(flags, /process\.env\.NOTIFICATIONS_ENABLED === 'true'/);
  assert.doesNotMatch(flags, /NEXT_PUBLIC_NOTIFICATIONS/);
  assert.doesNotMatch(flags, /NOTIFICATIONS_ENABLED[^\n]*\|\|\s*true/);
  // A getter: flipping process.env between two reads changes the answer.
  withEnv({ NOTIFICATIONS_ENABLED: 'true' }, () =>
    assert.equal(featureFlags.notificationsEnabled, true)
  );
  withEnv({ NOTIFICATIONS_ENABLED: undefined }, () =>
    assert.equal(featureFlags.notificationsEnabled, false)
  );
  assert.doesNotMatch(read('.env.example'), /NEXT_PUBLIC_NOTIFICATIONS/);
});

test('flag: .env.example documents NOTIFICATIONS_ENABLED empty (off)', () => {
  assert.match(read('.env.example'), /^NOTIFICATIONS_ENABLED=\s*$/m);
});

test('flag: NOTIFICATIONS_ENABLED is turned on only in the e2e config', () => {
  // Nothing that ships or deploys may carry the flag: the e2e config enables it for the
  // flags-on server only, .env.example documents it empty and feature-flags.ts reads it.
  const skip = new Set([
    'node_modules',
    '.next',
    '.git',
    'tests',
    'specs',
    'docs',
    '.specify',
    '.claude',
  ]);
  const walk = (directory) =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      if (skip.has(entry.name) || /^\.env.*\.local$|^\.env\.local$/.test(entry.name)) return [];
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
  const carrying = walk(rootPath)
    .filter((file) => !/\.(png|jpe?g|webp|svg|ico|woff2?|lock|yaml)$/.test(file))
    .filter((file) => fs.readFileSync(file, 'utf8').includes('NOTIFICATIONS_ENABLED'))
    .map((file) => path.relative(rootPath, file).replaceAll('\\', '/'))
    .sort();
  assert.deepEqual(carrying, ['.env.example', 'playwright.config.ts', 'src/lib/feature-flags.ts']);

  const playwrightConfig = read('playwright.config.ts');
  assert.match(playwrightConfig, /NOTIFICATIONS_ENABLED: flags \? 'true' : ''/);
});

// ----------------------------- fixtures ------------------------------------

const { parseNotificationPage } = loadFeature('adapter/parse-page.ts');
const { NotificationsContractError } = loadFeature('adapter/wire.ts');
const { PARAMS_SCHEMAS } = loadFeature('adapter/params.ts');
const { NOTIFICATION_TYPES, ACTION_TYPES } = loadFeature('model/types.ts');
const { NOTIFICATION_REGISTRY } = loadFeature('registry/registry.ts');
const { resolveAction } = loadFeature('registry/actions.ts');
const { buildNotificationCopy, KNOWN_CHANGE_CODES, KNOWN_DOCUMENT_CODES } =
  loadFeature('registry/copy.ts');
const { formatDeadlineDate } = loadFeature('lib/deadline-date.ts');
const { formatNotificationTime, formatExactTime } = loadFeature('lib/relative-time.ts');
const { formatBadge } = loadFeature('lib/badge.ts');
const { classifyListError } = loadFeature('lib/errors.ts');
const polling = loadFeature('lib/polling.ts');
const cache = loadFeature('lib/cache-updates.ts');
const { ApiError } = loadSrc('lib/api-client.ts');

const NOW = new Date('2026-11-19T12:00:00Z');

const PARAMS = {
  deadline_reminder: {
    scholarship_id: 7,
    scholarship_title: 'DAAD',
    days_left: 17,
    deadline: '2026-09-15',
    reminder_index: 1,
    reminder_total: 2,
    missing_documents: ['recommendation_letters'],
  },
  scholarship_match: {
    scholarship_id: 8,
    scholarship_title: 'Erasmus Mundus',
    matched_count: 4,
    total_count: 5,
  },
  saved_scholarship_updated: {
    scholarship_id: 9,
    scholarship_title: 'Chevening',
    change: 'language_requirement_added',
  },
  scholarship_archived: { scholarship_id: 10, scholarship_title: 'Islamic University 2025' },
  profile_incomplete: { remaining_percent: 18, threshold_percent: 70 },
  document_analysis_ready: { suggestions_count: 8, target_scholarship_title: 'DAAD' },
};

const raw = (type, extra = {}) => ({
  id: 1,
  type,
  params: { ...PARAMS[type] },
  created_at: '2026-11-19T10:00:00Z',
  is_read: false,
  action: null,
  ...extra,
});
const withParams = (type, changes) => raw(type, { params: { ...PARAMS[type], ...changes } });
const envelope = (items, extra = {}) => ({
  items,
  total: items.length,
  page: 1,
  page_size: 20,
  total_pages: 1,
  ...extra,
});
const parseOne = (item) => parseNotificationPage(envelope([item]));

const t = (locale) => (key, values) => {
  const message = lookup('StudentNotifications', key, locale);
  assert.equal(typeof message, 'string', `${locale} StudentNotifications.${key} is missing`);
  return format(message, values, locale);
};
const copyOf = (type, locale = 'en', extra = {}) =>
  buildNotificationCopy(parseOne(raw(type, extra)).items[0], { t: t(locale), locale, now: NOW });

// ----------------------------- adapter: items (FR-028, FR-029, FR-090) -----

test('adapter: all six types parse into the internal camelCase model', () => {
  const page = parseNotificationPage(envelope(NOTIFICATION_TYPES.map((type) => raw(type))));
  assert.deepEqual(
    page.items.map((item) => item.type),
    [...NOTIFICATION_TYPES]
  );
  assert.deepEqual(page.skipped, { unknownType: 0, malformed: 0 });
  const [reminder, match, , , profile, analysis] = page.items;
  assert.deepEqual(reminder.params, {
    scholarshipId: 7,
    scholarshipTitle: 'DAAD',
    daysLeft: 17,
    deadline: { year: 2026, month: 9, day: 15 },
    reminderIndex: 1,
    reminderTotal: 2,
    missingDocuments: ['recommendation_letters'],
  });
  assert.deepEqual(match.params, {
    scholarshipId: 8,
    scholarshipTitle: 'Erasmus Mundus',
    matchedCount: 4,
    totalCount: 5,
  });
  assert.deepEqual(profile.params, { remainingPercent: 18, thresholdPercent: 70 });
  assert.deepEqual(analysis.params, { suggestionsCount: 8, targetScholarshipTitle: 'DAAD' });
  assert.equal(reminder.createdAt, '2026-11-19T10:00:00Z');
  assert.equal(reminder.isRead, false);
  // The UI never sees a backend field name.
  for (const item of page.items) {
    assert.deepEqual(Object.keys(item).sort(), [
      'action',
      'createdAt',
      'id',
      'isRead',
      'params',
      'type',
    ]);
  }
});

test('adapter: the page envelope keeps the server order and maps its numbers', () => {
  const items = [raw('scholarship_archived', { id: 30 }), raw('scholarship_archived', { id: 20 })];
  const page = parseNotificationPage(
    envelope(items, { total: 45, page: 2, page_size: 20, total_pages: 3 })
  );
  assert.deepEqual(
    page.items.map((item) => item.id),
    [30, 20]
  );
  assert.deepEqual(
    { page: page.page, pageSize: page.pageSize, total: page.total, totalPages: page.totalPages },
    { page: 2, pageSize: 20, total: 45, totalPages: 3 }
  );
});

test('adapter: an unknown type is skipped and counted, never an error', () => {
  const page = parseNotificationPage(
    envelope([
      raw('scholarship_match', { id: 1 }),
      { id: 2, type: 'brand_new_type', params: { anything: 1 }, created_at: 'nonsense' },
      { id: 3, type: 'another_one' },
    ])
  );
  assert.deepEqual(
    page.items.map((item) => item.id),
    [1]
  );
  assert.deepEqual(page.skipped, { unknownType: 2, malformed: 0 });
});

test('adapter: a known type with bad parameters is skipped and counted, the rest renders', () => {
  const bad = [
    withParams('deadline_reminder', { scholarship_id: 0 }),
    withParams('deadline_reminder', { scholarship_title: '   ' }),
    withParams('deadline_reminder', { days_left: -1 }),
    withParams('deadline_reminder', { days_left: 1.5 }),
    withParams('deadline_reminder', { deadline: '2026-02-30' }),
    withParams('deadline_reminder', { deadline: 'tomorrow' }),
    withParams('deadline_reminder', { reminder_index: 0 }),
    withParams('deadline_reminder', { reminder_index: 3, reminder_total: 2 }),
    withParams('deadline_reminder', { missing_documents: [4] }),
    withParams('scholarship_match', { matched_count: 6, total_count: 5 }),
    withParams('scholarship_match', { total_count: 0, matched_count: 0 }),
    withParams('scholarship_match', { matched_count: -1 }),
    withParams('saved_scholarship_updated', { change: '' }),
    withParams('scholarship_archived', { scholarship_id: 1.5 }),
    withParams('profile_incomplete', { remaining_percent: 101 }),
    withParams('profile_incomplete', { threshold_percent: -1 }),
    withParams('document_analysis_ready', { suggestions_count: -1 }),
    withParams('document_analysis_ready', { suggestions_count: '8' }),
    raw('profile_incomplete', { params: null }),
  ];
  const page = parseNotificationPage(envelope([...bad, raw('scholarship_archived', { id: 99 })]));
  assert.deepEqual(
    page.items.map((item) => item.id),
    [99]
  );
  assert.deepEqual(page.skipped, { unknownType: 0, malformed: bad.length });
  // Counts only: no parameter value ends up in the result.
  assert.doesNotMatch(JSON.stringify(page.skipped), /DAAD|Erasmus/);
});

test('adapter: the item shell is validated (id, created_at, is_read)', () => {
  const bad = [
    raw('scholarship_archived', { id: 0 }),
    raw('scholarship_archived', { id: '5' }),
    raw('scholarship_archived', { id: 1.5 }),
    raw('scholarship_archived', { id: undefined }),
    raw('scholarship_archived', { created_at: '2026-11-19' }),
    raw('scholarship_archived', { created_at: 'yesterday' }),
    raw('scholarship_archived', { is_read: 'true' }),
    raw('scholarship_archived', { is_read: undefined }),
    { id: 2, params: PARAMS.scholarship_archived },
    'not an object',
    null,
  ];
  const page = parseNotificationPage(envelope(bad));
  assert.deepEqual(page.items, []);
  assert.deepEqual(page.skipped, { unknownType: 0, malformed: bad.length });
});

test('adapter: valid edge values pass (0, 100, decimals, absent optionals, unknown codes)', () => {
  const ok = parseNotificationPage(
    envelope([
      withParams('profile_incomplete', { remaining_percent: 0, threshold_percent: 100 }),
      withParams('profile_incomplete', { remaining_percent: 17.6 }),
      withParams('deadline_reminder', { days_left: 0, missing_documents: undefined }),
      withParams('deadline_reminder', { missing_documents: null }),
      withParams('saved_scholarship_updated', { change: 'a_code_nobody_knows_yet' }),
      withParams('document_analysis_ready', { target_scholarship_title: null }),
      withParams('document_analysis_ready', { target_scholarship_title: '  ' }),
      withParams('scholarship_match', { matched_count: 0, total_count: 1 }),
    ])
  );
  assert.equal(ok.items.length, 8);
  assert.deepEqual(ok.skipped, { unknownType: 0, malformed: 0 });
  assert.deepEqual(ok.items[2].params.missingDocuments, []);
  assert.deepEqual(ok.items[3].params.missingDocuments, []);
  assert.equal(ok.items[5].params.targetScholarshipTitle, null);
  assert.equal(ok.items[6].params.targetScholarshipTitle, null);
});

test('adapter: extra fields from a newer backend are ignored everywhere (FR-091)', () => {
  const item = raw('scholarship_match', {
    brand_new_field: 'x',
    params: { ...PARAMS.scholarship_match, extra_param: 1 },
  });
  const page = parseNotificationPage({ ...envelope([item]), cursor: 'abc', extra: true });
  assert.equal(page.items.length, 1);
  assert.equal('brandNewField' in page.items[0], false);
  assert.equal('extraParam' in page.items[0].params, false);
});

test('adapter: the action is read as null, or { type, targetId }, and never breaks the item', () => {
  const action = (value) => parseOne(raw('scholarship_match', { action: value })).items[0].action;
  assert.equal(action(null), null);
  assert.equal(action(undefined), null);
  assert.equal(action('open_scholarship'), null);
  assert.equal(action({ target_id: 4 }), null);
  assert.equal(action({ type: '' }), null);
  assert.deepEqual(action({ type: 'open_scholarship', target_id: 4 }), {
    type: 'open_scholarship',
    targetId: 4,
  });
  assert.deepEqual(action({ type: 'open_profile', target_id: null }), {
    type: 'open_profile',
    targetId: null,
  });
  // A target that is not a positive integer is read as "no target"; the item is still shown.
  for (const target of ['4', 0, -3, 1.5]) {
    assert.deepEqual(action({ type: 'open_scholarship', target_id: target }), {
      type: 'open_scholarship',
      targetId: null,
    });
  }
  assert.deepEqual(action({ type: 'some_future_action', target_id: 1 }), {
    type: 'some_future_action',
    targetId: 1,
  });
});

test('adapter: a bad envelope is a contract error (the error state), not an empty page', () => {
  const bad = [
    null,
    [],
    {},
    { items: 'nope', total: 0, page: 1, page_size: 20, total_pages: 0 },
    { items: [], total: -1, page: 1, page_size: 20, total_pages: 0 },
    { items: [], total: 0, page: 0, page_size: 20, total_pages: 0 },
    { items: [], total: 0, page: 1, page_size: 0, total_pages: 0 },
    { items: [], total: 0, page: 1, page_size: 20 },
  ];
  for (const value of bad) {
    assert.throws(
      () => parseNotificationPage(value),
      (error) => error instanceof NotificationsContractError,
      JSON.stringify(value)
    );
  }
  assert.deepEqual(parseNotificationPage(envelope([])).items, []);
});

test('adapter: the registry, the parsers and the messages cover exactly the six types', () => {
  const types = [...NOTIFICATION_TYPES].sort();
  assert.equal(types.length, 6);
  assert.deepEqual(Object.keys(NOTIFICATION_REGISTRY).sort(), types);
  assert.deepEqual(Object.keys(PARAMS_SCHEMAS).sort(), types);
  for (const locale of ['en', 'ar']) {
    assert.deepEqual(Object.keys(messages[locale].StudentNotifications.types).sort(), types);
    for (const type of types) {
      const entry = messages[locale].StudentNotifications.types[type];
      assert.equal(typeof entry.title, 'string', `${locale} ${type} title`);
    }
    for (const type of types.filter((name) => name !== 'saved_scholarship_updated')) {
      assert.equal(
        typeof messages[locale].StudentNotifications.types[type].body,
        'string',
        `${locale} ${type} body`
      );
    }
  }
  for (const entry of Object.values(NOTIFICATION_REGISTRY)) {
    assert.match(entry.boxClass, /^bg-\[/);
    if (entry.icon.kind === 'asset')
      assert.match(entry.icon.src, /^\/images\/student\/notifications\/.+\.svg$/);
    else assert.ok(entry.icon.Icon);
  }
});

test('registry: the design colors (Figma 2481:4980) are kept per type', () => {
  assert.equal(NOTIFICATION_REGISTRY.deadline_reminder.boxClass, 'bg-[rgba(255,141,40,0.1)]');
  assert.equal(NOTIFICATION_REGISTRY.scholarship_match.boxClass, 'bg-[#f1f1fb]');
  assert.equal(NOTIFICATION_REGISTRY.scholarship_match.icon.className, 'text-[#274383]');
  assert.equal(
    NOTIFICATION_REGISTRY.saved_scholarship_updated.boxClass,
    'bg-[rgba(22,193,114,0.06)]'
  );
  assert.equal(NOTIFICATION_REGISTRY.saved_scholarship_updated.icon.className, 'text-[#16c172]');
  assert.equal(NOTIFICATION_REGISTRY.scholarship_archived.boxClass, 'bg-[rgba(255,56,60,0.1)]');
  assert.equal(
    NOTIFICATION_REGISTRY.scholarship_archived.icon.className,
    'text-[rgba(220,38,38,0.6)]'
  );
  assert.equal(NOTIFICATION_REGISTRY.profile_incomplete.icon.className, 'text-orange-500');
  assert.equal(NOTIFICATION_REGISTRY.document_analysis_ready.boxClass, 'bg-[rgba(0,136,255,0.1)]');
  assert.equal(NOTIFICATION_REGISTRY.document_analysis_ready.icon.className, 'text-[#8b5cf6]');
  assert.ok(
    fs.existsSync(path.join(rootPath, 'public/images/student/notifications/time-circle.svg'))
  );
});

// ----------------------------- actions (FR-030 to FR-032) ------------------

test('actions: the backend action decides; unavailable destinations render nothing', () => {
  const item = (action) => ({ action });
  const open = { detailsEnabled: true };
  const closed = { detailsEnabled: false };

  assert.equal(resolveAction(item(null), open), null);
  assert.deepEqual(resolveAction(item({ type: 'open_scholarship', targetId: 7 }), open), {
    href: '/student/scholarships/7',
    labelKey: 'actions.viewScholarship',
  });
  // SCHOLARSHIP_DETAILS_ENABLED off: no link, the card is otherwise unchanged.
  assert.equal(resolveAction(item({ type: 'open_scholarship', targetId: 7 }), closed), null);
  for (const targetId of [null, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 2]) {
    assert.equal(resolveAction(item({ type: 'open_scholarship', targetId }), open), null);
  }
  // The profile page always exists.
  for (const options of [open, closed]) {
    assert.deepEqual(resolveAction(item({ type: 'open_profile', targetId: null }), options), {
      href: '/student/profile',
      labelKey: 'actions.completeProfile',
    });
  }
  // The AI document page does not exist in this release; an unknown kind shows nothing.
  assert.equal(resolveAction(item({ type: 'open_document_analysis', targetId: 3 }), open), null);
  assert.equal(resolveAction(item({ type: 'open_somewhere_new', targetId: 3 }), open), null);
  assert.deepEqual(
    [...ACTION_TYPES],
    ['open_scholarship', 'open_profile', 'open_document_analysis']
  );
});

test('actions: the notification type does not decide the action, and no backend URL is followed', () => {
  const profile = parseOne(raw('profile_incomplete')).items[0];
  assert.equal(resolveAction(profile, { detailsEnabled: true }), null, 'action is null');
  const withUrl = {
    action: { type: 'https://evil.example/x', targetId: 1, url: 'https://evil.example' },
  };
  assert.equal(resolveAction(withUrl, { detailsEnabled: true }), null);
});

// ----------------------------- dates and time (FR-016, FR-020) -------------

test('deadline date: day and month, the year only when it is not the current year, no UTC shift', () => {
  const date = { year: 2026, month: 9, day: 15 };
  assert.equal(formatDeadlineDate(date, NOW, 'en'), 'September 15');
  assert.equal(formatDeadlineDate({ ...date, year: 2027 }, NOW, 'en'), 'September 15, 2027');
  assert.equal(formatDeadlineDate({ year: 2026, month: 1, day: 1 }, NOW, 'en'), 'January 1');
  for (const tz of ['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'UTC']) {
    const previous = process.env.TZ;
    process.env.TZ = tz;
    try {
      assert.equal(formatDeadlineDate(date, NOW, 'en'), 'September 15', tz);
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  }
  const arabic = formatDeadlineDate(date, NOW, 'ar');
  assert.match(arabic, /15/);
  assert.doesNotMatch(arabic, /[٠-٩۰-۹]/);
});

test('relative time: one rule, Yesterday, weeks, a date from 30 days, Latin digits', () => {
  const ago = (ms) => new Date(NOW.getTime() - ms).toISOString();
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const en = (ms) => formatNotificationTime(ago(ms), NOW, 'en', 'Just now');

  assert.equal(en(10_000), 'Just now');
  assert.equal(en(5 * MIN), '5 minutes ago');
  assert.equal(en(2 * HOUR), '2 hours ago');
  assert.equal(en(25 * HOUR), 'yesterday');
  assert.equal(en(3 * DAY), '3 days ago');
  assert.equal(en(10 * DAY), '1 week ago');
  assert.equal(en(29 * DAY), '4 weeks ago');
  assert.match(en(45 * DAY), /^[A-Z][a-z]+ \d{1,2}, 2026$/, 'an absolute date from 30 days');
  // A clock ahead of the server (future) reads as "Just now"; an unreadable date shows nothing.
  assert.equal(formatNotificationTime(ago(-5 * MIN), NOW, 'en', 'Just now'), 'Just now');
  assert.equal(formatNotificationTime('not a date', NOW, 'en', 'Just now'), '');

  const arabic = formatNotificationTime(ago(5 * HOUR), NOW, 'ar', 'الآن');
  assert.match(arabic, /5/);
  assert.doesNotMatch(arabic, /[٠-٩۰-۹]/);
  assert.equal(formatNotificationTime(ago(25 * HOUR), NOW, 'ar', 'الآن'), 'أمس');

  assert.match(formatExactTime('2026-11-19T10:00:00Z', 'en'), /2026/);
  assert.equal(formatExactTime('nope', 'en'), '');
  assert.doesNotMatch(formatExactTime('2026-11-19T10:00:00Z', 'ar'), /[٠-٩۰-۹]/);
});

test('badge: nothing for no count or 0, 1 to 99, then 99+', () => {
  for (const value of [null, undefined, 0, -3, Number.NaN]) assert.equal(formatBadge(value), '');
  assert.equal(formatBadge(1), '1');
  assert.equal(formatBadge(99), '99');
  assert.equal(formatBadge(100), '99+');
  assert.equal(formatBadge(12345), '99+');
});

test('errors: the list reasons follow the Saved and Tracking pages', () => {
  assert.equal(classifyListError(new ApiError('x', [], 401)), 'unauthorized');
  assert.equal(classifyListError(new ApiError('x', [], 403)), 'forbidden');
  for (const status of [404, 422, 500, 503, undefined]) {
    assert.equal(classifyListError(new ApiError('x', [], status)), 'generic');
  }
  assert.equal(classifyListError(new Error('network')), 'generic');
  assert.equal(classifyListError(new NotificationsContractError('list')), 'generic');
});

// ----------------------------- polling decisions (FR-043, FR-044) ----------

test('polling: 60 seconds, suspended while marking, stopped by 401, 403 and 404 only', () => {
  assert.equal(polling.POLL_INTERVAL_MS, 60_000);
  assert.equal(polling.pollingInterval({ terminal: false, marking: false }), 60_000);
  assert.equal(polling.pollingInterval({ terminal: true, marking: false }), false);
  assert.equal(polling.pollingInterval({ terminal: false, marking: true }), false);
  assert.equal(polling.shouldFocusRefetch({ terminal: false, marking: false }), true);
  assert.equal(polling.shouldFocusRefetch({ terminal: true, marking: false }), false);
  assert.equal(polling.shouldFocusRefetch({ terminal: false, marking: true }), false);
  for (const status of [401, 403, 404]) {
    assert.equal(polling.isTerminalStatus(new ApiError('x', [], status)), true, String(status));
  }
  for (const status of [400, 408, 422, 429, 500, 502, 503, undefined]) {
    assert.equal(polling.isTerminalStatus(new ApiError('x', [], status)), false, String(status));
  }
  assert.equal(polling.isTerminalStatus(new TypeError('Failed to fetch')), false);
  assert.equal(polling.isTerminalStatus(null), false);
});

// ----------------------------- cache updates (FR-036 to FR-039) ------------

const n = (id, isRead) => parseOne(raw('scholarship_archived', { id, is_read: isRead })).items[0];
const pagesOf = (...pages) => ({
  pages: pages.map((items, index) => ({
    items,
    page: index + 1,
    pageSize: 20,
    total: 99,
    totalPages: pages.length,
    skipped: { unknownType: 0, malformed: 0 },
  })),
  pageParams: pages.map((_, index) => index + 1),
});
const ids = (data) =>
  data.pages.flatMap((page) => page.items.map((item) => `${item.id}:${item.isRead ? 'r' : 'u'}`));

test('cache: marking one flips only an unread loaded card and says whether it did', () => {
  const data = pagesOf([n(1, false), n(2, true)], [n(3, false)]);
  const result = cache.markReadInPages(data, 3);
  assert.equal(result.flipped, true);
  assert.deepEqual(ids(result.data), ['1:u', '2:r', '3:r']);
  assert.deepEqual(ids(data), ['1:u', '2:r', '3:u'], 'the input is not mutated');
  assert.equal(cache.markReadInPages(data, 2).flipped, false, 'already read');
  assert.equal(cache.markReadInPages(data, 99).flipped, false, 'not loaded');
  assert.deepEqual(cache.markReadInPages(undefined, 1), { data: undefined, flipped: false });
});

test('cache: mark all flips every loaded unread card and reports exactly those ids', () => {
  const data = pagesOf([n(1, false), n(2, true)], [n(3, false)]);
  const result = cache.markAllInPages(data);
  assert.deepEqual(result.flippedIds, [1, 3]);
  assert.deepEqual(ids(result.data), ['1:r', '2:r', '3:r']);
  assert.deepEqual(ids(cache.restoreUnread(result.data, result.flippedIds)), ['1:u', '2:r', '3:u']);
  const allRead = pagesOf([n(1, true)]);
  assert.equal(cache.markAllInPages(allRead).data, allRead);
  assert.deepEqual(cache.markAllInPages(undefined), { data: undefined, flippedIds: [] });
});

test('cache: restoring touches only the given ids, so another pending change stays', () => {
  const data = pagesOf([n(1, true), n(2, true), n(3, true)]);
  assert.deepEqual(ids(cache.restoreUnread(data, [2])), ['1:r', '2:u', '3:r']);
  assert.equal(cache.restoreUnread(data, []), data);
  assert.equal(cache.restoreUnread(undefined, [1]), undefined);
});

test('cache: a 404 removes the card, and the helpers tolerate a missing list', () => {
  const data = pagesOf([n(1, false), n(2, true)], [n(3, false)]);
  assert.deepEqual(ids(cache.removeFromPages(data, 2)), ['1:u', '3:u']);
  assert.equal(cache.removeFromPages(undefined, 2), undefined);
  assert.equal(cache.findNotification(undefined, 1), undefined);
  assert.equal(cache.hasUnread(undefined), false);
  assert.equal(cache.hasUnread(data), true);
  assert.equal(cache.hasUnread(pagesOf([n(1, true)])), false);
});

test('cache: the count never goes below 0 and is left alone when it has not loaded', () => {
  assert.deepEqual(cache.adjustCount({ unreadCount: 3 }, -1), { unreadCount: 2 });
  assert.deepEqual(cache.adjustCount({ unreadCount: 0 }, -1), { unreadCount: 0 });
  assert.deepEqual(cache.adjustCount({ unreadCount: 2 }, +1), { unreadCount: 3 });
  assert.equal(cache.adjustCount(undefined, -1), undefined);
});

test('cache: pages merge by id, the first copy wins and the order is the server order', () => {
  const data = pagesOf([n(5, false), n(4, false)], [n(4, true), n(3, false)]);
  const merged = cache.mergePages(data.pages);
  assert.deepEqual(
    merged.map((item) => `${item.id}:${item.isRead ? 'r' : 'u'}`),
    ['5:u', '4:u', '3:u']
  );
});

// ----------------------------- copy (FR-020 to FR-026) ---------------------

test('copy: deadline reminder (en) names the scholarship, days, date, documents and reminder', () => {
  const copy = copyOf('deadline_reminder');
  assert.equal(copy.title, 'Deadline approaching: DAAD');
  assert.equal(
    copy.body,
    '17 days left until the deadline (September 15). Documents still to upload: recommendation letters.'
  );
  assert.equal(copy.reminder, 'Reminder 1 of 2');
  assert.equal(copy.time, '2 hours ago');
  assert.doesNotMatch(JSON.stringify(copy), /days before/i);
});

test('copy: deadline reminder plural forms, document lists and unknown document codes', () => {
  const body = (changes) =>
    buildNotificationCopy(parseOne(withParams('deadline_reminder', changes)).items[0], {
      t: t('en'),
      locale: 'en',
      now: NOW,
    }).body;
  assert.equal(
    body({ days_left: 0, missing_documents: [] }),
    'The deadline is today (September 15).'
  );
  assert.equal(
    body({ days_left: 1, missing_documents: [] }),
    '1 day left until the deadline (September 15).'
  );
  assert.match(
    body({ missing_documents: ['cv', 'passport'] }),
    /Documents still to upload: CV and passport\.$/
  );
  assert.match(body({ missing_documents: ['cv', 'something_new'] }), /: CV\.$/);
  assert.match(
    body({ missing_documents: ['something_new'] }),
    /Some of your documents are still missing\.$/
  );
  assert.doesNotMatch(body({ missing_documents: ['something_new'] }), /something_new/);
});

test('copy: deadline reminder (ar) has Arabic plural forms and Latin digits', () => {
  const body = (days) =>
    buildNotificationCopy(
      parseOne(withParams('deadline_reminder', { days_left: days, missing_documents: [] }))
        .items[0],
      { t: t('ar'), locale: 'ar', now: NOW }
    ).body;
  assert.match(body(0), /^الموعد النهائي اليوم/);
  assert.match(body(1), /^يتبقى يوم واحد/);
  assert.match(body(2), /^يتبقى يومان/);
  assert.match(body(3), /^يتبقى 3 أيام/);
  assert.match(body(11), /^يتبقى 11 يوماً/);
  assert.match(body(100), /^يتبقى 100 يوم/);
  const copy = copyOf('deadline_reminder', 'ar');
  assert.equal(copy.title, 'موعد نهائي يقترب — DAAD');
  assert.doesNotMatch(JSON.stringify(copy), /[٠-٩۰-۹]/);
});

test('copy: match, saved update, archive, profile and document analysis use only contract fields', () => {
  assert.equal(
    copyOf('scholarship_match').body,
    '«Erasmus Mundus» was added: it matches 4 of 5 criteria.'
  );
  assert.equal(
    buildNotificationCopy(
      parseOne(withParams('scholarship_match', { matched_count: 1, total_count: 1 })).items[0],
      { t: t('en'), locale: 'en', now: NOW }
    ).body,
    '«Erasmus Mundus» was added: it matches 1 of 1 criterion.'
  );
  assert.equal(copyOf('scholarship_match').title, 'A new scholarship matches your profile');
  assert.equal(
    copyOf('saved_scholarship_updated').body,
    'The details of «Chevening» were updated: a new language requirement was added.'
  );
  const unknownChange = buildNotificationCopy(
    parseOne(withParams('saved_scholarship_updated', { change: 'deadline_changed' })).items[0],
    { t: t('en'), locale: 'en', now: NOW }
  );
  assert.equal(unknownChange.body, 'The details of «Chevening» were updated.');
  assert.equal(
    copyOf('scholarship_archived').body,
    '«Islamic University 2025» has been archived and is no longer available.'
  );
  assert.match(copyOf('profile_incomplete').body, /^Complete the remaining 18% of your profile/);
  assert.match(copyOf('profile_incomplete').body, /70% complete is needed for match scores\.$/);
  assert.equal(
    copyOf('document_analysis_ready').body,
    'We found 8 suggestions for your document, for «DAAD».'
  );
  const analysis = (changes) =>
    buildNotificationCopy(parseOne(withParams('document_analysis_ready', changes)).items[0], {
      t: t('en'),
      locale: 'en',
      now: NOW,
    }).body;
  assert.equal(
    analysis({ target_scholarship_title: null, suggestions_count: 1 }),
    'We found 1 suggestion for your document.'
  );
  assert.equal(
    analysis({ target_scholarship_title: null, suggestions_count: 0 }),
    'The analysis found no suggestions.'
  );
});

test('copy: percentages are rounded for display and the Arabic copy keeps Latin digits', () => {
  const rounded = buildNotificationCopy(
    parseOne(withParams('profile_incomplete', { remaining_percent: 17.6, threshold_percent: 70 }))
      .items[0],
    { t: t('en'), locale: 'en', now: NOW }
  );
  assert.match(rounded.body, /remaining 18% /);
  for (const type of NOTIFICATION_TYPES) {
    const copy = copyOf(type, 'ar');
    assert.ok(copy.title && copy.body, type);
    assert.doesNotMatch(JSON.stringify(copy), /[٠-٩۰-۹]/, type);
    assert.doesNotMatch(`${copy.title} ${copy.body}`, /\bundefined\b|\bnull\b|[{}]/, type);
  }
});

test('copy: no sentence ever comes from the backend', () => {
  const item = parseOne(
    raw('scholarship_archived', {
      title: 'SERVER SENTENCE',
      message: 'SERVER SENTENCE',
      body: 'SERVER SENTENCE',
    })
  ).items[0];
  const copy = buildNotificationCopy(item, { t: t('en'), locale: 'en', now: NOW });
  assert.doesNotMatch(JSON.stringify(copy), /SERVER SENTENCE/);
});

// ----------------------------- i18n (FR-070, FR-071) -----------------------

const flat = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? flat(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]]
  );

const notificationEntries = (locale) => [
  ...flat(messages[locale].StudentNotifications).map(([key, value]) => [
    `StudentNotifications.${key}`,
    value,
  ]),
  ...flat(messages[locale].StudentLayout.pages.notifications).map(([key, value]) => [
    `StudentLayout.pages.notifications.${key}`,
    value,
  ]),
  ['StudentLayout.nav.notifications', messages[locale].StudentLayout.nav.notifications],
  ['StudentLayout.userMenu.notifications', messages[locale].StudentLayout.userMenu.notifications],
];

test('i18n: ar and en have identical key shapes for everything this feature adds', () => {
  const keys = (locale) =>
    notificationEntries(locale)
      .map(([key]) => key)
      .sort();
  assert.deepEqual(keys('ar'), keys('en'));
  assert.ok(keys('en').length > 50);
});

test('i18n: every message is valid ICU, formats in both locales, never uses # and keeps Latin digits', () => {
  const values = {
    title: 'DAAD',
    days: 3,
    date: 'September 15',
    list: 'CV',
    matched: 4,
    total: 5,
    remaining: 18,
    threshold: 70,
    count: 3,
    index: 1,
  };
  for (const locale of ['en', 'ar']) {
    for (const [key, value] of notificationEntries(locale)) {
      assert.equal(typeof value, 'string', `${locale} ${key}`);
      assert.ok(value.trim(), `${locale} ${key} is empty`);
      assert.doesNotMatch(value, /#/, `${locale} ${key} uses # (not pinned to Latin digits)`);
      const formatted = format(value, values, locale);
      assert.equal(typeof formatted, 'string', `${locale} ${key}`);
      assert.doesNotMatch(formatted, /[٠-٩۰-۹]/, `${locale} ${key} has non-Latin digits`);
    }
  }
});

function pluralNodes(ast) {
  const found = [];
  const visit = (nodes) => {
    for (const node of nodes) {
      if (node.type === 6) found.push(node);
      if (node.options) for (const option of Object.values(node.options)) visit(option.value);
    }
  };
  visit(ast);
  return found;
}

test('i18n: plural messages define every category their locale needs', () => {
  const required = { ar: ['one', 'two', 'few', 'many', 'other'], en: ['one', 'other'] };
  let checked = 0;
  for (const locale of ['en', 'ar']) {
    for (const [key, message] of notificationEntries(locale)) {
      for (const node of pluralNodes(new IntlMessageFormat(message, locale).getAst())) {
        const options = Object.keys(node.options);
        for (const category of required[locale]) {
          assert.ok(options.includes(category), `${locale} ${key} lacks "${category}"`);
        }
        // Arabic has a zero form; English only needs one where the sentence differs for 0.
        if (locale === 'ar') {
          assert.ok(
            options.includes('=0') || options.includes('zero'),
            `${locale} ${key} lacks a zero case`
          );
        }
        checked += 1;
      }
    }
  }
  assert.ok(checked >= 10, `expected the plural messages to be checked, saw ${checked}`);
});

test('i18n: the known document and change codes each have a message in both languages', () => {
  for (const locale of ['en', 'ar']) {
    for (const code of KNOWN_DOCUMENT_CODES) {
      assert.equal(
        typeof messages[locale].StudentNotifications.documents[code],
        'string',
        `${locale} ${code}`
      );
    }
    for (const code of KNOWN_CHANGE_CODES) {
      assert.equal(
        typeof messages[locale].StudentNotifications.types.saved_scholarship_updated.changes[code],
        'string',
        `${locale} ${code}`
      );
    }
  }
  assert.deepEqual([...KNOWN_CHANGE_CODES], ['language_requirement_added']);
});

test('i18n: Arabic badge and bell plurals render for 0, 1, 2, 3, 11 and 100', () => {
  const badge = (count) =>
    format(lookup('StudentNotifications', 'badge.unread', 'ar'), { count }, 'ar');
  assert.equal(badge(0), 'لا توجد إشعارات غير مقروءة');
  assert.equal(badge(1), 'إشعار واحد غير مقروء');
  assert.equal(badge(2), 'إشعاران غير مقروءين');
  assert.equal(badge(3), '3 إشعارات غير مقروءة');
  assert.equal(badge(11), '11 إشعاراً غير مقروء');
  assert.equal(badge(100), '100 إشعار غير مقروء');
});

// ----------------------------- Home source (FR-040, A1) --------------------

const { useUnreadSource, unreadCountQueryKey } = loadFeature('lib/unread-source.ts');
const { studentHomeKeys } = loadSrc('features/student/home/query-keys.ts');

const kindOf = (props) => {
  let kind;
  function Probe() {
    kind = useUnreadSource(props).kind;
    return React.createElement('i');
  }
  render(React.createElement(Probe), 'en');
  return kind;
};

test('home source: the flag makes the unread count real, otherwise Home keeps its own behavior', () => {
  assert.equal(kindOf({ notificationsEnabled: true }), 'real');
  assert.equal(kindOf({ notificationsEnabled: false }), 'unavailable');
  // Home's local demo source still works with the flag off, and real wins when it is on.
  assert.equal(kindOf({ notificationsEnabled: false, mockSections: ['notifications'] }), 'mock');
  assert.equal(kindOf({ notificationsEnabled: true, mockSections: ['notifications'] }), 'real');
  assert.deepEqual(unreadCountQueryKey(), ['student-home', 'notifications', 'real']);
  assert.deepEqual(unreadCountQueryKey(), studentHomeKeys.source('notifications', 'real'));
});

test('home source: the static availability table is not edited by this feature', () => {
  const { HOME_API_AVAILABILITY } = loadSrc('features/student/home/config/home-sections.ts');
  assert.deepEqual(
    { ...HOME_API_AVAILABILITY },
    {
      notifications: false,
      activity: false,
      recommendations: false,
    }
  );
  void env;
});

// ----------------------------- mark as read (FR-033 to FR-039) -------------

const { MutationObserver } = loadPackage('@tanstack/react-query');
const { markReadOptions, markAllOptions, shouldMark } = loadFeature('lib/mark-options.ts');

const LIST_KEY = ['student-notifications', 'list'];
const COUNT_KEY = ['student-home', 'notifications', 'real'];
const wait = (ms = 15) => new Promise((resolve) => setTimeout(resolve, ms));
const defer = () => {
  let resolve;
  const promise = new Promise((done) => (resolve = done));
  return { promise, resolve };
};

// Replaces fetch for the apiClient: `handler({ url, method })` answers { status, body }.
function stubFetch(handler) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const call = { url: String(url), method: init.method ?? 'GET' };
    calls.push(call);
    const { status, body } = await handler(call);
    return { ok: status < 400, status, json: async () => body };
  };
  return { calls, restore: () => (globalThis.fetch = original) };
}

const seeded = ({ count = 3, list = pagesOf([n(1, false), n(2, true), n(3, false)]) } = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(LIST_KEY, list);
  if (count !== null) client.setQueryData(COUNT_KEY, { unreadCount: count });
  return client;
};
const listIds = (client) => ids(client.getQueryData(LIST_KEY));
const countOf = (client) => client.getQueryData(COUNT_KEY)?.unreadCount;
const readAnswer = (id) => ({
  status: 200,
  body: { id, is_read: true, read_at: '2026-11-19T12:00:00Z' },
});

test('mark: the card and the count change before the server answers, then one PATCH is sent', async () => {
  const gate = defer();
  const fetchStub = stubFetch(async () => {
    await gate.promise;
    return readAnswer(1);
  });
  try {
    const client = seeded();
    const pending = new Set([1]);
    const done = new MutationObserver(client, markReadOptions(client, pending, {})).mutate(1);
    await wait();
    // Still waiting for the server: the optimistic state is already visible.
    assert.deepEqual(listIds(client), ['1:r', '2:r', '3:u']);
    assert.equal(countOf(client), 2);
    assert.equal(fetchStub.calls.length, 1);
    assert.equal(fetchStub.calls[0].method, 'PATCH');
    assert.match(fetchStub.calls[0].url, /\/api\/notifications\/1\/read$/);

    gate.resolve();
    await done;
    assert.deepEqual(listIds(client), ['1:r', '2:r', '3:u']);
    assert.equal(countOf(client), 2);
    assert.equal(pending.has(1), false, 'the id is free again');
    assert.equal(client.getQueryState(COUNT_KEY).isInvalidated, true, 'the count is reconciled');
    assert.equal(fetchStub.calls.length, 1, 'one request');
  } finally {
    fetchStub.restore();
  }
});

test('mark: a failed PATCH restores only that card and its share of the count, and reports once', async () => {
  const fetchStub = stubFetch(async () => ({ status: 500, body: { detail: 'boom' } }));
  try {
    const client = seeded();
    let failures = 0;
    const observer = new MutationObserver(
      client,
      markReadOptions(client, new Set([3]), { onFailed: () => (failures += 1) })
    );
    await observer.mutate(3).catch(() => {});
    assert.deepEqual(listIds(client), ['1:u', '2:r', '3:u']);
    assert.equal(countOf(client), 3);
    assert.equal(failures, 1);
  } finally {
    fetchStub.restore();
  }
});

test('mark: a 404 means already gone, so the card is dropped, the count is kept and nothing is reported', async () => {
  const fetchStub = stubFetch(async () => ({
    status: 404,
    body: { detail: 'Notification not found' },
  }));
  try {
    const client = seeded();
    let failures = 0;
    const observer = new MutationObserver(
      client,
      markReadOptions(client, new Set([1]), { onFailed: () => (failures += 1) })
    );
    await observer.mutate(1).catch(() => {});
    assert.deepEqual(listIds(client), ['2:r', '3:u'], 'the card is gone, not rolled back');
    assert.equal(countOf(client), 2, 'no rollback of the count either');
    assert.equal(failures, 0, 'no error message');
    assert.equal(client.getQueryState(COUNT_KEY).isInvalidated, true, 'the count is refetched');
  } finally {
    fetchStub.restore();
  }
});

test('mark: overlapping marks are independent; a failure restores only its own change', async () => {
  const gate = defer();
  const fetchStub = stubFetch(async ({ url }) => {
    if (url.endsWith('/1/read')) {
      await gate.promise;
      return readAnswer(1);
    }
    return { status: 500, body: { detail: 'boom' } };
  });
  try {
    const client = seeded();
    const pending = new Set([1, 3]);
    const first = new MutationObserver(client, markReadOptions(client, pending, {})).mutate(1);
    const second = new MutationObserver(client, markReadOptions(client, pending, {})).mutate(3);
    await second.catch(() => {});
    assert.deepEqual(listIds(client), ['1:r', '2:r', '3:u'], '1 stays read while 3 is restored');
    assert.equal(countOf(client), 2, 'only the failed delta came back');
    assert.equal(client.getQueryState(COUNT_KEY).isInvalidated, false, 'one mark is still pending');
    gate.resolve();
    await first;
    assert.equal(client.getQueryState(COUNT_KEY).isInvalidated, true, 'reconciled after the last');
  } finally {
    fetchStub.restore();
  }
});

test('mark: with no count loaded the count is left alone and the list still flips', async () => {
  const gate = defer();
  const fetchStub = stubFetch(async () => {
    await gate.promise;
    return { status: 500, body: { detail: 'boom' } };
  });
  try {
    const client = seeded({ count: null });
    const observer = new MutationObserver(client, markReadOptions(client, new Set([1]), {}));
    const done = observer.mutate(1).catch(() => {});
    await wait();
    assert.deepEqual(listIds(client), ['1:r', '2:r', '3:u']);
    assert.equal(client.getQueryData(COUNT_KEY), undefined);
    gate.resolve();
    await done;
    assert.deepEqual(listIds(client), ['1:u', '2:r', '3:u']);
    assert.equal(client.getQueryData(COUNT_KEY), undefined);
  } finally {
    fetchStub.restore();
  }
});

test('mark: the count never goes below 0', async () => {
  const fetchStub = stubFetch(async () => readAnswer(1));
  try {
    const client = seeded({ count: 0 });
    await new MutationObserver(client, markReadOptions(client, new Set([1]), {})).mutate(1);
    assert.equal(countOf(client), 0);
  } finally {
    fetchStub.restore();
  }
});

test('mark: nothing is sent for a read card or one already being marked', () => {
  const client = seeded();
  assert.equal(shouldMark(client, new Set(), 1), true, 'unread');
  assert.equal(shouldMark(client, new Set(), 2), false, 'already read');
  assert.equal(shouldMark(client, new Set([1]), 1), false, 'already in flight');
  assert.equal(
    shouldMark(client, new Set(), 99),
    true,
    'not in the loaded list: the backend decides'
  );
});

test('mark: starting a mark cancels a count request in flight', async () => {
  const fetchStub = stubFetch(async () => readAnswer(1));
  try {
    const client = seeded();
    void client.prefetchQuery({
      queryKey: COUNT_KEY,
      queryFn: () => new Promise(() => {}),
      staleTime: 0,
    });
    await wait(5);
    assert.equal(client.isFetching({ queryKey: COUNT_KEY }), 1);
    const done = new MutationObserver(client, markReadOptions(client, new Set([1]), {})).mutate(1);
    await wait();
    assert.equal(
      client.isFetching({ queryKey: COUNT_KEY }),
      0,
      'the request in flight is cancelled'
    );
    await done;
  } finally {
    fetchStub.restore();
  }
});

test('mark all: every loaded card reads and the count is 0 at once, with one PATCH', async () => {
  const gate = defer();
  const fetchStub = stubFetch(async () => {
    await gate.promise;
    return { status: 200, body: { updated: 5 } };
  });
  try {
    const client = seeded({ count: 5 });
    let done = 0;
    const observer = new MutationObserver(
      client,
      markAllOptions(client, { onDone: () => (done += 1) })
    );
    const request = observer.mutate();
    await wait();
    assert.deepEqual(listIds(client), ['1:r', '2:r', '3:r']);
    assert.equal(countOf(client), 0);
    assert.equal(fetchStub.calls.length, 1);
    assert.equal(fetchStub.calls[0].method, 'PATCH');
    assert.match(fetchStub.calls[0].url, /\/api\/notifications\/read-all$/);
    gate.resolve();
    await request;
    assert.equal(done, 1);
    assert.equal(client.getQueryState(COUNT_KEY).isInvalidated, true);
  } finally {
    fetchStub.restore();
  }
});

test('mark all: a failure restores exactly the cards it flipped and the previous count', async () => {
  const fetchStub = stubFetch(async () => ({ status: 503, body: {} }));
  try {
    const client = seeded({ count: 5 });
    let failures = 0;
    const observer = new MutationObserver(
      client,
      markAllOptions(client, { onFailed: () => (failures += 1) })
    );
    await observer.mutate().catch(() => {});
    assert.deepEqual(listIds(client), ['1:u', '2:r', '3:u']);
    assert.equal(countOf(client), 5);
    assert.equal(failures, 1);
  } finally {
    fetchStub.restore();
  }
});

test('mark all: it works without a loaded list, and a bad answer is a failure', async () => {
  const ok = stubFetch(async () => ({ status: 200, body: { updated: 0 } }));
  try {
    const client = new QueryClient();
    client.setQueryData(COUNT_KEY, { unreadCount: 2 });
    await new MutationObserver(client, markAllOptions(client)).mutate();
    assert.equal(countOf(client), 0);
  } finally {
    ok.restore();
  }
  const bad = stubFetch(async () => ({ status: 200, body: { updated: 'many' } }));
  try {
    const client = seeded({ count: 4 });
    let failures = 0;
    await new MutationObserver(client, markAllOptions(client, { onFailed: () => (failures += 1) }))
      .mutate()
      .catch(() => {});
    assert.equal(failures, 1);
    assert.equal(countOf(client), 4);
  } finally {
    bad.restore();
  }
});

// ----------------------------- pagination and page states (FR-050 to FR-054) -----------------

const { getNextPageNumber, getListView, isUnauthorized } = loadFeature('lib/page-view.ts');

test('pagination: the next page follows the server pages and stops after the last', () => {
  assert.equal(getNextPageNumber({ page: 1, totalPages: 3 }), 2);
  assert.equal(getNextPageNumber({ page: 2, totalPages: 3 }), 3);
  assert.equal(getNextPageNumber({ page: 3, totalPages: 3 }), undefined);
  assert.equal(
    getNextPageNumber({ page: 1, totalPages: 0 }),
    undefined,
    'an empty list has no next'
  );
  assert.equal(getNextPageNumber({ page: 5, totalPages: 3 }), undefined, 'a page past the end');
});

test('page view: loading, error, empty and list never look like each other', () => {
  const base = {
    clockReady: true,
    isPending: false,
    isError: false,
    hasData: true,
    itemCount: 3,
    hasNextPage: false,
  };
  assert.equal(getListView(base), 'list');
  assert.equal(getListView({ ...base, isPending: true, hasData: false, itemCount: 0 }), 'loading');
  assert.equal(
    getListView({ ...base, clockReady: false }),
    'loading',
    'the student clock is not known yet'
  );
  // The first page failed: the error state, never an empty one.
  assert.equal(getListView({ ...base, isError: true, hasData: false, itemCount: 0 }), 'error');
  // A later page failed: the notifications already loaded stay.
  assert.equal(getListView({ ...base, isError: true, hasData: true }), 'list');
  // Empty only on the last page with nothing renderable.
  assert.equal(getListView({ ...base, itemCount: 0, hasNextPage: false }), 'empty');
  assert.equal(
    getListView({ ...base, itemCount: 0, hasNextPage: true }),
    'list',
    'more pages may still hold renderable items, so "Load more" stays'
  );
});

test('page view: a page whose items were all skipped keeps Load more until the last page', () => {
  const skippedPage = (page, totalPages) =>
    parseNotificationPage(
      envelope(
        [
          { id: 1, type: 'brand_new_type', params: {} },
          { id: 2, type: 'another_new_type', params: {} },
        ],
        { page, total_pages: totalPages }
      )
    );
  const first = skippedPage(1, 2);
  assert.deepEqual(first.items, []);
  assert.deepEqual(first.skipped, { unknownType: 2, malformed: 0 });
  assert.equal(getNextPageNumber(first), 2);
  const state = (page) => ({
    clockReady: true,
    isPending: false,
    isError: false,
    hasData: true,
    itemCount: 0,
    hasNextPage: getNextPageNumber(page) !== undefined,
  });
  assert.equal(getListView(state(first)), 'list');
  assert.equal(getListView(state(skippedPage(2, 2))), 'empty');
});

test('session: only a 401 asks the session to be re-checked', () => {
  assert.equal(isUnauthorized(new ApiError('x', [], 401)), true);
  for (const status of [400, 403, 404, 500, undefined]) {
    assert.equal(isUnauthorized(new ApiError('x', [], status)), false, String(status));
  }
  assert.equal(isUnauthorized(new Error('network')), false);
  assert.equal(isUnauthorized(null), false);
});
