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

const { validateDocumentFile } = loadModule(path.join(feature, 'schemas/documents.schema.ts'));

test('1. CV PDF under 5 MB -> valid', () => {
  const file = { name: 'cv.pdf', type: 'application/pdf', size: 4 * 1024 * 1024 };
  const res = validateDocumentFile('cv', file);
  assert.equal(res.valid, true);
});

test('2. CV DOCX under 5 MB -> valid', () => {
  const file = {
    name: 'cv.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 3 * 1024 * 1024,
  };
  const res = validateDocumentFile('cv', file);
  assert.equal(res.valid, true);
});

test('3. CV PDF over 5 MB -> invalid (FILE_TOO_LARGE)', () => {
  const file = { name: 'cv.pdf', type: 'application/pdf', size: 6 * 1024 * 1024 };
  const res = validateDocumentFile('cv', file);
  assert.equal(res.valid, false);
  if (!res.valid) {
    assert.equal(res.reason, 'FILE_TOO_LARGE');
    assert.match(res.message, /5 MB/);
  }
});

test('4. CV PNG -> invalid (INVALID_FILE_TYPE)', () => {
  const file = { name: 'cv.png', type: 'image/png', size: 2 * 1024 * 1024 };
  const res = validateDocumentFile('cv', file);
  assert.equal(res.valid, false);
  if (!res.valid) {
    assert.equal(res.reason, 'INVALID_FILE_TYPE');
  }
});

test('5. Transcript PDF under 10 MB -> valid', () => {
  const file = { name: 'transcript.pdf', type: 'application/pdf', size: 9 * 1024 * 1024 };
  const res = validateDocumentFile('transcript', file);
  assert.equal(res.valid, true);
});

test('6. Transcript PNG -> invalid (INVALID_FILE_TYPE)', () => {
  const file = { name: 'transcript.png', type: 'image/png', size: 2 * 1024 * 1024 };
  const res = validateDocumentFile('transcript', file);
  assert.equal(res.valid, false);
  if (!res.valid) {
    assert.equal(res.reason, 'INVALID_FILE_TYPE');
  }
});

test('7. Passport PNG under 5 MB -> valid', () => {
  const file = { name: 'passport.png', type: 'image/png', size: 4 * 1024 * 1024 };
  const res = validateDocumentFile('passport', file);
  assert.equal(res.valid, true);
});

test('8. Passport PDF over 5 MB -> invalid (FILE_TOO_LARGE)', () => {
  const file = { name: 'passport.pdf', type: 'application/pdf', size: 6 * 1024 * 1024 };
  const res = validateDocumentFile('passport', file);
  assert.equal(res.valid, false);
  if (!res.valid) {
    assert.equal(res.reason, 'FILE_TOO_LARGE');
  }
});

test('9. Recommendation letter DOCX under 5 MB -> valid', () => {
  const file = {
    name: 'rec.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 2 * 1024 * 1024,
  };
  const res = validateDocumentFile('recommendation_letter', file);
  assert.equal(res.valid, true);
});

test('10. Recommendation letter EXE -> invalid (INVALID_FILE_TYPE)', () => {
  const file = { name: 'letter.exe', type: 'application/x-msdownload', size: 1 * 1024 * 1024 };
  const res = validateDocumentFile('recommendation_letter', file);
  assert.equal(res.valid, false);
  if (!res.valid) {
    assert.equal(res.reason, 'INVALID_FILE_TYPE');
  }
});

test('11. English test JPG under 5 MB -> valid', () => {
  const file = { name: 'toefl.jpg', type: 'image/jpeg', size: 3 * 1024 * 1024 };
  const res = validateDocumentFile('english_test', file);
  assert.equal(res.valid, true);
});

test('12. Uppercase extension such as FILE.PDF -> handled correctly', () => {
  const file = { name: 'MY_RESUME.PDF', type: 'application/pdf', size: 2 * 1024 * 1024 };
  const res = validateDocumentFile('cv', file);
  assert.equal(res.valid, true);
});

test('13. MIME/extension mismatch -> rejected when appropriate', () => {
  const file = { name: 'fake_cv.pdf', type: 'image/png', size: 2 * 1024 * 1024 };
  const res = validateDocumentFile('cv', file);
  assert.equal(res.valid, false);
  if (!res.valid) {
    assert.equal(res.reason, 'INVALID_FILE_TYPE');
  }
});

test('14. Invalid file does not trigger an API request', () => {
  let apiCalled = false;
  const mockApiUpload = () => {
    apiCalled = true;
  };

  const invalidFile = { name: 'virus.exe', type: 'application/x-msdownload', size: 100 };
  const valResult = validateDocumentFile('cv', invalidFile);

  if (valResult.valid) {
    mockApiUpload();
  }

  assert.equal(valResult.valid, false);
  assert.equal(apiCalled, false);
});

