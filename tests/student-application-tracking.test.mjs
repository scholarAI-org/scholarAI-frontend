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

const srcPath = fileURLToPath(new URL('../src', import.meta.url));
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith('@/') ? path.join(srcPath, request.slice(2)) : request;
  return resolveFilename.call(this, target, ...rest);
};

process.env.BACKEND_URL = 'https://backend.test/';
// Default-off: never set TRACKING_ENABLED at module top level.

const feature = (file) =>
  loadModule(path.join(srcPath, 'features/student/application-tracking', file));
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

// Fakes live here only: runtime code never imports from tests/.
const makeScholarship = (overrides = {}) => ({
  id: 11,
  title: 'Erasmus Mundus',
  title_ar: 'إيراسموس موندوس',
  title_en: 'Erasmus Mundus Joint Master',
  organization_name: 'European Union',
  country: 'Belgium',
  deadline: '2026-01-15',
  no_deadline: false,
  is_saved: true,
  ...overrides,
});
const makeItem = (overrides = {}) => ({
  id: 5,
  status: 'preparing_documents',
  notes: null,
  status_changed_at: '2025-10-02T09:15:00',
  created_at: '2025-09-30T08:00:00',
  updated_at: '2025-10-02T09:15:00',
  scholarship: makeScholarship(),
  ...overrides,
});
const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const fakeFetch = (handler) => {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? 'GET', body: init.body });
    return handler(String(url), init);
  };
  return calls;
};

// -------------------- flag ---------------------------------------------------

test('flag: TRACKING_ENABLED is false when unset and only the literal "true" enables it', () => {
  const prev = process.env.TRACKING_ENABLED;
  const { featureFlags } = loadModule(path.join(srcPath, 'lib/feature-flags.ts'));
  try {
    delete process.env.TRACKING_ENABLED;
    assert.equal(featureFlags.trackingEnabled, false);
    for (const value of ['', 'false', '0', '1', 'yes', 'TRUE', ' true ', 'True']) {
      process.env.TRACKING_ENABLED = value;
      assert.equal(featureFlags.trackingEnabled, false, `value=${JSON.stringify(value)}`);
    }
    process.env.TRACKING_ENABLED = 'true';
    assert.equal(featureFlags.trackingEnabled, true);
  } finally {
    if (prev === undefined) delete process.env.TRACKING_ENABLED;
    else process.env.TRACKING_ENABLED = prev;
  }
});

// -------------------- list adapter -------------------------------------------

test('list: parses items into the model and keeps backend order', () => {
  const { parseTrackedList } = feature('lib/adapter.ts');
  const { items, skipped } = parseTrackedList([
    makeItem({ id: 9, status: 'applied' }),
    makeItem({ id: 5, notes: 'waiting for a letter' }),
  ]);
  assert.equal(skipped, 0);
  assert.deepEqual(
    items.map((item) => item.id),
    [9, 5]
  );
  assert.equal(items[0].status, 'applied');
  assert.equal(items[1].notes, 'waiting for a letter');
  assert.equal(items[1].scholarship.id, 11);
  assert.equal(items[1].statusChangedAt, '2025-10-02T09:15:00');
  assert.equal(items[1].officialUrl, null);
});

test('list: an empty array is a legitimate success', () => {
  const { parseTrackedList } = feature('lib/adapter.ts');
  assert.deepEqual(parseTrackedList([]), { items: [], skipped: 0 });
});

test('list: a response that is not an array is a contract error, never an empty success', () => {
  const { parseTrackedList } = feature('lib/adapter.ts');
  const { TrackingContractError } = feature('lib/errors.ts');
  for (const raw of [null, undefined, {}, { items: [] }, 'x', 7]) {
    assert.throws(() => parseTrackedList(raw), TrackingContractError);
  }
});

test('list: malformed items are skipped and counted, valid ones survive', () => {
  const { parseTrackedList } = feature('lib/adapter.ts');
  const { items, skipped } = parseTrackedList([
    makeItem({ id: 1 }),
    makeItem({ id: 2, status: 'saved' }), // not a backend status
    makeItem({ id: 0 }),
    makeItem({ id: 3, scholarship: null }),
    makeItem({ id: 4, scholarship: makeScholarship({ id: 'x' }) }),
    makeItem({ id: 6, status_changed_at: undefined }),
    null,
    'nope',
    makeItem({ id: 7 }),
  ]);
  assert.deepEqual(
    items.map((item) => item.id),
    [1, 7]
  );
  assert.equal(skipped, 7);
});

test('list: wrongly typed optional card fields are tolerated, not fatal', () => {
  const { parseTrackedList } = feature('lib/adapter.ts');
  const { items, skipped } = parseTrackedList([
    makeItem({ scholarship: makeScholarship({ country: 5, image_url: {}, deadline: 12 }) }),
  ]);
  assert.equal(skipped, 0);
  assert.equal(items.length, 1);
});

