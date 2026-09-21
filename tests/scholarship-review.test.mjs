import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

const root = fileURLToPath(new URL('..', import.meta.url));
const feature = path.join(root, 'src/features/admin/scholarship-review');
const formatters = require(path.join(feature, 'lib/formatters.ts'));
const presentation = require(path.join(feature, 'lib/presentation.ts'));
const edit = require(path.join(feature, 'lib/edit.ts'));
const apiSource = fs.readFileSync(path.join(feature, 'api/scholarship-review.ts'), 'utf8');
const detailSource = fs.readFileSync(
  path.join(feature, 'components/ScholarshipReviewDetailPage.tsx'),
  'utf8'
);
const listingSource = fs.readFileSync(
  path.join(feature, 'components/ScholarshipReviewPage.tsx'),
  'utf8'
);
const enMessages = fs.readFileSync(path.join(root, 'src/messages/en.json'), 'utf8');
const arMessages = fs.readFileSync(path.join(root, 'src/messages/ar.json'), 'utf8');

test('uses the real detail ID and contract paths', () => {
  assert.match(apiSource, /\/admin\/scholarships\/\$\{id\}\/review-details/);
  assert.match(apiSource, /\/admin\/scholarships\/\$\{id\}\/approve/);
  assert.match(apiSource, /\/admin\/scholarships\/\$\{id\}\/reject/);
  assert.match(apiSource, /JSON\.stringify\(\{ reason \}\)/);
  assert.match(apiSource, /\/admin\/scholarships\/\$\{id\}`/);
  assert.match(apiSource, /method: 'PATCH'/);
});

test('builds a pending-only PATCH without clearing omitted or workflow fields', () => {
  const initial = edit.toScholarshipEditValues({ id: 42, title: 'Old title', status: 'pending', apply_link: 'https://apply.example', source_url: 'https://source.example', required_documents: [' Passport '], eligibility_criteria: null });
  const payload = edit.toChangedScholarshipUpdate({ ...initial, title: 'New title', required_documents: 'Passport\n\n Transcript ' }, initial);
  assert.deepEqual(payload, { title: 'New title', required_documents: ['Passport', 'Transcript'] });
  assert.equal('status' in payload, false);
  assert.equal('source_url' in payload, false);
});

test('normalizes edit URLs and preserves no-deadline semantics', () => {
  assert.equal(edit.isHttpUrl('https://example.com/path'), true);
  assert.equal(edit.isHttpUrl('javascript:alert(1)'), false);
  const initial = { title: 'A title', organization_name: '', country: '', deadline: '2027-01-01', no_deadline: false, apply_link: '', image_url: '', required_documents: '', eligibility_criteria: '', description_html: '' };
  assert.deepEqual(edit.toChangedScholarshipUpdate({ ...initial, no_deadline: true }, initial), { no_deadline: true, deadline: null });
});

test('allows only safe HTTP(S) source and application URLs', () => {
  assert.equal(
    formatters.getSafeExternalUrl('https://source.example/path'),
    'https://source.example/path'
  );
  assert.equal(
    formatters.getSafeExternalUrl('http://apply.example/path'),
    'http://apply.example/path'
  );
  assert.equal(formatters.getSafeExternalUrl('javascript:alert(1)'), null);
  assert.equal(formatters.getSafeExternalUrl('not-a-url'), null);
  assert.equal(formatters.getSourceDomain('https://source.example/path'), 'source.example');
});

test('normalizes nullable arrays and preserves available funding values without invented prose', () => {
  assert.deepEqual(presentation.toDetailValues(null), []);
  assert.deepEqual(presentation.toDetailValues(undefined), []);
  assert.deepEqual(presentation.toDetailValues([' Major ', ' ', 'Science']), [
    ' Major ',
    'Science',
  ]);
  assert.deepEqual(presentation.toDetailValues('  Engineering  '), ['Engineering']);
  assert.deepEqual(presentation.getFundingValues(null, ' 800 EUR '), ['800 EUR']);
  assert.deepEqual(presentation.getFundingValues('Full funding', null), ['Full funding']);
  assert.deepEqual(presentation.getFundingValues('Full funding', '800 EUR'), [
    'Full funding',
    '800 EUR',
  ]);
});

test('validates rejection reasons against the backend trimmed three-character minimum', () => {
  assert.equal(presentation.isValidRejectionReason('   '), false);
  assert.equal(presentation.isValidRejectionReason('a'), false);
  assert.equal(presentation.isValidRejectionReason('ab'), false);
  assert.equal(presentation.isValidRejectionReason(' abc '), true);
});

test('detail remains plain text and status-gates review actions', () => {
  assert.doesNotMatch(detailSource, /dangerouslySetInnerHTML/);
  assert.match(detailSource, /detail\.status === 'pending'/);
  assert.match(detailSource, /aria-invalid=/);
  assert.match(detailSource, /rejection-reason-error/);
  assert.match(detailSource, /role="dialog"/);
  assert.match(detailSource, /aria-modal="true"/);
  assert.match(detailSource, /initialFocusRef=\{approveCancelRef\}/);
  assert.match(detailSource, /reason: reason\.trim\(\)/);
});

test('dialog copy is localized and makes no unsupported re-review promise', () => {
  for (const messages of [enMessages, arMessages]) {
    assert.match(messages, /"approveTitle"/);
    assert.match(messages, /"rejectDescription"/);
    assert.match(messages, /"rejectionPlaceholder"/);
    assert.match(messages, /"rejectionReason"/);
  }
  assert.doesNotMatch(detailSource, /إعادة مراجعتها لاحقاً/);
  assert.doesNotMatch(enMessages, /re-review/i);
});

test('desktop and mobile review links use the backend item ID and notices are cleaned', () => {
  assert.equal(
    (listingSource.match(/\/admin\/scholarships\/review\/\$\{item\.id\}/g) ?? []).length,
    2
  );
  assert.match(listingSource, /nextParams\.delete\('notice'\)/);
  assert.match(listingSource, /new URLSearchParams\(search\)/);
  assert.match(listingSource, /role="status"/);
});
