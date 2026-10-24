import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { IntlMessageFormat } from 'intl-messageformat';
import ts from 'typescript';

// Feature 009: Student Home. One file, labelled sections, one per phase/story.

// ----------------------------- harness -------------------------------------

const loadModule = createRequire(import.meta.url);

loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

loadModule.extensions['.tsx'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  module._compile(outputText, filename);
};

const srcPath = fileURLToPath(new URL('../src', import.meta.url));
const rootPath = fileURLToPath(new URL('..', import.meta.url));
const homePath = path.join(srcPath, 'features/student/home');

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith('@/') ? path.join(srcPath, request.slice(2)) : request;
  return resolveFilename.call(this, target, ...rest);
};

process.env.BACKEND_URL = 'https://backend.test/';

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(srcPath, rel), 'utf8'));
const messages = { en: readJson('messages/en.json'), ar: readJson('messages/ar.json') };

const React = loadModule('react');
const { renderToStaticMarkup } = loadModule('react-dom/server');
const { intlFormats } = loadModule(path.join(srcPath, 'i18n/formatting.ts'));

// Mutable view of the "request": tests set locale/pathname before rendering.
const env = { locale: 'en', pathname: '/student' };

const lookup = (namespace, key) =>
  `${namespace}.${key}`
    .split('.')
    .reduce((value, part) => (value && typeof value === 'object' ? value[part] : undefined), messages[env.locale]);

const nextIntlStub = {
  useLocale: () => env.locale,
  useTranslations: (namespace) => (key, values) => {
    const message = lookup(namespace, key);
    if (typeof message !== 'string') return `${namespace}.${key}`;
    return String(new IntlMessageFormat(message, env.locale, intlFormats).format(values));
  },
};

const navigationStub = {
  Link: ({ href, children, ...props }) =>
    React.createElement('a', { href: typeof href === 'string' ? href : href?.pathname, ...props }, children),
  usePathname: () => env.pathname,
  useRouter: () => ({ replace() {}, push() {}, prefetch() {} }),
};

const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === 'next-intl') return nextIntlStub;
  if (request === '@/i18n/navigation') return navigationStub;
  return originalLoad.call(this, request, parent, ...rest);
};

const loadSrc = (rel) => loadModule(path.join(srcPath, rel));
const loadHome = (rel) => loadModule(path.join(homePath, rel));

function withEnv(vars, fn) {
  const previous = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    if (vars[key] === undefined) delete process.env[key];
    else process.env[key] = vars[key];
  }
  try {
    return fn();
  } finally {
    for (const key of Object.keys(vars)) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

function render(element, { locale = 'en' } = {}) {
  env.locale = locale;
  return renderToStaticMarkup(element);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const rel = (file) => path.relative(rootPath, file).split(path.sep).join('/');

// Silence unused-helper lint in sections that are added in later phases.
void [assert, loadSrc, loadHome, withEnv, render, walk, rel, homePath];

// ----------------------------- smoke ---------------------------------------

test('harness: modules, aliases and the next-intl stub work', () => {
  const { toFormattingLocale } = loadSrc('i18n/formatting.ts');
  assert.equal(toFormattingLocale('ar'), 'ar-u-nu-latn');
  const t = nextIntlStub.useTranslations('StudentLayout');
  assert.equal(t('brand.name'), 'PsScholar');
});
