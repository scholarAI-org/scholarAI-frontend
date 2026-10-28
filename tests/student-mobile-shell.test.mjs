import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
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

const layoutPath = fileURLToPath(new URL('../src/features/student/layout', import.meta.url));
const load = (file) => loadModule(path.join(layoutPath, file));

const {
  STUDENT_TAB_BAR_MAX_ITEMS,
  getActiveStudentTabId,
  getStudentTabBarItems,
  studentNavigation,
  studentTabBarOrder,
  withHomeEnabled,
  withSavedEnabled,
  withTrackingEnabled,
} = load('student-navigation.ts');

// Every flag combination the shell can be handed, as the route layout builds it.
const buildItems = ({ home = false, saved = false, tracking = false } = {}) =>
  withTrackingEnabled(withHomeEnabled(withSavedEnabled(studentNavigation, saved), home), tracking);

const idsFor = (flags) => getStudentTabBarItems(buildItems(flags)).map((item) => item.id);

// --- Tab list derives from the sidebar nav config -----------------------------

test('the tab bar draws from the same nav config as the sidebar', () => {
  const items = buildItems({ home: true, saved: true, tracking: true });
  for (const tab of getStudentTabBarItems(items)) {
    const source = items.find((item) => item.id === tab.id);
    assert.ok(source, `${tab.id} is not a nav config item`);
    assert.equal(tab.href, source.href);
    assert.equal(tab.labelKey, source.labelKey);
  }
});

test('the tab order covers every nav item exactly once', () => {
  assert.deepEqual([...studentTabBarOrder].sort(), studentNavigation.map((item) => item.id).sort());
  assert.equal(new Set(studentTabBarOrder).size, studentTabBarOrder.length);
});

test('all flags on shows the five destinations in tab order', () => {
  assert.deepEqual(idsFor({ home: true, saved: true, tracking: true }), [
    'home',
    'scholarships',
    'saved',
    'tracking',
    'profile',
  ]);
});

test('the tab bar never exceeds five items', () => {
  const items = getStudentTabBarItems(buildItems({ home: true, saved: true, tracking: true }));
  assert.equal(STUDENT_TAB_BAR_MAX_ITEMS, 5);
  assert.ok(items.length <= STUDENT_TAB_BAR_MAX_ITEMS, `${items.length} items`);
});

test('all flags off leaves only the two always-on destinations, with no gaps', () => {
  const items = getStudentTabBarItems(buildItems());
  assert.deepEqual(
    items.map((item) => item.id),
    ['scholarships', 'profile']
  );
  assert.ok(
    items.every(Boolean),
    'a disabled item must be dropped, never left as a hole in the list'
  );
});

test('each flag independently adds and removes exactly its own tab', () => {
  assert.deepEqual(idsFor({ home: true }), ['home', 'scholarships', 'profile']);
  assert.deepEqual(idsFor({ saved: true }), ['scholarships', 'saved', 'profile']);
  assert.deepEqual(idsFor({ tracking: true }), ['scholarships', 'tracking', 'profile']);
});

test('a hidden tab keeps the remaining tabs contiguous and in order', () => {
  const ids = idsFor({ home: true, tracking: true });
  assert.deepEqual(ids, ['home', 'scholarships', 'tracking', 'profile']);
  const positions = ids.map((id) => studentTabBarOrder.indexOf(id));
  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b)
  );
});

// --- Active tab ---------------------------------------------------------------

const allOn = buildItems({ home: true, saved: true, tracking: true });

test('each destination marks its own tab active', () => {
  assert.equal(getActiveStudentTabId('/student', allOn), 'home');
  assert.equal(getActiveStudentTabId('/student/scholarships', allOn), 'scholarships');
  assert.equal(getActiveStudentTabId('/student/saved', allOn), 'saved');
  assert.equal(getActiveStudentTabId('/student/tracking', allOn), 'tracking');
  assert.equal(getActiveStudentTabId('/student/profile', allOn), 'profile');
});

test('a sub-route keeps its parent tab active', () => {
  assert.equal(getActiveStudentTabId('/student/scholarships/42', allOn), 'scholarships');
  assert.equal(getActiveStudentTabId('/student/profile/documents', allOn), 'profile');
  assert.equal(getActiveStudentTabId('/student/tracking/7', allOn), 'tracking');
});

