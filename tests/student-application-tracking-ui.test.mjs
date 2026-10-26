import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { IntlMessageFormat } from 'intl-messageformat';
import ts from 'typescript';

// Feature 008 UI: server-rendered markup and pure presentation helpers. No DOM.

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
const featurePath = path.join(srcPath, 'features/student/application-tracking');
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

const env = { locale: 'en' };
const lookup = (namespace, key) =>
  `${namespace}.${key}`
    .split('.')
    .reduce(
      (value, part) => (value && typeof value === 'object' ? value[part] : undefined),
      messages[env.locale]
    );

const nextIntlStub = {
  useLocale: () => env.locale,
  useTranslations: (namespace) => (key, values) => {
    const message = lookup(namespace, key);
    if (typeof message !== 'string') return `${namespace}.${key}`;
    return String(new IntlMessageFormat(message, env.locale, intlFormats).format(values));
  },
};
const navigationStub = {
  Link: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  usePathname: () => '/student/tracking',
  useRouter: () => ({ replace() {}, push() {}, prefetch() {} }),
};

const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === 'next-intl') return nextIntlStub;
  if (request === '@/i18n/navigation') return navigationStub;
  return originalLoad.call(this, request, parent, ...rest);
};

const feature = (rel) => loadModule(path.join(featurePath, rel));
const render = (element, locale = 'en') => {
  env.locale = locale;
  return renderToStaticMarkup(element);
};
const h = React.createElement;

const makeItem = (overrides = {}, scholarship = {}) => ({
  id: 5,
  status: 'preparing_documents',
  notes: null,
  statusChangedAt: '2025-10-02T09:15:00',
  createdAt: '2025-09-30T08:00:00',
  updatedAt: '2025-10-02T09:15:00',
  officialUrl: null,
  scholarship: {
    id: 11,
    title: 'Erasmus Mundus',
    title_ar: 'إيراسموس موندوس للماجستير المشترك',
    title_en: 'Erasmus Mundus Joint Master',
    organization_name: 'European Union',
    deadline: '2026-01-15',
    no_deadline: false,
    is_saved: true,
    ...scholarship,
  },
  ...overrides,
});

const noop = () => {};
const renderCard = (item, { detailsEnabled = false, locale = 'en' } = {}) => {
  const { TrackingCard } = feature('components/TrackingCard.tsx');
  return render(
    h(TrackingCard, {
      item,
      detailsEnabled,
      onChangeStatus: noop,
      onSaveNote: async () => {},
      onRequestRemove: noop,
    }),
    locale
  );
};

// -------------------- messages -----------------------------------------------

const flatKeys = (value, prefix = '') =>
  Object.entries(value).flatMap(([key, child]) =>
    child && typeof child === 'object' ? flatKeys(child, `${prefix}${key}.`) : [`${prefix}${key}`]
  );

test('messages: StudentTracking has the same keys in ar and en', () => {
  assert.deepEqual(
    flatKeys(messages.ar.StudentTracking).sort(),
    flatKeys(messages.en.StudentTracking).sort()
  );
});

test('messages: every StudentTracking message parses as ICU in both locales', () => {
  for (const locale of ['ar', 'en']) {
    for (const key of flatKeys(messages[locale].StudentTracking)) {
      const message = key.split('.').reduce((v, p) => v[p], messages[locale].StudentTracking);
      assert.doesNotThrow(
        () => new IntlMessageFormat(message, locale, intlFormats),
        `${locale} ${key}`
      );
    }
  }
});

test('messages: no ICU uses # for numbers (digits stay Latin through number formatting)', () => {
  for (const locale of ['ar', 'en']) {
    for (const key of flatKeys(messages[locale].StudentTracking)) {
      const message = key.split('.').reduce((v, p) => v[p], messages[locale].StudentTracking);
      assert.equal(
        /\{[^}]*\}\s*#|#\s/.test(message) && /plural/.test(message),
        false,
        `${locale} ${key}`
      );
    }
  }
});

test('messages: Arabic skipped-count plural covers every category', () => {
  const format = (count) =>
    new IntlMessageFormat(messages.ar.StudentTracking.page.skipped, 'ar', intlFormats).format({
      count,
    });
  assert.equal(format(0), '');
  assert.equal(format(1), 'تعذّر عرض طلب واحد.');
  assert.equal(format(2), 'تعذّر عرض طلبين.');
  assert.match(String(format(5)), /5 طلبات/);
  assert.match(String(format(11)), /11 طلباً/);
  assert.match(String(format(100)), /100 طلب\./);
});

