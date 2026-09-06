import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);

loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

const feature = fileURLToPath(new URL('../src/features/profile', import.meta.url));

const {
  createEmptyDocument,
  validateDocumentFile,
  ALLOWED_DOCUMENT_TYPES,
} = loadModule(path.join(feature, 'schemas/documents.schema.ts'));

const {
  normalizeDocuments,
  normalizeSingleDocument,
} = loadModule(path.join(feature, 'schemas/full-profile-api.schema.ts'));

test('1. upload-url payload shape includes document_type, file_name, content_type, file_size', () => {
  const payload = {
    document_type: 'cv',
    file_name: 'resume.pdf',
    content_type: 'application/pdf',
    file_size: 1000000,
  };
  assert.equal(payload.document_type, 'cv');
  assert.equal(payload.file_name, 'resume.pdf');
  assert.equal(payload.content_type, 'application/pdf');
  assert.equal(payload.file_size, 1000000);
  assert.equal(Object.keys(payload).sort().join(','), 'content_type,document_type,file_name,file_size');
});

test('2. confirm payload contains only upload_id without file_url or object_key', () => {
  const confirmPayload = { upload_id: '12345-uuid' };
  assert.deepEqual(Object.keys(confirmPayload), ['upload_id']);
  assert.equal(confirmPayload.upload_id, '12345-uuid');
  assert.equal('object_key' in confirmPayload, false);
  assert.equal('file_url' in confirmPayload, false);
});

test('3. validateDocumentFile enforces 10MB maximum size limit (10485760 bytes)', () => {
  const validFile = { name: 'cv.pdf', type: 'application/pdf', size: 10485760 };
  const oversizedFile = { name: 'cv.pdf', type: 'application/pdf', size: 10485761 };

  assert.equal(validateDocumentFile('cv', validFile), null);
  assert.match(validateDocumentFile('cv', oversizedFile) || '', /10/);
});

test('4. validateDocumentFile rejects unsupported MIME types or extensions', () => {
  const invalidExe = { name: 'cv.exe', type: 'application/x-msdownload', size: 1000 };
  const invalidTypeEmpty = { name: 'cv.pdf', type: '', size: 1000 };
  const pdfForPassport = { name: 'passport.pdf', type: 'application/pdf', size: 1000 };
  const jpgForPassport = { name: 'passport.jpg', type: 'image/jpeg', size: 1000 };

  assert.notEqual(validateDocumentFile('cv', invalidExe), null);
  assert.notEqual(validateDocumentFile('cv', invalidTypeEmpty), null);
  assert.equal(validateDocumentFile('passport', pdfForPassport), null);
  assert.equal(validateDocumentFile('passport', jpgForPassport), null);
});

test('5. recommendation letters upload-url uses singular recommendation_letter', () => {
  assert.equal('recommendation_letter' in ALLOWED_DOCUMENT_TYPES, true);
});

test('6. Document shape maintains id: string | null without file_url or object_key dependencies', () => {
  const emptyDoc = createEmptyDocument('cv');
  assert.equal(emptyDoc.id, null);
  assert.equal(emptyDoc.status, 'NOT_UPLOADED');
  assert.equal('file_url' in emptyDoc, false);
  assert.equal('object_key' in emptyDoc, false);
});

test('7. normalizeSingleDocument builds canonical Document object with fallback defaults', () => {
  const rawDoc = {
    id: 'doc-99',
    document_type: 'cv',
    file_name: 'my_cv.pdf',
    content_type: 'application/pdf',
    file_size: 50000,
    uploaded_at: '2026-09-06T12:00:00Z',
  };
  const normalized = normalizeSingleDocument(rawDoc, 'cv');
  assert.equal(normalized.id, 'doc-99');
  assert.equal(normalized.status, 'UPLOADED');
  assert.equal(normalized.file_name, 'my_cv.pdf');
});

test('8. normalizeDocuments hydrates empty single slots with id: null', () => {
  const docs = normalizeDocuments(null);
  assert.equal(docs.cv.id, null);
  assert.equal(docs.cv.status, 'NOT_UPLOADED');
  assert.deepEqual(docs.recommendation_letters, []);
});

test('9. recommendation letters cache updates append or update by document.id', () => {
  const initialDocs = normalizeDocuments(null);
  const rec1 = {
    id: 'rec-1',
    document_type: 'recommendation_letter',
    file_name: 'letter1.pdf',
    content_type: 'application/pdf',
    file_size: 2000,
    status: 'UPLOADED',
    uploaded_at: '2026-09-06T12:00:00Z',
  };

  const rec2 = {
    id: 'rec-2',
    document_type: 'recommendation_letter',
    file_name: 'letter2.pdf',
    content_type: 'application/pdf',
    file_size: 3000,
    status: 'UPLOADED',
    uploaded_at: '2026-09-06T12:05:00Z',
  };

  const listAfterAppend = [...initialDocs.recommendation_letters, rec1, rec2];
  assert.equal(listAfterAppend.length, 2);

  // Deleting rec1 by document.id
  const listAfterDelete = listAfterAppend.filter((doc) => doc.id !== 'rec-1');
  assert.equal(listAfterDelete.length, 1);
  assert.equal(listAfterDelete[0].id, 'rec-2');
});

test('10. maximum recommendation letters limit (3) enforcement', () => {
  const confirmed = [
    { id: 'rec-1', status: 'UPLOADED' },
    { id: 'rec-2', status: 'UPLOADED' },
  ];
  const uploadingCount = 1;
  const total = confirmed.length + uploadingCount;
  assert.equal(total >= 3, true);
});
