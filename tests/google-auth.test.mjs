import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);
const rootDir = fileURLToPath(new URL('../src', import.meta.url));

loadModule.extensions['.ts'] = (module, filename) => {
  let code = fs.readFileSync(filename, 'utf8');
  // Map `@/` alias to absolute paths within `src/` directory
  code = code.replace(
    /(require\(|from\s+)(['"])@\/(.*?)\2/g,
    (match, prefix, quote, importPath) => {
      const resolvedPath = path.join(rootDir, importPath).replace(/\\/g, '/');
      return `${prefix}${quote}${resolvedPath}${quote}`;
    }
  );

  const { outputText } = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

// Google sign-in runs in the browser, so the api-client resolves the
// same-origin `/backend` proxy rather than an absolute backend URL.
globalThis.window = {};

const { googleAuth } = loadModule(path.join(rootDir, 'features/auth/api/google-auth.ts'));
const { BACKEND_PREFIX } = loadModule(path.join(rootDir, 'lib/backend-proxy.ts'));

test('googleAuth posts the credential through the same-origin proxy with the session cookie', async () => {
  let capturedUrl = '';
  let capturedOptions = null;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url.toString();
    capturedOptions = options;
    return {
      ok: true,
      status: 200,
      json: async () => ({ role: 'student' }),
    };
  };

  await googleAuth('mock-google-id-token-xyz');

  assert.equal(
    capturedUrl,
    `${BACKEND_PREFIX}/auth/google`,
    'Calls POST /auth/google via /backend'
  );
  assert.equal(capturedOptions.method, 'POST');
  assert.equal(
    capturedOptions.credentials,
    'include',
    'Sends and accepts the first-party session cookie'
  );
  assert.equal(capturedOptions.headers['Content-Type'], 'application/json');

  const body = JSON.parse(capturedOptions.body);
  assert.equal(body.credential, 'mock-google-id-token-xyz', 'Sends Google credential in body');
  assert.deepEqual(Object.keys(body), ['credential'], 'Sends nothing but the credential');
});

test('the session lives in the backend cookie: no auth token is persisted in the browser', () => {
  // The cookie-auth migration deleted src/lib/auth-storage.ts. Nothing in the auth
  // feature may reintroduce token storage, or the session stops being HttpOnly.
  const walk = (dir) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((entry) =>
        entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
      );

  assert.equal(fs.existsSync(path.join(rootDir, 'lib/auth-storage.ts')), false);

  const offenders = walk(path.join(rootDir, 'features/auth')).filter(
    (file) =>
      /\.(t|j)sx?$/.test(file) &&
      /(localStorage|sessionStorage|document\.cookie|auth-storage)/.test(
        fs.readFileSync(file, 'utf8')
      )
  );
  assert.deepEqual(
    offenders.map((file) => path.relative(rootDir, file).split(path.sep).join('/')),
    []
  );
});

test('translation files en.json and ar.json contain required Google Auth strings', () => {
  const enJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'messages/en.json'), 'utf8'));
  const arJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'messages/ar.json'), 'utf8'));

  // English keys
  assert.equal(enJson.Login.continueWithGoogle, 'Continue with Google');
  assert.equal(enJson.Register.signUpWithGoogle, 'Sign up with Google');
  assert.equal(enJson.Login.signingIn, 'Signing in...');
  assert.equal(enJson.Register.signingIn, 'Signing in...');
  assert.ok(enJson.Login.googleAuthError);

  // Arabic keys
  assert.equal(arJson.Login.continueWithGoogle, 'المتابعة باستخدام Google');
  assert.equal(arJson.Register.signUpWithGoogle, 'التسجيل باستخدام Google');
  assert.equal(arJson.Login.signingIn, 'جارٍ تسجيل الدخول...');
  assert.equal(arJson.Register.signingIn, 'جارٍ تسجيل الدخول...');
  assert.ok(arJson.Login.googleAuthError);
});

test('googleAuth handles backend error responses gracefully', async () => {
  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 401,
      json: async () => ({
        detail: 'Invalid Google credential token',
      }),
    };
  };

  await assert.rejects(
    async () => {
      await googleAuth('invalid-token');
    },
    (err) => {
      assert.equal(err.name, 'ApiError');
      assert.equal(err.message, 'Invalid Google credential token');
      assert.equal(err.status, 401);
      return true;
    }
  );
});
