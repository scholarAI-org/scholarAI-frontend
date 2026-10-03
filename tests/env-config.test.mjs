import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx|js|mjs)$/.test(entry.name) ? [full] : [];
  });
}

test('.env.example documents the server-only proxy variables', () => {
  const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  assert.match(example, /^BACKEND_URL=/m);
  assert.match(example, /^PROXY_SHARED_SECRET=$/m);
  assert.doesNotMatch(example, /NEXT_PUBLIC_(API_URL|BACKEND_URL|PROXY_SHARED_SECRET)/);
  assert.doesNotMatch(example, /scholarai-backend-uujl/);
});

test('no source file exposes backend config to the browser', () => {
  const offenders = sourceFiles(path.join(root, 'src')).filter((file) =>
    /NEXT_PUBLIC_(API_URL|BACKEND_URL|PROXY_SHARED_SECRET)/.test(fs.readFileSync(file, 'utf8'))
  );
  assert.deepEqual(offenders, []);
});