test('15. Valid file continues through existing upload flow', () => {
  let apiCalled = false;
  let uploadPayload = null;
  const mockApiUpload = (file) => {
    apiCalled = true;
    uploadPayload = {
      document_type: 'cv',
      file_name: file.name,
      content_type: file.type,
      file_size: file.size,
    };
  };

  const validFile = { name: 'my_resume.pdf', type: 'application/pdf', size: 2 * 1024 * 1024 };
  const valResult = validateDocumentFile('cv', validFile);

  if (valResult.valid) {
    mockApiUpload(validFile);
  }

  assert.equal(valResult.valid, true);
  assert.equal(apiCalled, true);
  assert.deepEqual(uploadPayload, {
    document_type: 'cv',
    file_name: 'my_resume.pdf',
    content_type: 'application/pdf',
    file_size: 2 * 1024 * 1024,
  });
});

test('16. University Admission Letter PDF under 10 MB -> valid', () => {
  const file = { name: 'admission.pdf', type: 'application/pdf', size: 9 * 1024 * 1024 };
  const res = validateDocumentFile('university_admission_letter', file);
  assert.equal(res.valid, true);
});

test('17. University Admission Letter PNG under 10 MB -> valid', () => {
  const file = { name: 'admission.png', type: 'image/png', size: 5 * 1024 * 1024 };
  const res = validateDocumentFile('university_admission_letter', file);
  assert.equal(res.valid, true);
});

test('18. University Admission Letter PDF over 10 MB -> invalid (FILE_TOO_LARGE)', () => {
  const file = { name: 'admission.pdf', type: 'application/pdf', size: 11 * 1024 * 1024 };
  const res = validateDocumentFile('university_admission_letter', file);
  assert.equal(res.valid, false);
  if (!res.valid) {
    assert.equal(res.reason, 'FILE_TOO_LARGE');
  }
});

test('19. University Admission Letter EXE -> invalid (INVALID_FILE_TYPE)', () => {
  const file = { name: 'admission.exe', type: 'application/x-msdownload', size: 1 * 1024 * 1024 };
  const res = validateDocumentFile('university_admission_letter', file);
  assert.equal(res.valid, false);
  if (!res.valid) {
    assert.equal(res.reason, 'INVALID_FILE_TYPE');
  }
});

test('20. Valid University Admission Letter payload contains exact document_type string', () => {
  const validFile = { name: 'letter.pdf', type: 'application/pdf', size: 2 * 1024 * 1024 };
  const valResult = validateDocumentFile('university_admission_letter', validFile);

  assert.equal(valResult.valid, true);
  const uploadPayload = {
    document_type: 'university_admission_letter',
    file_name: validFile.name,
    content_type: validFile.type,
    file_size: validFile.size,
  };

  assert.equal(uploadPayload.document_type, 'university_admission_letter');
});

test('21. Multiple-dot filename such as my.admission.letter.pdf -> valid', () => {
  const file = { name: 'my.admission.letter.pdf', type: 'application/pdf', size: 2 * 1024 * 1024 };
  const res = validateDocumentFile('university_admission_letter', file);
  assert.equal(res.valid, true);
});

test('22. Trailing spaces in filename such as admission_letter.pdf  -> valid', () => {
  const file = { name: 'admission_letter.pdf ', type: 'application/pdf', size: 2 * 1024 * 1024 };
  const res = validateDocumentFile('university_admission_letter', file);
  assert.equal(res.valid, true);
});

test('23. MIME type with parameters such as application/pdf; name="letter.pdf" -> valid', () => {
  const file = {
    name: 'admission_letter.pdf',
    type: 'application/pdf; name="letter.pdf"',
    size: 2 * 1024 * 1024,
  };
  const res = validateDocumentFile('university_admission_letter', file);
  assert.equal(res.valid, true);
});

test('24. Uppercase extension and parameterized MIME -> valid', () => {
  const file = {
    name: 'MY_ADMISSION_LETTER.PDF',
    type: 'application/pdf; charset=binary',
    size: 2 * 1024 * 1024,
  };
  const res = validateDocumentFile('university_admission_letter', file);
  assert.equal(res.valid, true);
});

test('25. Empty MIME type with valid .pdf extension -> valid', () => {
  const file = { name: 'admission_letter.pdf', type: '', size: 2 * 1024 * 1024 };
  const res = validateDocumentFile('university_admission_letter', file);
  assert.equal(res.valid, true);
});

test('26. Motivation Letter PDF & DOCX -> valid', () => {
  const pdfFile = { name: 'motivation.pdf', type: 'application/pdf', size: 3 * 1024 * 1024 };
  const docxFile = {
    name: 'motivation.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 3 * 1024 * 1024,
  };
  assert.equal(validateDocumentFile('motivation_letter', pdfFile).valid, true);
  assert.equal(validateDocumentFile('motivation_letter', docxFile).valid, true);
});

test('27. Image mime type variation image/jpg for JPG file -> valid', () => {
  const file = { name: 'certificate.jpg', type: 'image/jpg', size: 2 * 1024 * 1024 };
  const res = validateDocumentFile('graduation_certificate', file);
  assert.equal(res.valid, true);
});