test('list: official_url is exposed only when present and a safe http(s) URL', () => {
  const { parseTrackedList } = feature('lib/adapter.ts');
  const urlOf = (official_url) =>
    parseTrackedList([makeItem({ official_url })]).items[0].officialUrl;
  assert.equal(urlOf('https://apply.example.org/path'), 'https://apply.example.org/path');
  assert.equal(urlOf(undefined), null);
  assert.equal(urlOf(null), null);
  assert.equal(urlOf(''), null);
  assert.equal(urlOf('javascript:alert(1)'), null);
  assert.equal(urlOf('/relative'), null);
  assert.equal(urlOf('mailto:a@b.co'), null);
});

// -------------------- timestamps (BE-08: no timezone suffix guaranteed) --------

test('timestamps: a value with a zone is converted in the requested zone', () => {
  const { trackingDateLabel } = feature('lib/timestamps.ts');
  assert.equal(trackingDateLabel('2025-10-02T09:15:00Z', 'UTC'), '2025-10-02');
  assert.equal(trackingDateLabel('2025-10-02T23:30:00Z', 'Asia/Gaza'), '2025-10-03');
  assert.equal(trackingDateLabel('2025-10-02T00:30:00+03:00', 'UTC'), '2025-10-01');
  assert.equal(trackingDateLabel('2025-10-02T09:15:00.123456Z', 'UTC'), '2025-10-02');
});

test('timestamps: a value without a zone keeps its calendar date and is never shifted', () => {
  const { trackingDateLabel } = feature('lib/timestamps.ts');
  for (const zone of ['UTC', 'Asia/Gaza', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
    assert.equal(trackingDateLabel('2025-10-02T23:59:59', zone), '2025-10-02', zone);
    assert.equal(trackingDateLabel('2025-10-02 00:00:01', zone), '2025-10-02', zone);
    assert.equal(trackingDateLabel('2025-10-02T09:15:00.123456', zone), '2025-10-02', zone);
    assert.equal(trackingDateLabel('2025-10-02', zone), '2025-10-02', zone);
  }
});

test('timestamps: unparseable or impossible values give null instead of throwing', () => {
  const { trackingDateLabel } = feature('lib/timestamps.ts');
  for (const value of [
    '',
    'yesterday',
    '2025-13-01T00:00:00',
    '2025-02-30',
    '2025-10-02T25:00:00',
    null,
    undefined,
    5,
  ]) {
    assert.equal(trackingDateLabel(value, 'UTC'), null, String(value));
  }
});

// -------------------- counts -------------------------------------------------

test('counts: derived from the list, every status present, zero when absent', () => {
  const { countByStatus } = feature('lib/counts.ts');
  const { parseTrackedList } = feature('lib/adapter.ts');
  const { items } = parseTrackedList([
    makeItem({ id: 1, status: 'applied' }),
    makeItem({ id: 2, status: 'applied' }),
    makeItem({ id: 3, status: 'closed' }),
  ]);
  assert.deepEqual(countByStatus(items), {
    preparing_documents: 0,
    ready_to_apply: 0,
    applied: 2,
    accepted: 0,
    rejected: 0,
    closed: 1,
  });
});

test('statuses: the six backend values, and the card order puts the UI-only saved card first', () => {
  const { TRACKING_STATUSES, TRACKING_CARD_ORDER, NOTE_MAX_LENGTH } = feature('constants.ts');
  assert.deepEqual(
    [...TRACKING_STATUSES],
    ['preparing_documents', 'ready_to_apply', 'applied', 'accepted', 'rejected', 'closed']
  );
  assert.deepEqual(
    [...TRACKING_CARD_ORDER],
    ['saved', 'preparing_documents', 'ready_to_apply', 'applied', 'accepted', 'rejected', 'closed']
  );
  assert.equal(NOTE_MAX_LENGTH, 2000);
});

// -------------------- error mapping ------------------------------------------

test('errors: mapped by HTTP status, never by the Arabic detail text', async () => {
  const { classifyTrackingError, TrackingContractError } = feature('lib/errors.ts');
  const { ApiError } = loadModule(path.join(srcPath, 'lib/api-client.ts'));
  const kind = (status) => classifyTrackingError(new ApiError('المنحة غير موجودة.', [], status));
  assert.equal(kind(401), 'auth');
  assert.equal(kind(403), 'forbidden');
  assert.equal(kind(404), 'not-found');
  assert.equal(kind(422), 'invalid');
  assert.equal(kind(500), 'server');
  assert.equal(kind(503), 'server');
  assert.equal(classifyTrackingError(new TypeError('Failed to fetch')), 'network');
  assert.equal(classifyTrackingError(new TrackingContractError('not-array')), 'contract');
  assert.equal(classifyTrackingError(new Error('whatever')), 'unknown');
});

// -------------------- API layer ----------------------------------------------

test('api: getTrackedList calls GET /api/scholarships/tracked with no query and validates', async () => {
  const { getTrackedList } = feature('api/tracking.ts');
  const calls = fakeFetch(() => jsonResponse([makeItem(), { broken: true }]));
  const result = await getTrackedList();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].url, 'https://backend.test/api/scholarships/tracked');
  assert.equal(result.items.length, 1);
  assert.equal(result.skipped, 1);
});

