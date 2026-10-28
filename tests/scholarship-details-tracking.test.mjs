import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { loadSrc } from './helpers/load-src.mjs';

const { getScholarshipTracking, putScholarshipTracking } = loadSrc(
  'features/student/scholarship-details/api/tracking.ts'
);
const { parseScholarshipTracking } = loadSrc(
  'features/student/scholarship-details/lib/tracking-adapter.ts'
);
const { TrackingContractError, TrackingValidationError } = loadSrc(
  'features/student/application-tracking/lib/errors.ts'
);
const { ApiError } = loadSrc('lib/api-client.ts');

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function stubFetch(status, body) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  return calls;
}

test('an untracked scholarship has a null status', () => {
  assert.deepEqual(parseScholarshipTracking({ status: null, updated_at: null }), {
    status: null,
  });
});

test('every backend status is accepted, with its update time', () => {
  for (const status of [
    'preparing_documents',
    'ready_to_apply',
    'applied',
    'accepted',
    'rejected',
    'closed',
  ]) {
    assert.deepEqual(parseScholarshipTracking({ status, updated_at: '2026-10-01T09:00:00Z' }), {
      status,
      updatedAt: '2026-10-01T09:00:00Z',
    });
  }
});

test('an unreadable updated_at is dropped, not an error', () => {
  assert.deepEqual(parseScholarshipTracking({ status: 'applied', updated_at: 5 }), {
    status: 'applied',
  });
});

test('an unknown status is a contract error, never read as untracked', () => {
  for (const raw of [
    { status: 'saved', updated_at: null },
    { status: 7 },
    { updated_at: null },
    null,
    'applied',
    [],
  ]) {
    assert.throws(
      () => parseScholarshipTracking(raw),
      (error) => error instanceof TrackingContractError,
      JSON.stringify(raw)
    );
  }
});

test('GET reads /api/scholarships/{id}/tracking', async () => {
  const calls = stubFetch(200, { status: 'applied', updated_at: '2026-10-01T09:00:00Z' });
  const result = await getScholarshipTracking(564);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith('/api/scholarships/564/tracking'));
  assert.equal(calls[0].init.method ?? 'GET', 'GET');
  assert.equal(result.status, 'applied');
});

test('PUT sends only the status and returns the parsed response', async () => {
  const calls = stubFetch(200, {
    status: 'preparing_documents',
    updated_at: '2026-10-28T08:00:00Z',
  });
  const result = await putScholarshipTracking(564, 'preparing_documents');
  assert.ok(calls[0].url.endsWith('/api/scholarships/564/tracking'));
  assert.equal(calls[0].init.method, 'PUT');
  assert.equal(calls[0].init.body, JSON.stringify({ status: 'preparing_documents' }));
  assert.deepEqual(result, { status: 'preparing_documents', updatedAt: '2026-10-28T08:00:00Z' });
});

test('PUT rejects a bad id or status before any request', async () => {
  const calls = stubFetch(200, {});
  for (const [id, status] of [
    [0, 'applied'],
    [-1, 'applied'],
    [1.5, 'applied'],
    [2147483648, 'applied'],
    [5, 'saved'],
    [5, 'APPLIED'],
    [5, undefined],
  ]) {
    await assert.rejects(
      () => putScholarshipTracking(id, status),
      (error) => error instanceof TrackingValidationError,
      `${id} ${status}`
    );
  }
  assert.equal(calls.length, 0);
});

test('a malformed 200 response is a contract error', async () => {
  stubFetch(200, { status: 'mystery' });
  await assert.rejects(
    () => getScholarshipTracking(1),
    (error) => error instanceof TrackingContractError
  );
});

test('HTTP errors keep their status for the caller', async () => {
  for (const status of [401, 403, 404, 422, 500]) {
    stubFetch(status, { detail: 'x' });
    await assert.rejects(
      () => putScholarshipTracking(1, 'applied'),
      (error) => error instanceof ApiError && error.status === status
    );
  }
});
