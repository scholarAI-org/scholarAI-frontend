import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { IntlMessageFormat } from 'intl-messageformat';

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
