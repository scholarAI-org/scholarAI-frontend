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
const apiSource = fs.readFileSync(path.join(feature, 'api/scholarship-review.ts'), 'utf8');
const detailSource = fs.readFileSync(
  path.join(feature, 'components/ScholarshipReviewDetailPage.tsx'),
  'utf8'
);
const listingSource = fs.readFileSync(
  path.join(feature, 'components/ScholarshipReviewPage.tsx'),
  'utf8'
);

test('uses the real detail ID and contract paths', () => {
  assert.match(apiSource, /\/admin\/scholarships\/\$\{id\}\/review-details/);
  assert.match(apiSource, /\/admin\/scholarships\/\$\{id\}\/approve/);
  assert.match(apiSource, /\/admin\/scholarships\/\$\{id\}\/reject/);
  assert.match(apiSource, /JSON\.stringify\(\{ reason \}\)/);
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
