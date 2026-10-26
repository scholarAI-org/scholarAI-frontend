import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, test } from 'node:test';
import ts from 'typescript';

// Feature 008 phase 4: cache transforms, view states, and optimistic updates with
// rollback, driven through a real QueryClient and MutationObserver (no React).

const loadModule = createRequire(import.meta.url);

loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
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

const feature = (rel) => loadModule(path.join(featurePath, rel));
const { QueryClient, MutationObserver } = loadModule('@tanstack/react-query');
const { currentUserQueryKey } = loadModule(
  path.join(srcPath, 'features/auth/hooks/useCurrentUser.ts')
);

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

// Fakes live here only: runtime code never imports from tests/.
const makeItem = (id, status = 'preparing_documents', notes = null) => ({
  id,
  status,
  notes,
  statusChangedAt: '2025-10-02T09:15:00',
  createdAt: '2025-09-30T08:00:00',
  updatedAt: '2025-10-02T09:15:00',
  officialUrl: null,
  scholarship: { id: 100 + id, title: `Scholarship ${id}`, is_saved: false },
});
const makeList = (...items) => ({ items, skipped: 0 });
const ids = (list) => list.items.map((item) => item.id);

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const statusBody = (id, status) => ({
  id,
  status,
  status_changed_at: '2025-10-03T10:00:00',
  updated_at: '2025-10-03T10:00:00',
});

function setup(list) {
  const { trackingKeys } = feature('query-keys.ts');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(trackingKeys.list(), list);
  const read = () => client.getQueryData(trackingKeys.list());
  return { client, read };
}

// -------------------- cache transforms ---------------------------------------

test('cache: status and note changes touch only their row and keep timestamps', () => {
  const { setItemStatus, setItemNotes } = feature('lib/cache.ts');
  const list = makeList(makeItem(1), makeItem(2));
  const next = setItemStatus(list, 2, 'applied');
  assert.equal(next.items[1].status, 'applied');
  assert.equal(next.items[0].status, 'preparing_documents');
  assert.equal(next.items[1].updatedAt, list.items[1].updatedAt);
  assert.equal(list.items[1].status, 'preparing_documents', 'input is not mutated');
  assert.equal(setItemNotes(list, 1, 'hi').items[0].notes, 'hi');
});

test('cache: removeItem returns the exact index and restoreItem puts the row back there', () => {
  const { removeItem, restoreItem } = feature('lib/cache.ts');
  const list = makeList(makeItem(1), makeItem(2), makeItem(3), makeItem(4));
  const { list: without, removed } = removeItem(list, 3);
  assert.deepEqual(ids(without), [1, 2, 4]);
  assert.equal(removed.index, 2);
  assert.deepEqual(ids(restoreItem(without, removed)), [1, 2, 3, 4]);
  assert.deepEqual(ids(restoreItem(restoreItem(without, removed), removed)), [1, 2, 3, 4]);
});

test('cache: restoreItem clamps when the list shrank, and removing a missing row is a no-op', () => {
  const { removeItem, restoreItem } = feature('lib/cache.ts');
  const list = makeList(makeItem(1), makeItem(2), makeItem(3));
  const { removed } = removeItem(list, 3);
  assert.deepEqual(ids(restoreItem(makeList(makeItem(1)), removed)), [1, 3]);
  const none = removeItem(list, 99);
  assert.equal(none.removed, null);
  assert.equal(none.list, list);
});

test('cache: rollback only undoes a value that is still the one this action applied', () => {
  const { rollbackStatus, rollbackNotes, setItemStatus, setItemNotes } = feature('lib/cache.ts');
  const list = makeList(makeItem(1, 'applied', 'new'));
  assert.equal(rollbackStatus(list, 1, 'applied', 'closed').items[0].status, 'closed');
  // A later change to the row is kept.
  const changedLater = setItemStatus(list, 1, 'accepted');
  assert.equal(rollbackStatus(changedLater, 1, 'applied', 'closed').items[0].status, 'accepted');
  assert.equal(rollbackNotes(list, 1, 'new', 'old').items[0].notes, 'old');
  const noteLater = setItemNotes(list, 1, 'newer');
  assert.equal(rollbackNotes(noteLater, 1, 'new', 'old').items[0].notes, 'newer');
});

test('cache: a blank note is stored as no note', () => {
  const { normalizeNotes } = feature('lib/cache.ts');
  assert.equal(normalizeNotes('   \n'), null);
  assert.equal(normalizeNotes(''), null);
  assert.equal(normalizeNotes(' keep '), ' keep ');
});

// -------------------- view states --------------------------------------------

