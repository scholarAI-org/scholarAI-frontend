import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadSrc } from './helpers/load-src.mjs';

const { getDetailsViewState, parseRouteId } = loadSrc(
  'features/student/scholarship-details/lib/view-state.ts'
);
const { ApiError } = loadSrc('lib/api-client.ts');
const { DetailsContractError } = loadSrc('features/student/scholarship-details/lib/adapter.ts');

const data = { id: 7, title: 'T', is_saved: false };
const base = { id: 7, data: undefined, error: null, isFetching: false };

test('route ids must be canonical positive integers', () => {
  assert.equal(parseRouteId('7'), 7);
  assert.equal(parseRouteId('564'), 564);
  for (const bad of ['07', '7.0', '-7', '0', 'abc', '', '1e3', ' 7', '9007199254740993', 7, null]) {
    assert.equal(parseRouteId(bad), null, String(bad));
  }
});

test('an invalid id and a 404 are the same not-found state', () => {
  assert.deepEqual(getDetailsViewState({ ...base, id: null }), { kind: 'notFound' });
  assert.deepEqual(getDetailsViewState({ ...base, error: new ApiError('x', [], 404) }), {
    kind: 'notFound',
  });
});

test('loading until there is data or a final error', () => {
  assert.deepEqual(getDetailsViewState({ ...base, isFetching: true }), { kind: 'loading' });
  assert.deepEqual(getDetailsViewState(base), { kind: 'loading' });
});

test('data for this id is ready, including while a refetch runs', () => {
  assert.deepEqual(getDetailsViewState({ ...base, data }), { kind: 'ready', data });
  assert.equal(getDetailsViewState({ ...base, data, isFetching: true }).kind, 'ready');
});

test('a failed background refetch keeps the cached details on screen', () => {
  for (const status of [500, 502]) {
    assert.equal(
      getDetailsViewState({ ...base, data, error: new ApiError('x', [], status) }).kind,
      'ready'
    );
  }
  assert.equal(
    getDetailsViewState({ ...base, data, error: new TypeError('network') }).kind,
    'ready'
  );
});

test('404, 401 and 403 replace cached details once the refetch settles', () => {
  assert.deepEqual(getDetailsViewState({ ...base, data, error: new ApiError('x', [], 404) }), {
    kind: 'notFound',
  });
  assert.deepEqual(getDetailsViewState({ ...base, data, error: new ApiError('x', [], 401) }), {
    kind: 'error',
    reason: 'unauthorized',
  });
  assert.deepEqual(getDetailsViewState({ ...base, data, error: new ApiError('x', [], 403) }), {
    kind: 'error',
    reason: 'forbidden',
  });
});

test('error reasons by status; anything else is generic', () => {
  const reason = (error) => getDetailsViewState({ ...base, error }).reason;
  assert.equal(reason(new ApiError('x', [], 401)), 'unauthorized');
  assert.equal(reason(new ApiError('x', [], 403)), 'forbidden');
  assert.equal(reason(new ApiError('x', [], 422)), 'generic');
  assert.equal(reason(new ApiError('x', [], 500)), 'generic');
  assert.equal(reason(new TypeError('network')), 'generic');
  assert.equal(reason(new DetailsContractError('invalid-id')), 'generic');
});

test('a retry after an error shows loading again', () => {
  assert.deepEqual(
    getDetailsViewState({ ...base, error: new ApiError('x', [], 500), isFetching: true }),
    { kind: 'loading' }
  );
});

test('data for another id is never shown', () => {
  assert.deepEqual(getDetailsViewState({ ...base, data: { ...data, id: 8 } }), {
    kind: 'error',
    reason: 'generic',
  });
});
