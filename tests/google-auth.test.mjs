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

const { googleAuth } = loadModule(path.join(rootDir, 'features/auth/api/google-auth.ts'));
const { setToken, getToken, clearToken } = loadModule(path.join(rootDir, 'lib/auth-storage.ts'));

// Mock window and global storage objects for Node.js test runner
const mockSessionStorage = new Map();
const mockLocalStorage = new Map();

const storageMock = {
  sessionStorage: {
    getItem: (key) => mockSessionStorage.get(key) ?? null,
    setItem: (key, value) => mockSessionStorage.set(key, value),
    removeItem: (key) => mockSessionStorage.delete(key),
  },
  localStorage: {
    getItem: (key) => mockLocalStorage.get(key) ?? null,
    setItem: (key, value) => mockLocalStorage.set(key, value),
    removeItem: (key) => mockLocalStorage.delete(key),
  },
};

globalThis.window = storageMock;
globalThis.sessionStorage = storageMock.sessionStorage;
globalThis.localStorage = storageMock.localStorage;

test('googleAuth function formats request body with credential key', async () => {
  let capturedUrl = '';
  let capturedOptions = null;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url.toString();
    capturedOptions = options;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'mock-app-jwt-token-123',
        token_type: 'bearer',
      }),
    };
  };

  const result = await googleAuth('mock-google-id-token-xyz');

  assert.ok(capturedUrl.endsWith('/auth/google'), 'Calls POST /auth/google endpoint');
  assert.equal(capturedOptions.method, 'POST');

  const body = JSON.parse(capturedOptions.body);
  assert.equal(body.credential, 'mock-google-id-token-xyz', 'Sends Google credential in body');

  assert.equal(result.access_token, 'mock-app-jwt-token-123');
  assert.equal(result.token_type, 'bearer');
});

test('stores returned application JWT without saving Google credential as app token', () => {
  mockSessionStorage.clear();
  mockLocalStorage.clear();

  const appJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.app-token';
  setToken(appJwtToken, false);

  assert.equal(getToken(), appJwtToken, 'getToken returns application JWT from storage');

  clearToken();
  assert.equal(getToken(), null, 'clearToken clears storage');
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
