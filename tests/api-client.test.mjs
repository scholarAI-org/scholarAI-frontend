import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { afterEach, test } from 'node:test';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);
loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

const root = fileURLToPath(new URL('../', import.meta.url));
const { apiClient, resolveBackendBaseUrl } = loadModule(path.join(root, 'src/lib/api-client.ts'));

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
});

function captureFetch() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  return calls;
}

test('the browser always calls the same-origin /backend proxy', () => {
  assert.equal(resolveBackendBaseUrl(true, 'https://api.example.com'), '/backend');
  assert.equal(resolveBackendBaseUrl(true, undefined), '/backend');
});

test('server-side calls need an absolute BACKEND_URL', () => {
  assert.equal(resolveBackendBaseUrl(false, 'https://api.example.com/'), 'https://api.example.com');
  assert.throws(() => resolveBackendBaseUrl(false, undefined), /BACKEND_URL is not configured/);
});

test('apiClient in the browser sends relative /backend URLs with credentials', async () => {
  globalThis.window = {};
  const calls = captureFetch();
  await apiClient('auth/me');
  await apiClient('/api/scholarships/?page=2', { method: 'GET' });
  assert.deepEqual(
    calls.map((call) => call.url),
    ['/backend/auth/me', '/backend/api/scholarships/?page=2']
  );
  assert.ok(calls.every((call) => call.init.credentials === 'include'));
});
