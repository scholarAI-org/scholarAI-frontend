import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module, { createRequire } from 'node:module';
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
const srcPath = path.join(root, 'src');
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith('@/') ? path.join(srcPath, request.slice(2)) : request;
  return resolveFilename.call(this, target, ...rest);
};

process.env.NEXT_PUBLIC_API_URL = 'https://backend.test/';

const { createRegisterSchema } = loadModule(
  path.join(srcPath, 'features/auth/schemas/create-register.schema.ts')
);
const { register } = loadModule(path.join(srcPath, 'features/auth/api/register.ts'));
const translate = (key) => key;

test('register schema enforces backend password rule (min 8, digit, special)', () => {
  const schema = createRegisterSchema(translate);
  const base = { name: 'Ahmed Ali', email: 'student@example.com', agreeTerms: true };
  for (const password of ['short1!', 'NoDigits!', 'NoSpecial123', 'longbutnospec1', 'longbutnodig!']) {
    assert.equal(schema.safeParse({ ...base, password }).success, false, password);
  }
  assert.equal(schema.safeParse({ ...base, password: 'Pass123!' }).success, true);
});

test('register schema rejects missing agreeTerms, short name and bad email', () => {
  const schema = createRegisterSchema(translate);
  const good = { name: 'Ahmed Ali', email: 'student@example.com', password: 'Pass123!', agreeTerms: true };
  assert.equal(schema.safeParse({ ...good, agreeTerms: false }).success, false);
  assert.equal(schema.safeParse({ ...good, agreeTerms: undefined }).success, false);
  assert.equal(schema.safeParse({ ...good, name: 'Ah' }).success, false);
  assert.equal(schema.safeParse({ ...good, email: 'not-an-email' }).success, false);
});

const realFetch = globalThis.fetch;
let calls = [];
afterEach(() => {
  globalThis.fetch = realFetch;
});

test('register POST body uses only full_name, email and password — no role', async () => {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify({ message: 'ok' }), { status: 201 });
  };
  await register({ name: 'Ahmed Ali', email: 'a@b.co', password: 'Pass123!', agreeTerms: true });
  const [{ url, init }] = calls;
  assert.equal(url.pathname, '/auth/register');
  assert.equal(init.method, 'POST');
  const body = JSON.parse(init.body);
  assert.deepEqual(Object.keys(body).sort(), ['email', 'full_name', 'password']);
  assert.equal(body.full_name, 'Ahmed Ali');
  assert.equal(body.email, 'a@b.co');
  assert.equal(body.password, 'Pass123!');
  assert.equal('role' in body, false);
});
