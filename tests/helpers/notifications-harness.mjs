import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IntlMessageFormat } from 'intl-messageformat';
import ts from 'typescript';

// Shared harness of the two Student Notifications test files (Feature 011): loads TypeScript
// from src/ without a build, resolves the "@/..." alias, and stubs next-intl, the locale-aware
// navigation, next/image and the auth hooks so components can be server-rendered. Importing
// this module installs the stubs for the current test process.

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

export const rootPath = fileURLToPath(new URL('../..', import.meta.url));
export const srcPath = path.join(rootPath, 'src');
export const featurePath = path.join(srcPath, 'features/student/notifications');

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith('@/') ? path.join(srcPath, request.slice(2)) : request;
  return resolveFilename.call(this, target, ...rest);
};

process.env.BACKEND_URL = 'https://backend.test/';

export const read = (relative) => fs.readFileSync(path.join(rootPath, relative), 'utf8');
export const readJson = (relative) => JSON.parse(read(relative));
export const messages = {
  en: readJson('src/messages/en.json'),
  ar: readJson('src/messages/ar.json'),
};

export const React = loadModule('react');
export const { renderToStaticMarkup } = loadModule('react-dom/server');
export const { QueryClient, QueryClientProvider } = loadModule('@tanstack/react-query');
export const { intlFormats } = loadModule(path.join(srcPath, 'i18n/formatting.ts'));

// Mutable view of the "request": tests set locale, pathname and user before rendering.
export const env = {
  locale: 'en',
  pathname: '/student/notifications',
  user: { name: 'Layla Student', role: 'student' },
  pushed: [],
};

export const lookup = (namespace, key, locale = env.locale) =>
  `${namespace}.${key}`
    .split('.')
    .reduce(
      (value, part) => (value && typeof value === 'object' ? value[part] : undefined),
      messages[locale]
    );

export const format = (message, values, locale = env.locale) =>
  String(new IntlMessageFormat(message, locale, intlFormats).format(values));

const nextIntlStub = {
  useLocale: () => env.locale,
  useTranslations: (namespace) => {
    const t = (key, values) => {
      const message = lookup(namespace, key);
      if (typeof message !== 'string') return `${namespace}.${key}`;
      return format(message, values);
    };
    t.has = (key) => typeof lookup(namespace, key) === 'string';
    return t;
  },
};

const navigationStub = {
  Link: ({ href, children, ...props }) =>
    React.createElement(
      'a',
      { href: typeof href === 'string' ? href : href?.pathname, ...props },
      children
    ),
  usePathname: () => env.pathname,
  useRouter: () => ({
    replace(target) {
      env.pushed.push(target);
    },
    push(target) {
      env.pushed.push(target);
    },
    prefetch() {},
  }),
};

const imageStub = {
  __esModule: true,
  default: ({ src, alt, width, height, className }) =>
    React.createElement('img', {
      src: typeof src === 'string' ? src : '',
      alt,
      width,
      height,
      className,
    }),
};

const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === 'next-intl') return nextIntlStub;
  if (request === 'next/image') return imageStub;
  if (request === '@/i18n/navigation') return navigationStub;
  if (request === '@/features/auth/providers/AuthProvider')
    return { useAuth: () => ({ user: env.user }), AuthProvider: ({ children }) => children };
  if (request === '@/features/auth/hooks/useLogout') {
    return { useLogout: () => ({ mutate() {}, isPending: false }) };
  }
  return originalLoad.call(this, request, parent, ...rest);
};

export const loadSrc = (relative) => loadModule(path.join(srcPath, relative));
export const loadFeature = (relative) => loadModule(path.join(featurePath, relative));
export const loadPackage = (name) => loadModule(name);

export function withEnv(vars, fn) {
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

export function render(element, locale = 'en', client = new QueryClient()) {
  env.locale = locale;
  return renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, element));
}

export const flatten = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    value && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );

export const sourceFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : [full];
  });

export const rel = (file) => path.relative(rootPath, file).replaceAll('\\', '/');

export const stripComments = (code) =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
