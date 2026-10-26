import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, test } from 'node:test';
import { IntlMessageFormat } from 'intl-messageformat';
import ts from 'typescript';

// Feature 008 phase 5: start tracking (BE-02, PUT /api/scholarships/{id}/tracking).
// Rollback tests were written before the implementation and run red first.

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
const featurePath = path.join(srcPath, 'features/student/application-tracking');
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
const env = { locale: 'en' };
const lookup = (namespace, key) =>
  `${namespace}.${key}`
    .split('.')
    .reduce((v, p) => (v && typeof v === 'object' ? v[p] : undefined), messages[env.locale]);
const nextIntlStub = {
  useLocale: () => env.locale,
  useTranslations: (namespace) => (key, values) => {
    const message = lookup(namespace, key);
    if (typeof message !== 'string') return `${namespace}.${key}`;
    return String(new IntlMessageFormat(message, env.locale, intlFormats).format(values));
  },
};
const navigationStub = {
  Link: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  usePathname: () => '/student/scholarships',
  useRouter: () => ({ replace() {}, push() {}, prefetch() {} }),
};
const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === 'next-intl') return nextIntlStub;
  if (request === '@/i18n/navigation') return navigationStub;
  return originalLoad.call(this, request, parent, ...rest);
};

const feature = (rel) => loadModule(path.join(featurePath, rel));
const { QueryClient, QueryClientProvider, MutationObserver, QueryObserver } =
  loadModule('@tanstack/react-query');
const h = React.createElement;

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

// Fakes live here only.
const wireItem = (id, scholarshipId, status = 'applied') => ({
  id,
  status,
  notes: null,
  status_changed_at: '2025-10-02T09:15:00',
  created_at: '2025-09-30T08:00:00',
  updated_at: '2025-10-02T09:15:00',
  scholarship: { id: scholarshipId, title: `Scholarship ${scholarshipId}`, is_saved: false },
});
const modelItem = (id, scholarshipId, status = 'applied') => ({
  id,
  status,
  notes: null,
  statusChangedAt: 'a',
  createdAt: 'b',
  updatedAt: 'c',
  officialUrl: null,
  scholarship: { id: scholarshipId, title: `Scholarship ${scholarshipId}`, is_saved: false },
});
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const deferred = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

// A tiny fake backend for the tracked list and the start endpoint.
function fakeBackend({
  tracked = [],
  start = () => json({ status: 'preparing_documents', updated_at: '2025-10-26T10:00:00Z' }),
} = {}) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const method = init.method ?? 'GET';
    calls.push({ url: String(url), method, body: init.body });
    if (method === 'GET' && String(url).endsWith('/api/scholarships/tracked')) {
      return json(tracked);
    }
    if (method === 'PUT' && String(url).includes('/tracking')) {
      return start(String(url), init);
    }
    return json({ detail: 'not found' }, 404);
  };
  return { calls, tracked };
}

function setup(listItems) {
  const { trackingKeys } = feature('query-keys.ts');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  if (listItems) client.setQueryData(trackingKeys.list(), { items: listItems, skipped: 0 });
  const started = () => client.getQueryData(trackingKeys.started()) ?? {};
  return { client, trackingKeys, started };
}

// -------------------- API ----------------------------------------------------

test('constants: the default status for a new tracking is preparing_documents', () => {
  const { DEFAULT_START_STATUS, TRACKING_STATUSES } = feature('constants.ts');
  assert.equal(DEFAULT_START_STATUS, 'preparing_documents');
  assert.ok(TRACKING_STATUSES.includes(DEFAULT_START_STATUS));
});

test('api: startTracking PUTs { status } to /api/scholarships/{id}/tracking and reads { status, updated_at }', async () => {
  const { startTracking } = feature('api/tracking.ts');
  const { calls } = fakeBackend();
  const result = await startTracking(42);
  assert.equal(calls[0].method, 'PUT');
  assert.equal(calls[0].url, 'https://backend.test/api/scholarships/42/tracking');
  assert.deepEqual(JSON.parse(calls[0].body), { status: 'preparing_documents' });
  assert.deepEqual(result, { status: 'preparing_documents', updatedAt: '2025-10-26T10:00:00Z' });
});

test('api: startTracking validates the id and status before any request', async () => {
  const { startTracking } = feature('api/tracking.ts');
  const { calls } = fakeBackend();
  await assert.rejects(() => startTracking(0));
  await assert.rejects(() => startTracking(-3));
  await assert.rejects(() => startTracking(1.5));
  await assert.rejects(() => startTracking(1, 'saved'));
  assert.equal(calls.length, 0);
});

