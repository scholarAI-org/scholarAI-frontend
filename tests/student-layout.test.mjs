import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { IntlMessageFormat } from 'intl-messageformat';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);

loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

const layoutPath = fileURLToPath(new URL('../src/features/student/layout', import.meta.url));
const load = (file) => loadModule(path.join(layoutPath, file));
const {
  getActiveStudentNavigationItem,
  getStudentPageKey,
  getVisibleStudentNavigation,
  studentNavigation,
} = load('student-navigation.ts');
const { getStudentDisplayName, getStudentInitial } = load('student-identity.ts');
const { getFocusTrapTarget } = load('focus-trap.ts');

const readMessages = (locale) =>
  JSON.parse(fs.readFileSync(new URL(`../src/messages/${locale}.json`, import.meta.url), 'utf8'));

const messages = { ar: readMessages('ar'), en: readMessages('en') };
const namespaces = ['StudentLayout', 'StudentScholarshipDiscovery', 'StudentScholarshipDetails'];

function flatten(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'string' ? [[`${prefix}${key}`, child]] : flatten(child, `${prefix}${key}.`)
  );
}

function pluralNodes(ast) {
  return ast.flatMap((node) =>
    node.options
      ? [
          ...(node.pluralType ? [node] : []),
          ...Object.values(node.options).flatMap((option) => pluralNodes(option.value)),
        ]
      : []
  );
}

// --- Message catalogues ------------------------------------------------------

test('the three student namespaces exist in both locales with identical keys', () => {
  for (const namespace of namespaces) {
    assert.ok(messages.ar[namespace], `ar.${namespace} missing`);
    assert.ok(messages.en[namespace], `en.${namespace} missing`);
    const arKeys = flatten(messages.ar[namespace])
      .map(([key]) => key)
      .sort();
    const enKeys = flatten(messages.en[namespace])
      .map(([key]) => key)
      .sort();
    assert.deepEqual(arKeys, enKeys, namespace);
  }
});

test('every student message is non-empty, valid ICU and formats in its locale', () => {
  const values = { count: 3, title: 'T', date: '2026-12-31', page: 2 };
  for (const locale of ['ar', 'en']) {
    for (const namespace of namespaces) {
      for (const [key, message] of flatten(messages[locale][namespace])) {
        const id = `${locale}.${namespace}.${key}`;
        assert.ok(message.trim(), `${id} is empty`);
        const formatter = new IntlMessageFormat(message, locale);
        assert.equal(typeof formatter.format(values), 'string', id);
      }
    }
  }
});

test('plural messages define every category their locale needs', () => {
  const required = {
    ar: ['one', 'two', 'few', 'many', 'other'],
    en: ['one', 'other'],
  };
  let checked = 0;
  for (const locale of ['ar', 'en']) {
    for (const namespace of namespaces) {
      for (const [key, message] of flatten(messages[locale][namespace])) {
        for (const node of pluralNodes(new IntlMessageFormat(message, locale).getAst())) {
          const id = `${locale}.${namespace}.${key}`;
          const options = Object.keys(node.options);
          for (const category of required[locale]) {
            assert.ok(options.includes(category), `${id} lacks "${category}"`);
          }
          if (locale === 'ar') {
            assert.ok(
              options.includes('zero') || options.includes('=0'),
              `${id} lacks a zero case (zero or =0)`
            );
          }
          checked += 1;
        }
      }
    }
  }
  assert.ok(checked >= 6, `expected plural messages to be checked, saw ${checked}`);
});

test('Arabic plurals render the expected forms', () => {
  const format = (key, count) =>
    new IntlMessageFormat(messages.ar.StudentScholarshipDiscovery.results[key], 'ar').format({
      count,
    });
  assert.equal(format('count', 0), 'لا توجد منح');
  assert.equal(format('count', 1), 'منحة واحدة');
  assert.equal(format('count', 2), 'منحتان');
  assert.match(format('count', 5), /منح$/);
  assert.match(format('count', 11), /منحة$/);
});

// --- Navigation --------------------------------------------------------------

test('navigation config has only Profile and Search Scholarships', () => {
  assert.deepEqual(
    studentNavigation.map(({ id, href }) => [id, href]),
    [
      ['profile', '/student/profile'],
      ['scholarships', '/student/scholarships'],
    ]
  );
  for (const item of studentNavigation) {
    assert.ok(messages.en.StudentLayout.nav[item.id], `missing label for ${item.id}`);
  }
});

test('Search Scholarships stays hidden until its route exists (T023)', () => {
  const visible = getVisibleStudentNavigation(studentNavigation).map((item) => item.id);
  const routeExists = fs.existsSync(
    new URL('../src/app/[locale]/student/scholarships/page.tsx', import.meta.url)
  );
  assert.deepEqual(visible, routeExists ? ['profile', 'scholarships'] : ['profile']);
});

test('active navigation item resolves by section', () => {
  assert.equal(getActiveStudentNavigationItem('/student/profile'), 'profile');
  assert.equal(getActiveStudentNavigationItem('/student/scholarships'), 'scholarships');
  assert.equal(getActiveStudentNavigationItem('/student/scholarships/12'), 'scholarships');
  assert.equal(getActiveStudentNavigationItem('/student/profiles'), null);
  assert.equal(getActiveStudentNavigationItem('/student'), null);
  assert.equal(getActiveStudentNavigationItem('/admin/dashboard'), null);
});

test('page titles resolve per route and exist in both locales', () => {
  assert.equal(getStudentPageKey('/student/profile'), 'profile');
  assert.equal(getStudentPageKey('/student/scholarships'), 'scholarships');
  assert.equal(getStudentPageKey('/student/scholarships/12'), 'scholarshipDetails');
  assert.equal(getStudentPageKey('/student/scholarships/12/extra'), null);
  assert.equal(getStudentPageKey('/student'), null);
  for (const key of ['profile', 'scholarships', 'scholarshipDetails']) {
    for (const locale of ['ar', 'en']) {
      const page = messages[locale].StudentLayout.pages[key];
      assert.ok(page?.title && page?.description, `${locale} pages.${key}`);
    }
  }
});

// --- Identity ----------------------------------------------------------------

test('display name prefers the account name, then email, then the fallback', () => {
  assert.equal(
    getStudentDisplayName({ name: ' Lina Haddad ', email: 'l@x.test' }, 'Student'),
    'Lina Haddad'
  );
  assert.equal(getStudentDisplayName({ name: '  ', email: 'l@x.test' }, 'Student'), 'l@x.test');
  assert.equal(getStudentDisplayName({ name: '', email: '' }, 'Student'), 'Student');
  assert.equal(getStudentDisplayName(null, 'طالب'), 'طالب');
  assert.equal(getStudentInitial('لينا'), 'ل');
  assert.equal(getStudentInitial('lina'), 'L');
  assert.equal(getStudentInitial(''), '?');
});

// --- Mobile navigation focus trap ---------------------------------------------

test('focus trap wraps at both ends and leaves the middle to the browser', () => {
  assert.equal(getFocusTrapTarget(2, 3, false), 0);
  assert.equal(getFocusTrapTarget(0, 3, true), 2);
  assert.equal(getFocusTrapTarget(1, 3, false), null);
  assert.equal(getFocusTrapTarget(1, 3, true), null);
  assert.equal(getFocusTrapTarget(-1, 3, false), 0);
  assert.equal(getFocusTrapTarget(-1, 3, true), 2);
  assert.equal(getFocusTrapTarget(0, 1, false), 0);
  assert.equal(getFocusTrapTarget(0, 0, false), null);
});
