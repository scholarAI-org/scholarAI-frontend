import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);
loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

const { resolvePostLoginPath, loginPathWithNext } = loadModule(
  path.join(process.cwd(), 'src/features/auth/lib/post-login-path.ts')
);

test('accepts internal paths inside the role area, keeping the query', () => {
  assert.equal(
    resolvePostLoginPath('/student/scholarships?search=japan', 'student'),
    '/student/scholarships?search=japan'
  );
  assert.equal(resolvePostLoginPath('/admin/dashboard', 'admin'), '/admin/dashboard');
});

test('rejects external, protocol-relative and cross-role targets', () => {
  assert.equal(resolvePostLoginPath('//evil.com', 'student'), '/student/profile');
  assert.equal(resolvePostLoginPath('https://evil.com', 'student'), '/student/profile');
  assert.equal(resolvePostLoginPath('/\\evil.com', 'student'), '/student/profile');
  assert.equal(resolvePostLoginPath('/admin/dashboard', 'student'), '/student/profile');
  assert.equal(resolvePostLoginPath('/student/profile', 'admin'), '/admin/dashboard');
  assert.equal(resolvePostLoginPath('/studentx/profile', 'student'), '/student/profile');
});

test('falls back for empty and non-string values', () => {
  for (const value of ['', null, undefined, 42, {}, 'student/profile']) {
    assert.equal(resolvePostLoginPath(value, 'student'), '/student/profile');
    assert.equal(resolvePostLoginPath(value, 'admin'), '/admin/dashboard');
  }
});

test('loginPathWithNext encodes the target path and query', () => {
  assert.equal(
    loginPathWithNext('/student/scholarships?search=a b'),
    '/login?next=%2Fstudent%2Fscholarships%3Fsearch%3Da%20b'
  );
});