test('view: cached data wins over a failed refetch, and loading is never ready', () => {
  const { getSectionState, getListView } = feature('lib/view-state.ts');
  assert.equal(getSectionState({ data: undefined, isError: false }), 'loading');
  assert.equal(getSectionState({ data: undefined, isError: true }), 'error');
  assert.equal(getSectionState({ data: makeList(), isError: true }), 'ready');
  assert.equal(getListView('loading', undefined), 'loading');
  assert.equal(getListView('error', undefined), 'error');
});

test('view: empty only for a confirmed empty list; all-unreadable rows are an error', () => {
  const { getListView } = feature('lib/view-state.ts');
  assert.equal(getListView('ready', makeList()), 'empty');
  assert.equal(getListView('ready', makeList(makeItem(1))), 'list');
  assert.equal(getListView('ready', { items: [], skipped: 3 }), 'error');
  assert.equal(getListView('ready', { items: [makeItem(1)], skipped: 3 }), 'list');
});

// -------------------- optimistic status --------------------------------------

test('status: the cache changes before the server answers and counts follow it', async () => {
  const { statusMutationOptions } = feature('lib/mutations.ts');
  const { countByStatus } = feature('lib/counts.ts');
  const { client, read } = setup(makeList(makeItem(1), makeItem(2)));
  const pending = deferred();
  globalThis.fetch = () => pending.promise;

  const run = new MutationObserver(client, statusMutationOptions(client)).mutate({
    trackingId: 2,
    status: 'applied',
  });
  await tick();
  assert.equal(read().items[1].status, 'applied');
  assert.equal(countByStatus(read().items).applied, 1);
  assert.equal(countByStatus(read().items).preparing_documents, 1);

  pending.resolve(json(statusBody(2, 'applied')));
  await run;
  assert.equal(read().items[1].status, 'applied');
});

test('status: a failed request rolls the row back and rejects', async () => {
  const { statusMutationOptions } = feature('lib/mutations.ts');
  const { client, read } = setup(makeList(makeItem(1, 'ready_to_apply')));
  globalThis.fetch = async () => json({ detail: 'خطأ' }, 500);

  await assert.rejects(
    new MutationObserver(client, statusMutationOptions(client)).mutate({
      trackingId: 1,
      status: 'rejected',
    })
  );
  assert.equal(read().items[0].status, 'ready_to_apply');
});

test('status: rollback keeps a later successful change to the same row', async () => {
  const { statusMutationOptions } = feature('lib/mutations.ts');
  const { client, read } = setup(makeList(makeItem(1, 'preparing_documents')));
  const first = deferred();
  const calls = [];
  globalThis.fetch = (url, init) => {
    calls.push(JSON.parse(init.body).status);
    return calls.length === 1 ? first.promise : Promise.resolve(json(statusBody(1, 'accepted')));
  };

  const slow = new MutationObserver(client, statusMutationOptions(client)).mutate({
    trackingId: 1,
    status: 'applied',
  });
  await tick();
  const fast = new MutationObserver(client, statusMutationOptions(client)).mutate({
    trackingId: 1,
    status: 'accepted',
  });
  await fast;
  assert.equal(read().items[0].status, 'accepted');

  first.resolve(json({ detail: 'x' }, 500));
  await assert.rejects(slow);
  assert.equal(read().items[0].status, 'accepted', 'the later change is not overwritten');
});

test('status: 404 means the row is gone, so it is dropped instead of restored', async () => {
  const { statusMutationOptions } = feature('lib/mutations.ts');
  const { client, read } = setup(makeList(makeItem(1), makeItem(2)));
  globalThis.fetch = async () => json({ detail: 'غير موجود' }, 404);

  await assert.rejects(
    new MutationObserver(client, statusMutationOptions(client)).mutate({
      trackingId: 1,
      status: 'closed',
    })
  );
  assert.deepEqual(ids(read()), [2]);
});

test('status: a 401 asks the session to be re-checked', async () => {
  const { statusMutationOptions } = feature('lib/mutations.ts');
  const { client } = setup(makeList(makeItem(1)));
  const invalidated = [];
  const original = client.invalidateQueries.bind(client);
  client.invalidateQueries = (filters) => {
    invalidated.push(JSON.stringify(filters?.queryKey));
    return original(filters);
  };
  globalThis.fetch = async () => json({ detail: 'x' }, 401);
  await assert.rejects(
    new MutationObserver(client, statusMutationOptions(client)).mutate({
      trackingId: 1,
      status: 'closed',
    })
  );
  assert.ok(invalidated.includes(JSON.stringify(currentUserQueryKey)));
});

// -------------------- optimistic note ----------------------------------------

