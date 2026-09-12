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

const root = fileURLToPath(new URL('../', import.meta.url));
const schemas = path.join(root, 'src/features/auth/schemas');
const { createForgotPasswordSchema } = loadModule(path.join(schemas, 'forgot-password.schema.ts'));
const { createResetPasswordSchema } = loadModule(path.join(schemas, 'reset-password.schema.ts'));
const translate = (key) => key;

test('forgot-password requires a valid email', () => {
  const schema = createForgotPasswordSchema(translate);
  assert.equal(schema.safeParse({ email: '' }).success, false);
  assert.equal(schema.safeParse({ email: 'not-an-email' }).success, false);
  assert.equal(schema.safeParse({ email: 'student@example.com' }).success, true);
});

test('reset-password enforces backend length, digit, and supported special-character rules', () => {
  const schema = createResetPasswordSchema(translate);
  for (const password of ['Short1!', 'NoDigits!', 'NoSpecial123']) {
    assert.equal(
      schema.safeParse({ new_password: password, confirm_password: password }).success,
      false,
      password
    );
  }
  assert.equal(
    schema.safeParse({ new_password: 'Valid123!', confirm_password: 'Valid123!' }).success,
    true
  );
});

test('reset-password rejects a mismatched confirmation', () => {
  const result = createResetPasswordSchema(translate).safeParse({
    new_password: 'Valid123!',
    confirm_password: 'Different123!',
  });
  assert.equal(result.success, false);
  assert.equal(
    result.error.issues.some((issue) => issue.path[0] === 'confirm_password'),
    true
  );
});

test('API modules use the exact public endpoints and payload field names', () => {
  const forgotSource = fs.readFileSync(
    path.join(root, 'src/features/auth/api/forgot-password.ts'),
    'utf8'
  );
  const resetSource = fs.readFileSync(
    path.join(root, 'src/features/auth/api/reset-password.ts'),
    'utf8'
  );
  assert.match(forgotSource, /apiClient<PasswordRecoveryResponse>\('\/auth\/forgot-password'/);
  assert.match(resetSource, /apiClient<PasswordRecoveryResponse>\('\/auth\/reset-password'/);
  assert.match(resetSource, /token: string/);
  assert.match(resetSource, /new_password: string/);
  assert.doesNotMatch(resetSource, /confirm_password/);
});

test('reset route passes only a non-empty scalar token to the form', () => {
  const route = fs.readFileSync(
    path.join(root, 'src/app/[locale]/reset-password/page.tsx'),
    'utf8'
  );
  assert.match(route, /typeof params\.token === 'string'/);
  assert.match(route, /params\.token\.trim\(\)/);
  assert.match(route, /token=\{token \|\| undefined\}/);
});