test('messages: nav and header copy exist and match the Figma wording', () => {
  assert.equal(messages.ar.StudentLayout.nav.tracking, 'تتبع الطلبات');
  assert.equal(messages.ar.StudentLayout.pages.tracking.title, 'متابعة التقديم');
  assert.equal(
    messages.ar.StudentLayout.pages.tracking.description,
    'سجّل حالة كل منحة وأضف ملاحظاتك وتواريخك المهمة'
  );
  assert.ok(messages.en.StudentLayout.nav.tracking);
  assert.ok(messages.en.StudentLayout.pages.tracking.title);
  const ar = messages.ar.StudentTracking.status;
  assert.deepEqual(ar, {
    saved: 'محفوظة / مهتم',
    preparing_documents: 'تجهيز المستندات',
    ready_to_apply: 'جاهز للتقديم',
    applied: 'تم التقديم',
    accepted: 'مقبول',
    rejected: 'مرفوض',
    closed: 'مغلق',
  });
});

// -------------------- navigation and route gate ------------------------------

test('nav: the tracking item is hidden by default and shown only when the flag enables it', () => {
  const { studentNavigation, withTrackingEnabled, getStudentPageKey, getVisibleStudentNavigation } =
    loadModule(path.join(srcPath, 'features/student/layout/student-navigation.ts'));
  const visible = (items) => getVisibleStudentNavigation(items).map((item) => item.id);
  assert.equal(visible(studentNavigation).includes('tracking'), false);
  assert.equal(visible(withTrackingEnabled(studentNavigation, false)).includes('tracking'), false);
  assert.equal(visible(withTrackingEnabled(studentNavigation, true)).includes('tracking'), true);
  assert.equal(getStudentPageKey('/student/tracking'), 'tracking');
});

test('route: the tracking page calls notFound() on a false flag before rendering anything', () => {
  const source = fs.readFileSync(
    path.join(srcPath, 'app/[locale]/student/tracking/page.tsx'),
    'utf8'
  );
  const gate = source.indexOf('featureFlags.trackingEnabled');
  const notFoundCall = source.indexOf('notFound();');
  const render = source.indexOf('<TrackingPage');
  assert.ok(gate > -1 && notFoundCall > gate && render > notFoundCall);
});

// -------------------- status cards -------------------------------------------

const counts = {
  preparing_documents: 1,
  ready_to_apply: 1,
  applied: 1,
  accepted: 0,
  rejected: 0,
  closed: 0,
};