test('api: a malformed start response is a contract error', async () => {
  const { startTracking } = feature('api/tracking.ts');
  const { TrackingContractError } = feature('lib/errors.ts');
  fakeBackend({ start: () => json({ ok: true }) });
  await assert.rejects(startTracking(7), TrackingContractError);
  fakeBackend({ start: () => json({ status: 'saved', updated_at: 'x' }) });
  await assert.rejects(startTracking(7), TrackingContractError);
});

test('api: 404, 403 and 422 surface as errors mapped by status, never by the Arabic detail', async () => {
  const { startTracking } = feature('api/tracking.ts');
  const { classifyTrackingError } = feature('lib/errors.ts');
  const cases = [
    [404, { detail: 'المنحة غير موجودة.' }, 'not-found'],
    [403, { detail: 'Forbidden' }, 'forbidden'],
    [422, { detail: [{ loc: ['body', 'status'], msg: 'bad', type: 'enum' }] }, 'invalid'],
    [500, { detail: 'x' }, 'server'],
  ];
  for (const [status, body, kind] of cases) {
    fakeBackend({ start: () => json(body, status) });
    await assert.rejects(
      startTracking(7),
      (error) => classifyTrackingError(error) === kind,
      String(status)
    );
  }
});

// -------------------- state selection ----------------------------------------

test('start state: unknown until the list is loaded, then tracked or untracked', () => {
  const { selectStartState } = feature('lib/start-state.ts');
  assert.deepEqual(selectStartState(undefined, {}, 11), { kind: 'unknown' });
  const list = { items: [modelItem(5, 11, 'accepted')], skipped: 0 };
  assert.deepEqual(selectStartState(list, {}, 11), {
    kind: 'tracked',
    status: 'accepted',
    pending: false,
  });
  assert.deepEqual(selectStartState(list, {}, 99), { kind: 'untracked' });
});

test('start state: a pending start shows as tracked immediately, even before the list loads', () => {
  const { selectStartState, markStarted, unmarkStarted } = feature('lib/start-state.ts');
  const started = markStarted({}, 11, 'preparing_documents');
  assert.deepEqual(selectStartState(undefined, started, 11), {
    kind: 'tracked',
    status: 'preparing_documents',
    pending: true,
  });
  const list = { items: [], skipped: 0 };
  assert.equal(selectStartState(list, started, 11).kind, 'tracked');
  assert.equal(selectStartState(list, started, 12).kind, 'untracked');
  // Rolled back: gone again.
  assert.equal(selectStartState(list, unmarkStarted(started, 11), 11).kind, 'untracked');
});

test('start state: the real row beats the overlay, and marking never mutates its input', () => {
  const { selectStartState, markStarted } = feature('lib/start-state.ts');
  const before = {};
  const after = markStarted(before, 11, 'preparing_documents');
  assert.deepEqual(before, {});
  assert.notEqual(before, after);
  const list = { items: [modelItem(5, 11, 'rejected')], skipped: 0 };
  assert.deepEqual(selectStartState(list, after, 11), {
    kind: 'tracked',
    status: 'rejected',
    pending: false,
  });
});

// -------------------- optimistic start and rollback --------------------------

test('start: the button state flips before the server answers', async () => {
  const { startMutationOptions } = feature('lib/mutations.ts');
  const { selectStartState } = feature('lib/start-state.ts');
  const { client, trackingKeys, started } = setup([]);
  const gate = deferred();
  fakeBackend({ start: () => gate.promise });

  const run = new MutationObserver(client, startMutationOptions(client)).mutate({
    scholarshipId: 11,
  });
  await tick();
  await tick();
  assert.equal(started()[11], 'preparing_documents');
  assert.equal(
    selectStartState(client.getQueryData(trackingKeys.list()), started(), 11).kind,
    'tracked'
  );
  gate.resolve(json({ status: 'preparing_documents', updated_at: '2025-10-26T10:00:00Z' }));
  await run;
});

test('start: a failed request rolls the optimistic state back and rejects (500)', async () => {
  const { startMutationOptions } = feature('lib/mutations.ts');
  const { selectStartState } = feature('lib/start-state.ts');
  const { client, trackingKeys, started } = setup([]);
  fakeBackend({ start: () => json({ detail: 'x' }, 500) });

  await assert.rejects(
    new MutationObserver(client, startMutationOptions(client)).mutate({ scholarshipId: 11 })
  );
  assert.deepEqual(started(), {}, 'overlay is cleared');
  assert.equal(
    selectStartState(client.getQueryData(trackingKeys.list()), started(), 11).kind,
    'untracked'
  );
  assert.deepEqual(client.getQueryData(trackingKeys.list()).items, [], 'list untouched');
});

