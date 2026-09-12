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
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const { createVerifyEmailSchema } = loadModule(
  path.join(root, 'src/features/auth/schemas/verify-email.schema.ts')
);
const schema = createVerifyEmailSchema((key) => key);

test('verification schema accepts exactly six numeric digits', () => {
  assert.equal(schema.safeParse({ otp: '123456' }).success, true);
  for (const otp of ['', '12345', '1234567', '12A456']) {
    assert.equal(schema.safeParse({ otp }).success, false, otp);
  }
});

test('verification APIs use the exact endpoints and payload field names', () => {
  const verify = read('src/features/auth/api/verify-email.ts');
  const resend = read('src/features/auth/api/resend-verification-otp.ts');
  assert.match(verify, /apiClient<EmailVerificationResponse>\('\/auth\/verify-email'/);
  assert.match(verify, /email: string/);
  assert.match(verify, /otp: string/);
  assert.match(resend, /apiClient<EmailVerificationResponse>\('\/auth\/resend-verification-otp'/);
  assert.match(resend, /email: string/);
  assert.doesNotMatch(resend, /otp: string/);
});

test('registration carries the encoded email to the localized verification route', () => {
  const hook = read('src/features/auth/hooks/useRegister.ts');
  assert.match(
    hook,
    /router\.push\(`\/verify-email\?email=\$\{encodeURIComponent\(credentials\.email\)\}`\)/
  );
  assert.doesNotMatch(hook, /register-success/);
});

test('verification route accepts only a non-empty scalar email query value', () => {
  const route = read('src/app/[locale]/verify-email/page.tsx');
  assert.match(route, /typeof params\.email === 'string'/);
  assert.match(route, /params\.email\.trim\(\)/);
  assert.match(route, /email=\{email \|\| undefined\}/);
});

test('OTP component implements numeric filtering, paste, focus advance, and backspace navigation', () => {
  const otp = read('src/features/auth/components/OtpInput.tsx');
  assert.match(otp, /replace\(\/\\D\/g, ''\)/);
  assert.match(otp, /onPaste=/);
  assert.match(otp, /clipboardData\.getData\('text'\)/);
  assert.match(otp, /refs\.current\[index - 1\]\?\.focus\(\)/);
  assert.match(otp, /Math\.min\(index \+ 1, OTP_LENGTH - 1\)/);
});