test('note: saved optimistically, a blank note clears it, a failure restores the old text', async () => {
  const { noteMutationOptions } = feature('lib/mutations.ts');
  const { client, read } = setup(makeList(makeItem(1, 'applied', 'old note')));
  const response = (notes) => ({
    id: 1,
    notes,
    user_id: 1,
    scholarship_id: 101,
    created_at: 'a',
    updated_at: '2025-10-03T10:00:00',
  });

  globalThis.fetch = async () => json(response('fresh'));
  await new MutationObserver(client, noteMutationOptions(client)).mutate({
    trackingId: 1,
    notes: 'fresh',
  });
  assert.equal(read().items[0].notes, 'fresh');

  globalThis.fetch = async () => json(response(null));
  await new MutationObserver(client, noteMutationOptions(client)).mutate({
    trackingId: 1,
    notes: '   ',
  });
  assert.equal(read().items[0].notes, null);

  globalThis.fetch = async () => json({ detail: 'x' }, 500);
  await assert.rejects(
    new MutationObserver(client, noteMutationOptions(client)).mutate({
      trackingId: 1,
      notes: 'will fail',
    })
  );
  assert.equal(read().items[0].notes, null, 'back to what it was before the failed save');
});

// -------------------- optimistic remove --------------------------------------

test('remove: the row disappears at once and a failure puts it back in the same position', async () => {
  const { removeMutationOptions } = feature('lib/mutations.ts');
  const { client, read } = setup(makeList(makeItem(1), makeItem(2), makeItem(3)));
  const pending = deferred();
  globalThis.fetch = () => pending.promise;

  const run = new MutationObserver(client, removeMutationOptions(client)).mutate({ trackingId: 2 });
  const outcome = run.then(
    () => 'ok',
    () => 'failed'
  );
  await tick();
  assert.deepEqual(ids(read()), [1, 3]);

  pending.resolve(json({ detail: 'x' }, 500));
  assert.equal(await outcome, 'failed');
  assert.deepEqual(ids(read()), [1, 2, 3]);
});

test('remove: success keeps the row removed', async () => {
  const { removeMutationOptions } = feature('lib/mutations.ts');
  const { client, read } = setup(makeList(makeItem(1), makeItem(2)));
  globalThis.fetch = async () => json({ scholarship_id: 101, is_tracked: false, is_saved: true });
  await new MutationObserver(client, removeMutationOptions(client)).mutate({ trackingId: 1 });
  assert.deepEqual(ids(read()), [2]);
});

test('remove: 404 counts as done (it was already gone) and does not reject', async () => {
  const { removeMutationOptions } = feature('lib/mutations.ts');
  const { client, read } = setup(makeList(makeItem(1), makeItem(2)));
  globalThis.fetch = async () => json({ detail: 'غير موجود' }, 404);
  await new MutationObserver(client, removeMutationOptions(client)).mutate({ trackingId: 1 });
  assert.deepEqual(ids(read()), [2]);
});

test('remove: the saved list is never touched (bookmark preserved)', async () => {
  const { removeMutationOptions } = feature('lib/mutations.ts');
  const { client } = setup(makeList(makeItem(1)));
  const savedKey = ['student-scholarships', 'saved', 'list'];
  client.setQueryData(savedKey, [{ id: 101, title: 'x', is_saved: true }]);
  globalThis.fetch = async () => json({ scholarship_id: 101, is_tracked: false, is_saved: true });
  await new MutationObserver(client, removeMutationOptions(client)).mutate({ trackingId: 1 });
  assert.equal(client.getQueryData(savedKey).length, 1);
});

// -------------------- settle -------------------------------------------------

test('settle: the list is refetched once, after the last pending action finishes', async () => {
  const { statusMutationOptions } = feature('lib/mutations.ts');
  const { trackingKeys } = feature('query-keys.ts');
  const { client } = setup(makeList(makeItem(1), makeItem(2)));
  let invalidations = 0;
  const original = client.invalidateQueries.bind(client);
  client.invalidateQueries = (filters) => {
    if (JSON.stringify(filters?.queryKey) === JSON.stringify(trackingKeys.list()))
      invalidations += 1;
    return original(filters);
  };
  const a = deferred();
  const b = deferred();
  const queue = [a, b];
  globalThis.fetch = () => queue.shift().promise;

  const first = new MutationObserver(client, statusMutationOptions(client)).mutate({
    trackingId: 1,
    status: 'applied',
  });
  await tick();
  const second = new MutationObserver(client, statusMutationOptions(client)).mutate({
    trackingId: 2,
    status: 'closed',
  });
  await tick();

  a.resolve(json(statusBody(1, 'applied')));
  await first;
  assert.equal(invalidations, 0, 'not while another action is still pending');
  b.resolve(json(statusBody(2, 'closed')));
  await second;
  assert.equal(invalidations, 1);
});
