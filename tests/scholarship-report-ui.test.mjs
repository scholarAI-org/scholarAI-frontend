import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import { after, test } from 'node:test';
import { IntlMessageFormat } from 'intl-messageformat';
import { loadPackage, loadSrc, srcPath } from './helpers/load-src.mjs';

const React = loadPackage('react');
const { renderToStaticMarkup } = loadPackage('react-dom/server');
const { QueryClient, QueryClientProvider } = loadPackage('@tanstack/react-query');

const allMessages = Object.fromEntries(
  ['en', 'ar'].map((locale) => [
    locale,
    JSON.parse(fs.readFileSync(path.join(srcPath, `messages/${locale}.json`), 'utf8')),
  ])
);

// The component module is cached after its first load, so the next-intl mock
// reads the current locale at call time instead of capturing it once.
let currentLocale = 'en';
const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'next-intl') {
    return {
      useLocale: () => currentLocale,
      useTranslations: (namespace) => (key, values) => {
        const message = `${namespace}.${key}`
          .split('.')
          .reduce((value, part) => (value ? value[part] : undefined), allMessages[currentLocale]);
        return new IntlMessageFormat(message ?? `${namespace}.${key}`, currentLocale).format(
          values
        );
      },
    };
  }
  return originalLoad.call(this, request, ...rest);
};
after(() => {
  Module._load = originalLoad;
});

function render(locale, props = {}) {
  currentLocale = locale;
  const { ReportDialog } = loadSrc(
    'features/student/scholarship-details/components/ReportDialog.tsx'
  );
  const client = new QueryClient();
  const html = renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(ReportDialog, { id: 564, open: true, onClose: () => {}, ...props })
    )
  );
  client.clear();
  return html;
}

test('the dialog is a native modal named by its heading', () => {
  const html = render('en');
  const labelledBy = /<dialog[^>]*aria-labelledby="([^"]+)"/.exec(html)?.[1];
  assert.ok(labelledBy, 'dialog has aria-labelledby');
  assert.ok(html.includes(`<h2 id="${labelledBy}"`));
  assert.ok(html.includes('>Report a scholarship</h2>'));
});

test('every live report type is a labelled radio inside a fieldset with a legend', () => {
  const html = render('en');
  assert.ok(/<fieldset[\s\S]*<legend[^>]*>/.test(html));
  const radios = html.match(/<input[^>]*type="radio"[^>]*>/g) ?? [];
  assert.equal(radios.length, 6);
  for (const type of [
    'expired',
    'broken_link',
    'duplicate',
    'suspicious',
    'incorrect_information',
    'other',
  ]) {
    assert.ok(
      radios.some((radio) => radio.includes(`value="${type}"`)),
      type
    );
  }
  // Each radio sits inside a <label> that carries its visible text.
  assert.equal((html.match(/<label[^>]*><input[^>]*type="radio"/g) ?? []).length, 6);
});

test('the optional details field has a real label and describes its limit', () => {
  const html = render('en');
  const id = /<textarea[^>]*id="([^"]+)"/.exec(html)?.[1];
  assert.ok(id);
  assert.ok(html.includes(`<label for="${id}"`));
  assert.ok(html.includes('>Details (optional)</label>'));
  assert.ok(/<textarea[^>]*aria-describedby="[^"]*-details-hint"/.test(html));
  assert.ok(html.includes('0 / 2000'));
  // The counter keeps its order in an RTL page ("2001 / 2000", not "2000 / 2001").
  assert.ok(/<p[^>]*dir="ltr"[^>]*>0 \/ 2000<\/p>/.test(html));
});

test('the dialog renders in Arabic with the Figma wording and logical properties only', () => {
  const html = render('ar');
  assert.ok(html.includes('الإبلاغ عن منحة'));
  assert.ok(html.includes('ساعدنا في الحفاظ على جودة المعلومات'));
  assert.ok(html.includes('إرسال البلاغ'));
  assert.equal(/\b(rtl|ltr):/.test(html), false, 'no rtl:/ltr: variant classes');
  assert.equal(/\b(ml|mr|pl|pr|left|right)-\d/.test(html), false, 'logical properties only');
});

test('closed: only the empty dialog shell is rendered', () => {
  const html = render('en', { open: false });
  assert.ok(html.includes('<dialog'));
  assert.equal(html.includes('<form'), false);
});