test('start: 404, 403 and 422 each roll back', async () => {
  const { startMutationOptions } = feature('lib/mutations.ts');
  for (const status of [404, 403, 422]) {
    const { client, started } = setup([]);
    fakeBackend({ start: () => json({ detail: 'المنحة غير موجودة.' }, status) });
    await assert.rejects(
      new MutationObserver(client, startMutationOptions(client)).mutate({ scholarshipId: 11 }),
      String(status)
    );
    assert.deepEqual(started(), {}, String(status));
  }
});

test('start: a failure for one scholarship does not clear another that is still pending', async () => {
  const { startMutationOptions } = feature('lib/mutations.ts');
  const { client, started } = setup([]);
  const slow = deferred();
  globalThis.fetch = async (url, init = {}) => {
    if ((init.method ?? 'GET') === 'GET') return json([]);
    return String(url).includes('/11/') ? slow.promise : json({ detail: 'x' }, 500);
  };
  const first = new MutationObserver(client, startMutationOptions(client)).mutate({
    scholarshipId: 11,
  });
  await tick();
  await tick();
  const second = new MutationObserver(client, startMutationOptions(client)).mutate({
    scholarshipId: 12,
  });
  await assert.rejects(second);
  assert.deepEqual(Object.keys(started()), ['11']);
  slow.resolve(json({ status: 'preparing_documents', updated_at: 'x' }));
  await first;
});

test('start: success refetches the list, then clears the overlay so the real row is shown', async () => {
  const { startMutationOptions } = feature('lib/mutations.ts');
  const { selectStartState } = feature('lib/start-state.ts');
  const { getTrackedList } = feature('api/tracking.ts');
  const { client, trackingKeys, started } = setup([]);
  const tracked = [];
  fakeBackend({
    tracked,
    start: () => {
      tracked.push(wireItem(77, 11, 'preparing_documents'));
      return json({ status: 'preparing_documents', updated_at: '2025-10-26T10:00:00Z' });
    },
  });
  // The list query is active (as it is on a page that shows the button).
  const observer = new QueryObserver(client, {
    queryKey: trackingKeys.list(),
    queryFn: () => getTrackedList(),
  });
  const unsubscribe = observer.subscribe(() => {});

  await new MutationObserver(client, startMutationOptions(client)).mutate({ scholarshipId: 11 });
  const list = client.getQueryData(trackingKeys.list());
  assert.deepEqual(started(), {});
  assert.deepEqual(
    list.items.map((item) => item.id),
    [77]
  );
  assert.deepEqual(selectStartState(list, started(), 11), {
    kind: 'tracked',
    status: 'preparing_documents',
    pending: false,
  });
  unsubscribe();
});

test('start: an already tracked scholarship is never overwritten (no PUT is sent)', async () => {
  const { startMutationOptions } = feature('lib/mutations.ts');
  const { client, started } = setup([]); // this tab thinks it is untracked
  const { calls } = fakeBackend({ tracked: [wireItem(5, 11, 'accepted')] }); // the server says otherwise
  await new MutationObserver(client, startMutationOptions(client)).mutate({ scholarshipId: 11 });
  assert.equal(calls.filter((c) => c.method === 'PUT').length, 0, 'accepted must not be reset');
  assert.deepEqual(started(), {});
});

test('start: a 401 asks the session to be re-checked', async () => {
  const { startMutationOptions } = feature('lib/mutations.ts');
  const { currentUserQueryKey } = loadModule(
    path.join(srcPath, 'features/auth/hooks/useCurrentUser.ts')
  );
  const { client } = setup([]);
  const keys = [];
  const original = client.invalidateQueries.bind(client);
  client.invalidateQueries = (filters) => {
    keys.push(JSON.stringify(filters?.queryKey));
    return original(filters);
  };
  fakeBackend({ start: () => json({ detail: 'x' }, 401) });
  await assert.rejects(
    new MutationObserver(client, startMutationOptions(client)).mutate({ scholarshipId: 11 })
  );
  assert.ok(keys.includes(JSON.stringify(currentUserQueryKey)));
});

// -------------------- button -------------------------------------------------

