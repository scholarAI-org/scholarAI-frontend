import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { loadSrc } from './helpers/load-src.mjs';

const { REPORT_TYPES, DESCRIPTION_MAX_LENGTH, buildReportRequest, classifyReportError } = loadSrc(
  'features/student/scholarship-details/lib/report.ts'
);
const { reportScholarship } = loadSrc('features/student/scholarship-details/api/report.ts');
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

test('the report types are exactly the live ScholarshipReportType values', () => {
  assert.deepEqual(
    [...REPORT_TYPES].sort(),
    ['broken_link', 'duplicate', 'expired', 'incorrect_information', 'other', 'suspicious'].sort()
  );
  assert.equal(DESCRIPTION_MAX_LENGTH, 2000);
});

test('a type alone is a valid request; the blank description is left out', () => {
  assert.deepEqual(buildReportRequest({ reportType: 'broken_link', description: '' }), {
    ok: true,
    body: { report_type: 'broken_link' },
  });
  assert.deepEqual(buildReportRequest({ reportType: 'expired', description: '  \n\t ' }), {
    ok: true,
    body: { report_type: 'expired' },
  });
});

test('the description is trimmed before it is sent', () => {
  assert.deepEqual(buildReportRequest({ reportType: 'other', description: '  The link 404s.  ' }), {
    ok: true,
    body: { report_type: 'other', description: 'The link 404s.' },
  });
});

test('a missing or unknown type is rejected', () => {
  for (const reportType of [undefined, null, '', 'spam', 'EXPIRED', 5]) {
    assert.deepEqual(buildReportRequest({ reportType, description: '' }), {
      ok: false,
      errors: { reportType: 'required' },
    });
  }
});

test('2000 characters are allowed and 2001 are not, counted as code points', () => {
  const ok = (description) => buildReportRequest({ reportType: 'other', description }).ok;
  assert.equal(ok('a'.repeat(2000)), true);
  assert.equal(ok('a'.repeat(2001)), false);
  // The backend counts characters, so an emoji is one, not two.
  assert.equal(ok('😀'.repeat(2000)), true);
  assert.equal(ok('😀'.repeat(2001)), false);
  // The limit applies to the input, before trimming.
  assert.equal(ok(' '.repeat(2001)), false);
  assert.deepEqual(buildReportRequest({ reportType: 'other', description: 'a'.repeat(2001) }), {
    ok: false,
    errors: { description: 'tooLong' },
  });
});

test('both errors are reported together', () => {
  assert.deepEqual(buildReportRequest({ reportType: undefined, description: 'a'.repeat(2001) }), {
    ok: false,
    errors: { reportType: 'required', description: 'tooLong' },
  });
});

test('POST sends the body to /api/scholarships/{id}/reports', async () => {
  const calls = stubFetch(201, {
    id: 9,
    scholarship_id: 564,
    reporter_user_id: 3,
    report_type: 'broken_link',
    description: null,
    status: 'pending',
    created_at: '2026-10-28T09:00:00Z',
    message: 'ok',
  });
  const result = await reportScholarship(564, { report_type: 'broken_link' });
  assert.ok(calls[0].url.endsWith('/api/scholarships/564/reports'));
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.body, JSON.stringify({ report_type: 'broken_link' }));
  assert.deepEqual(result, { id: 9 });
});

test('a created report is a success even if the body is unreadable', async () => {
  stubFetch(201, { unexpected: true });
  assert.deepEqual(await reportScholarship(1, { report_type: 'other' }), {});
});

test('a bad id is rejected before any request', async () => {
  const calls = stubFetch(201, {});
  for (const id of [0, -3, 1.5, NaN]) {
    await assert.rejects(() => reportScholarship(id, { report_type: 'other' }));
  }
  assert.equal(calls.length, 0);
});

test('errors are classified by HTTP status only, never by backend prose', () => {
  const kind = (status) => classifyReportError(new ApiError('رسالة عربية', [], status));
  assert.equal(kind(401), 'unauthorized');
  assert.equal(kind(403), 'forbidden');
  assert.equal(kind(404), 'notFound');
  assert.equal(kind(409), 'duplicate');
  assert.equal(kind(422), 'invalid');
  assert.equal(kind(429), 'rateLimited');
  assert.equal(kind(500), 'generic');
  assert.equal(kind(503), 'generic');
  assert.equal(classifyReportError(new TypeError('Failed to fetch')), 'generic');
  assert.equal(classifyReportError(undefined), 'generic');
});

test('a 409, 404 and 429 from the server reach the caller with their status', async () => {
  for (const status of [404, 409, 429]) {
    stubFetch(status, { detail: 'x' });
    await assert.rejects(
      () => reportScholarship(5, { report_type: 'duplicate' }),
      (error) => error instanceof ApiError && error.status === status
    );
  }
});