test('api: getTrackedList never calls /tracked/statistics', async () => {
  const { getTrackedList } = feature('api/tracking.ts');
  const calls = fakeFetch(() => jsonResponse([]));
  await getTrackedList();
  assert.ok(calls.every((call) => !call.url.includes('statistics')));
});

test('api: a non-array body rejects with a contract error', async () => {
  const { getTrackedList } = feature('api/tracking.ts');
  const { TrackingContractError } = feature('lib/errors.ts');
  fakeFetch(() => jsonResponse({ items: [] }));
  await assert.rejects(getTrackedList(), TrackingContractError);
});

test('api: updateTrackingStatus PATCHes the tracking id with only { status }', async () => {
  const { updateTrackingStatus } = feature('api/tracking.ts');
  const calls = fakeFetch(() =>
    jsonResponse({
      ...makeItem({ id: 5, status: 'applied' }),
      user_id: 1,
      scholarship_id: 11,
      scholarship: undefined,
    })
  );
  const result = await updateTrackingStatus(5, 'applied');
  assert.equal(calls[0].method, 'PATCH');
  assert.equal(calls[0].url, 'https://backend.test/api/scholarships/tracked/5/status');
  assert.deepEqual(JSON.parse(calls[0].body), { status: 'applied' });
  assert.equal(result.status, 'applied');
});

test('api: updateTrackingStatus rejects a status the backend does not know, before any request', async () => {
  const { updateTrackingStatus } = feature('api/tracking.ts');
  const calls = fakeFetch(() => jsonResponse({}));
  await assert.rejects(() => updateTrackingStatus(5, 'saved'));
  await assert.rejects(() => updateTrackingStatus(0, 'applied'));
  await assert.rejects(() => updateTrackingStatus(1.5, 'applied'));
  assert.equal(calls.length, 0);
});

test('api: saveTrackingNote PUTs { notes } and keeps the 2000 limit in code points', async () => {
  const { saveTrackingNote } = feature('api/tracking.ts');
  const { TrackingValidationError } = feature('lib/errors.ts');
  const calls = fakeFetch(() =>
    jsonResponse({
      id: 5,
      user_id: 1,
      scholarship_id: 11,
      notes: 'hi',
      created_at: 'a',
      updated_at: '2025-10-03T10:00:00',
    })
  );
  const saved = await saveTrackingNote(5, 'hi');
  assert.equal(calls[0].method, 'PUT');
  assert.equal(calls[0].url, 'https://backend.test/api/scholarships/tracked/5/note');
  assert.deepEqual(JSON.parse(calls[0].body), { notes: 'hi' });
  assert.equal(saved.notes, 'hi');

  // 2000 emoji are 4000 UTF-16 units but 2000 code points: the backend accepts them.
  await saveTrackingNote(5, '😀'.repeat(2000));
  await assert.rejects(() => saveTrackingNote(5, 'a'.repeat(2001)), TrackingValidationError);
  assert.equal(calls.length, 2);
});

test('api: a blank note is sent as an empty string to clear it', async () => {
  const { saveTrackingNote } = feature('api/tracking.ts');
  const calls = fakeFetch(() =>
    jsonResponse({
      id: 5,
      user_id: 1,
      scholarship_id: 11,
      notes: null,
      created_at: 'a',
      updated_at: 'b',
    })
  );
  const saved = await saveTrackingNote(5, '   \n ');
  assert.deepEqual(JSON.parse(calls[0].body), { notes: '' });
  assert.equal(saved.notes, null);
});

test('api: removeTracking DELETEs the tracking id and reads the bookmark state', async () => {
  const { removeTracking } = feature('api/tracking.ts');
  const calls = fakeFetch(() =>
    jsonResponse({ scholarship_id: 11, is_tracked: false, is_saved: true })
  );
  const result = await removeTracking(5);
  assert.equal(calls[0].method, 'DELETE');
  assert.equal(calls[0].url, 'https://backend.test/api/scholarships/tracked/5');
  assert.deepEqual(result, { scholarshipId: 11, isTracked: false, isSaved: true });
});

test('api: error statuses surface as ApiError and map by status', async () => {
  const { removeTracking } = feature('api/tracking.ts');
  const { classifyTrackingError } = feature('lib/errors.ts');
  fakeFetch(() => jsonResponse({ detail: 'المنحة غير موجودة.' }, 404));
  await assert.rejects(removeTracking(5), (error) => classifyTrackingError(error) === 'not-found');
});

// -------------------- production import guard --------------------------------

test('guard: tracking sources never import tests, scripts or fixtures', () => {
  const root = path.join(srcPath, 'features/student/application-tracking');
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /from ['"][^'"]*(tests|scripts|fixtures)\//, file);
  }
});