test('the home tab matches only the index route, never every /student page', () => {
  assert.equal(getActiveStudentTabId('/student', allOn), 'home');
  assert.notEqual(getActiveStudentTabId('/student/scholarships', allOn), 'home');
  assert.notEqual(getActiveStudentTabId('/student/profile', allOn), 'home');
});

test('a route whose tab is flagged off activates no tab', () => {
  assert.equal(getActiveStudentTabId('/student/saved', buildItems()), null);
  assert.equal(getActiveStudentTabId('/student', buildItems()), null);
  assert.equal(getActiveStudentTabId('/student/tracking', buildItems({ saved: true })), null);
});

test('an unknown route activates no tab', () => {
  assert.equal(getActiveStudentTabId('/student/settings', allOn), null);
  assert.equal(getActiveStudentTabId('/admin/dashboard', allOn), null);
});

test('at most one tab is ever active', () => {
  const paths = [
    '/student',
    '/student/scholarships',
    '/student/scholarships/42',
    '/student/saved',
    '/student/tracking',
    '/student/profile',
    '/student/settings',
  ];
  for (const pathname of paths) {
    const active = getActiveStudentTabId(pathname, allOn);
    const matching = getStudentTabBarItems(allOn).filter((item) => item.id === active);
    assert.ok(matching.length <= 1, `${pathname} matched ${matching.length} tabs`);
  }
});

// --- Labels -------------------------------------------------------------------

const { getStudentCompactTitleKey, studentTabLabelKey } = load('student-navigation.ts');

const readMessages = (locale) =>
  JSON.parse(fs.readFileSync(new URL(`../src/messages/${locale}.json`, import.meta.url), 'utf8'));

const messages = { ar: readMessages('ar'), en: readMessages('en') };

const lookup = (locale, key) =>
  key.split('.').reduce((node, part) => (node == null ? node : node[part]), messages[locale].StudentLayout);

test('every tab has a short label in both locales', () => {
  for (const id of studentTabBarOrder) {
    const key = studentTabLabelKey(id);
    for (const locale of ['ar', 'en']) {
      const label = lookup(locale, key);
      assert.equal(typeof label, 'string', `${locale}.StudentLayout.${key} missing`);
      assert.ok(label.trim(), `${locale}.StudentLayout.${key} is empty`);
    }
  }
});

test('tab labels stay short enough for a five-up bar at 390px', () => {
  for (const id of studentTabBarOrder) {
    for (const locale of ['ar', 'en']) {
      const label = lookup(locale, studentTabLabelKey(id));
      assert.ok(label.length <= 12, `${locale} "${label}" is too long for a tab`);
    }
  }
});

test('the compact top-bar title uses the short nav label for every tab route', () => {
  assert.equal(getStudentCompactTitleKey('/student'), 'nav.home');
  assert.equal(getStudentCompactTitleKey('/student/scholarships'), 'nav.scholarships');
  assert.equal(getStudentCompactTitleKey('/student/saved'), 'nav.saved');
  assert.equal(getStudentCompactTitleKey('/student/tracking'), 'nav.tracking');
  assert.equal(getStudentCompactTitleKey('/student/profile'), 'nav.profile');
});

test('the compact title never resolves to a message that needs a placeholder', () => {
  const paths = [
    '/student',
    '/student/scholarships',
    '/student/scholarships/42',
    '/student/saved',
    '/student/tracking',
    '/student/profile',
  ];
  for (const pathname of paths) {
    const key = getStudentCompactTitleKey(pathname);
    for (const locale of ['ar', 'en']) {
      const message = lookup(locale, key);
      assert.equal(typeof message, 'string', `${locale}.StudentLayout.${key} missing`);
      assert.ok(!message.includes('{'), `${locale}.StudentLayout.${key} needs a placeholder`);
    }
  }
});

test('a sub-page with no tab of its own still gets its own compact title', () => {
  assert.equal(getStudentCompactTitleKey('/student/scholarships/42'), 'pages.scholarshipDetails.title');
});

test('a route outside the student area has no compact title', () => {
  assert.equal(getStudentCompactTitleKey('/admin/dashboard'), null);
  assert.equal(getStudentCompactTitleKey('/login'), null);
});
