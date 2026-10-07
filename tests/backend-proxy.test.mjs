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
const {
  backendTargetUrl,
  buildProxyRequestHeaders,
  isBackendPath,
  trailingSlashRedirectPath,
} = loadModule(path.join(root, 'src/lib/backend-proxy.ts'));

const SECRET = 's'.repeat(40);

test('only /backend and its subpaths are proxied', () => {
  assert.equal(isBackendPath('/backend'), true);
  assert.equal(isBackendPath('/backend/health'), true);
  assert.equal(isBackendPath('/backend/api/scholarships/'), true);
  assert.equal(isBackendPath('/backendx'), false);
  assert.equal(isBackendPath('/ar/backend/health'), false);
  assert.equal(isBackendPath('/'), false);
});

test('target URL strips the prefix and keeps trailing slash and query', () => {
  const base = 'https://api.example.com';
  assert.equal(backendTargetUrl('/backend/health', '', base), 'https://api.example.com/health');
  assert.equal(
    backendTargetUrl('/backend/api/scholarships/', '?page=2&country=EG', `${base}/`),
    'https://api.example.com/api/scholarships/?page=2&country=EG'
  );
  assert.equal(backendTargetUrl('/backend', '', base), 'https://api.example.com/');
});

test('client-supplied proxy headers are dropped when no secret is configured', () => {
  const headers = buildProxyRequestHeaders(
    new Headers({
      'x-forwarded-for': '203.0.113.7',
      'x-proxy-secret': 'attacker',
      'x-client-ip': '6.6.6.6',
    }),
    undefined
  );
  assert.equal(headers.get('x-proxy-secret'), null);
  assert.equal(headers.get('x-client-ip'), null);
});

test('client-supplied proxy headers are overwritten with the secret and forwarded IP', () => {
  const headers = buildProxyRequestHeaders(
    new Headers({
      'x-forwarded-for': '203.0.113.7',
      'X-Proxy-Secret': 'attacker',
      'X-Client-IP': '6.6.6.6',
    }),
    SECRET
  );
  assert.equal(headers.get('x-proxy-secret'), SECRET);
  assert.equal(headers.get('x-client-ip'), '203.0.113.7');
});

test('forwarded IP uses the first x-forwarded-for entry and supports IPv6', () => {
  const list = buildProxyRequestHeaders(
    new Headers({ 'x-forwarded-for': ' 2001:db8::1 , 10.0.0.1' }),
    SECRET
  );
  assert.equal(list.get('x-client-ip'), '2001:db8::1');
});

test('without x-forwarded-for neither the secret nor an IP is sent', () => {
  const headers = buildProxyRequestHeaders(new Headers({ 'x-client-ip': '6.6.6.6' }), SECRET);
  assert.equal(headers.get('x-proxy-secret'), null);
  assert.equal(headers.get('x-client-ip'), null);
});

test('cookies, origin, and other headers are forwarded unchanged', () => {
  const headers = buildProxyRequestHeaders(
    new Headers({
      cookie: 'access_token=abc',
      origin: 'https://scholar-ai-neon.vercel.app',
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.7',
    }),
    SECRET
  );
  assert.equal(headers.get('cookie'), 'access_token=abc');
  assert.equal(headers.get('origin'), 'https://scholar-ai-neon.vercel.app');
  assert.equal(headers.get('content-type'), 'application/json');
});

test('pages get the trailing-slash redirect, backend paths and root do not', () => {
  assert.equal(trailingSlashRedirectPath('/ar/login/'), '/ar/login');
  assert.equal(trailingSlashRedirectPath('/ar//'), '/ar');
  assert.equal(trailingSlashRedirectPath('/ar/login'), null);
  assert.equal(trailingSlashRedirectPath('/'), null);
  assert.equal(trailingSlashRedirectPath('/backend/api/scholarships/'), null);
});