test('cards: seven cards in Figma order, saved first, with the real counts', () => {
  const { TrackingStatusCards } = feature('components/TrackingStatusCards.tsx');
  const html = render(
    h(TrackingStatusCards, {
      counts,
      trackedState: 'ready',
      savedCount: 4,
      savedState: 'ready',
    })
  );
  const order = [...html.matchAll(/data-testid="tracking-card-([a-z_]+)"/g)].map((m) => m[1]);
  assert.deepEqual(order, [
    'saved',
    'preparing_documents',
    'ready_to_apply',
    'applied',
    'accepted',
    'rejected',
    'closed',
  ]);
  assert.match(html, /tracking-card-saved"[^>]*>.*?<span[^>]*>4<\/span>/s);
});

test('cards: the saved card takes its number from the saved list, not from tracking', () => {
  const { TrackingStatusCards } = feature('components/TrackingStatusCards.tsx');
  const html = render(
    h(TrackingStatusCards, { counts, trackedState: 'ready', savedCount: 9, savedState: 'ready' })
  );
  const saved = html.split('data-testid="tracking-card-saved"')[1].split('</li>')[0];
  assert.match(saved, />9</);
});

test('cards: a loading or failed section shows a placeholder, never a zero', () => {
  const { TrackingStatusCards } = feature('components/TrackingStatusCards.tsx');
  const loading = render(
    h(TrackingStatusCards, {
      counts: null,
      trackedState: 'loading',
      savedCount: null,
      savedState: 'loading',
    })
  );
  assert.equal((loading.match(/-loading"/g) ?? []).length, 7);
  assert.doesNotMatch(loading, />0</);

  const failed = render(
    h(TrackingStatusCards, {
      counts: null,
      trackedState: 'error',
      savedCount: null,
      savedState: 'error',
    })
  );
  assert.equal((failed.match(/-unavailable"/g) ?? []).length, 7);
  assert.doesNotMatch(failed, />0</);
});

test('cards: sections fail independently (saved ready while tracking failed, and the reverse)', () => {
  const { TrackingStatusCards } = feature('components/TrackingStatusCards.tsx');
  const trackedDown = render(
    h(TrackingStatusCards, {
      counts: null,
      trackedState: 'error',
      savedCount: 3,
      savedState: 'ready',
    })
  );
  assert.match(trackedDown.split('tracking-card-saved"')[1].split('</li>')[0], />3</);
  assert.equal((trackedDown.match(/-unavailable"/g) ?? []).length, 6);

  const savedDown = render(
    h(TrackingStatusCards, { counts, trackedState: 'ready', savedCount: null, savedState: 'error' })
  );
  assert.equal((savedDown.match(/-unavailable"/g) ?? []).length, 1);
  assert.match(savedDown.split('tracking-card-applied"')[1].split('</li>')[0], />1</);
});

test('cards: labels follow the locale and are the Figma Arabic wording', () => {
  const { TrackingStatusCards } = feature('components/TrackingStatusCards.tsx');
  const html = render(
    h(TrackingStatusCards, { counts, trackedState: 'ready', savedCount: 0, savedState: 'ready' }),
    'ar'
  );
  for (const label of [
    'محفوظة / مهتم',
    'تجهيز المستندات',
    'جاهز للتقديم',
    'تم التقديم',
    'مقبول',
    'مرفوض',
    'مغلق',
  ]) {
    assert.ok(html.includes(label), label);
  }
});

// -------------------- card ---------------------------------------------------

test('card: title follows the locale and the meta line has organization, deadline, update', () => {
  const en = renderCard(makeItem(), { locale: 'en' });
  assert.match(en, /Erasmus Mundus Joint Master/);
  assert.match(en, /European Union — Deadline 2026-01-15 — Last updated 2025-10-02/);
  const ar = renderCard(makeItem(), { locale: 'ar' });
  assert.match(ar, /إيراسموس موندوس للماجستير المشترك/);
  assert.match(ar, /European Union — آخر موعد 2026-01-15 — آخر تحديث 2025-10-02/);
});

test('card: the status select offers exactly the six backend statuses and never saved', () => {
  const html = renderCard(makeItem({ status: 'applied' }));
  const values = [...html.matchAll(/<option value="([a-z_]+)"/g)].map((m) => m[1]);
  assert.deepEqual(values, [
    'preparing_documents',
    'ready_to_apply',
    'applied',
    'accepted',
    'rejected',
    'closed',
  ]);
  assert.match(html, /<option value="applied" selected/);
});

test('card: the official link is hidden unless the item carries a safe official URL', () => {
  assert.doesNotMatch(renderCard(makeItem({ officialUrl: null })), /tracking-official-link/);
  const shown = renderCard(makeItem({ officialUrl: 'https://apply.example.org/x' }));
  assert.match(shown, /tracking-official-link/);
  assert.match(shown, /href="https:\/\/apply\.example\.org\/x"/);
  assert.match(shown, /rel="noopener noreferrer"/);
  assert.match(shown, /target="_blank"/);
});

test('card: the scholarship link follows the details flag', () => {
  assert.doesNotMatch(
    renderCard(makeItem(), { detailsEnabled: false }),
    /tracking-scholarship-link/
  );
  const on = renderCard(makeItem(), { detailsEnabled: true });
  assert.match(on, /tracking-scholarship-link/);
  assert.match(on, /href="\/student\/scholarships\/11"/);
});

test('card: no deadline and unreadable timestamps drop their meta parts', () => {
  const html = renderCard(
    makeItem(
      { updatedAt: 'garbage' },
      { no_deadline: true, deadline: null, organization_name: null }
    )
  );
  assert.match(html, /No deadline/);
  assert.doesNotMatch(html, /Last updated/);
  assert.doesNotMatch(html, /Deadline 20/);
});

test('card: a missing title falls back to a neutral label', () => {
  const html = renderCard(makeItem({}, { title: '  ', title_en: null, title_ar: null }));
  assert.match(html, /Untitled scholarship/);
});

test('card: remove and note actions are labelled for assistive tech', () => {
  const html = renderCard(makeItem());
  assert.match(html, /aria-label="Stop tracking Erasmus Mundus Joint Master"/);
  assert.match(html, /aria-label="Edit your note for Erasmus Mundus Joint Master"/);
});

test('note: shows the saved note, or a neutral empty line, in the read state', () => {
  const withNote = renderCard(makeItem({ notes: 'Waiting for the second reference letter' }));
  assert.match(withNote, /Waiting for the second reference letter/);
  assert.match(withNote, />Edit note</);
  const without = renderCard(makeItem({ notes: null }));
  assert.match(without, /No notes yet\./);
  assert.match(without, />Add a note</);
});

// -------------------- presentation helpers -----------------------------------

test('presentation: meta parts keep order and drop what cannot be read', () => {
  const { buildTrackingMeta, trackingMetaParts } = feature('lib/presentation.ts');
  const parts = trackingMetaParts(
    buildTrackingMeta(
      { organization_name: null, university_name: 'MIT', deadline: 'soon', no_deadline: false },
      '2025-10-02T09:15:00'
    )
  );
  assert.deepEqual(parts, [
    { kind: 'organization', value: 'MIT' },
    { kind: 'updated', value: '2025-10-02' },
  ]);
});

test('presentation: the UI-only saved card has presentation but is not a backend status', () => {
  const { statusPresentation } = feature('lib/presentation.ts');
  const { TRACKING_STATUSES } = feature('constants.ts');
  assert.ok(statusPresentation.saved);
  assert.equal(TRACKING_STATUSES.includes('saved'), false);
});

test('notes: length counts code points and the draft state gates saving', () => {
  const { noteLength, getNoteDraftState } = feature('lib/notes.ts');
  assert.equal(noteLength('😀😀'), 2);
  assert.equal(getNoteDraftState('same', 'same'), 'unchanged');
  assert.equal(getNoteDraftState('  same ', 'same'), 'unchanged');
  assert.equal(getNoteDraftState('', null), 'unchanged');
  assert.equal(getNoteDraftState('new', null), 'valid');
  assert.equal(getNoteDraftState('', 'something'), 'valid');
  assert.equal(getNoteDraftState('a'.repeat(2000), null), 'valid');
  assert.equal(getNoteDraftState('a'.repeat(2001), null), 'too-long');
  assert.equal(getNoteDraftState('😀'.repeat(2000), null), 'valid');
});

// -------------------- states -------------------------------------------------

test('states: error reasons come from the status, 403 has no retry and contract errors stay generic', () => {
  const { TrackingErrorState, trackingErrorReason } = feature('components/TrackingStates.tsx');
  const { ApiError } = loadModule(path.join(srcPath, 'lib/api-client.ts'));
  const { TrackingContractError } = feature('lib/errors.ts');
  assert.equal(trackingErrorReason(new ApiError('x', [], 401)), 'unauthorized');
  assert.equal(trackingErrorReason(new ApiError('x', [], 403)), 'forbidden');
  assert.equal(trackingErrorReason(new ApiError('x', [], 500)), 'generic');
  assert.equal(trackingErrorReason(new TrackingContractError('not-array')), 'generic');

  const forbidden = render(
    h(TrackingErrorState, { error: new ApiError('x', [], 403), onRetry: noop })
  );
  assert.doesNotMatch(forbidden, /tracking-error-retry/);
  const generic = render(h(TrackingErrorState, { error: new Error('boom'), onRetry: noop }));
  assert.match(generic, /tracking-error-retry/);
  assert.doesNotMatch(generic, /boom|contract/i);
});

test('states: empty and loading render their own markers', () => {
  const { TrackingEmpty, TrackingLoading } = feature('components/TrackingStates.tsx');
  assert.match(render(h(TrackingEmpty)), /tracking-empty/);
  assert.match(render(h(TrackingLoading)), /tracking-loading/);
  assert.match(render(h(TrackingEmpty)), /href="\/student\/scholarships"/);
});

test('dialog: renders closed with no scholarship and names the scholarship when open', () => {
  const { ConfirmRemoveDialog } = feature('components/ConfirmRemoveDialog.tsx');
  const props = { pending: false, failed: false, onConfirm: noop, onCancel: noop };
  const closed = render(h(ConfirmRemoveDialog, { ...props, title: null }));
  assert.match(closed, /<dialog/);
  assert.doesNotMatch(closed, /“/);
  const open = render(h(ConfirmRemoveDialog, { ...props, title: 'Erasmus' }));
  assert.match(open, /“Erasmus”/);
  const failed = render(h(ConfirmRemoveDialog, { ...props, title: 'Erasmus', failed: true }));
  assert.match(failed, /role="alert"/);
});