const { trackingKeys } = feature('query-keys.ts');
async function renderButton({ list, startedMap, listError, locale = 'en', variant = 'card' }) {
  const { TrackScholarshipButton } = feature('components/TrackScholarshipButton.tsx');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (list) client.setQueryData(trackingKeys.list(), list);
  if (startedMap) client.setQueryData(trackingKeys.started(), startedMap);
  if (listError) {
    client.setQueryDefaults(trackingKeys.list(), { retryOnMount: false });
    await client
      .fetchQuery({
        queryKey: trackingKeys.list(),
        queryFn: () => {
          throw listError;
        },
      })
      .catch(() => {});
  }
  env.locale = locale;
  return renderToStaticMarkup(
    h(
      QueryClientProvider,
      { client },
      h(TrackScholarshipButton, { scholarshipId: 11, title: 'Erasmus', variant })
    )
  );
}

test('button: an untracked scholarship offers "Track application" as a real button', async () => {
  const html = await renderButton({ list: { items: [], skipped: 0 } });
  assert.ok(html.includes('<button'));
  assert.ok(html.includes('type="button"'));
  assert.ok(html.includes('Track application'));
  assert.ok(html.includes('aria-label="Track application: Erasmus"'));
});

test('button: a tracked scholarship shows its status and links to the tracking page', async () => {
  const html = await renderButton({ list: { items: [modelItem(5, 11, 'applied')], skipped: 0 } });
  assert.equal(html.includes('<button'), false);
  assert.ok(html.includes('href="/student/tracking"'));
  assert.ok(html.includes('Applied'));
});

test('button: a pending start already shows as tracking and cannot be clicked twice', async () => {
  const html = await renderButton({
    list: { items: [], skipped: 0 },
    startedMap: { 11: 'preparing_documents' },
  });
  assert.equal(html.includes('<button'), false);
  assert.ok(html.includes('Preparing documents'));
});

test('button: nothing is rendered while the tracked state is unknown or the list failed', async () => {
  assert.equal((await renderButton({})).trim(), '');
  const { ApiError } = loadModule(path.join(srcPath, 'lib/api-client.ts'));
  assert.equal((await renderButton({ listError: new ApiError('x', [], 500) })).trim(), '');
});

test('button: Arabic copy and the details variant exist', async () => {
  const ar = await renderButton({ list: { items: [], skipped: 0 }, locale: 'ar' });
  assert.ok(ar.includes(messages.ar.StudentTracking.track.start));
  const details = await renderButton({ list: { items: [], skipped: 0 }, variant: 'details' });
  assert.ok(details.includes('Track application'));
  for (const locale of ['ar', 'en']) {
    const track = messages[locale].StudentTracking.track;
    for (const key of [
      'start',
      'startFor',
      'tracking',
      'trackingFor',
      'failed',
      'notFound',
      'forbidden',
    ]) {
      assert.ok(typeof track[key] === 'string' && track[key], `${locale} track.${key}`);
    }
  }
});

// -------------------- entry points follow the flag ----------------------------

test('entry points: pages pass the server flag and cards render a slot only when given one', () => {
  const read = (rel) => fs.readFileSync(path.join(srcPath, rel), 'utf8');
  for (const rel of [
    'app/[locale]/student/scholarships/page.tsx',
    'app/[locale]/student/scholarships/[id]/page.tsx',
    'app/[locale]/student/saved/page.tsx',
  ]) {
    assert.ok(read(rel).includes('trackingEnabled={featureFlags.trackingEnabled}'), rel);
  }
  const { ScholarshipGridCard } = loadModule(
    path.join(srcPath, 'features/student/scholarship-discovery/components/ScholarshipGridCard.tsx')
  );
  const card = { id: 11, title: 'Erasmus', isSaved: false, noDeadline: false };
  const without = renderToStaticMarkup(h(ScholarshipGridCard, { card, detailsEnabled: false }));
  assert.equal(without.includes('data-testid="track-slot"'), false);
  const withSlot = renderToStaticMarkup(
    h(ScholarshipGridCard, { card, detailsEnabled: false, trackingSlot: h('i', null, 'T') })
  );
  assert.ok(withSlot.includes('data-testid="track-slot"'));
});

test('entry points: the discovery feature only reaches tracking through the page-level flag', () => {
  const root = path.join(srcPath, 'features/student/scholarship-discovery');
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walk(full) : [full];
    });
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes('application-tracking')) continue;
    assert.ok(
      text.includes('trackingEnabled'),
      `${path.relative(srcPath, file)} imports tracking without gating on trackingEnabled`
    );
  }
});
