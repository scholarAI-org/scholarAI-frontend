import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  React,
  env,
  featurePath,
  loadFeature,
  loadPackage,
  loadSrc,
  messages,
  read,
  render,
  rel,
  sourceFiles,
  srcPath,
  stripComments,
  withEnv,
} from './helpers/notifications-harness.mjs';
import { NOW, raw } from './helpers/notifications-fixtures.mjs';

// Feature 011: Student Notifications. Rendered markup, shell wiring, states, 390px structure,
// i18n and guards. Pure logic and the adapter are in student-notifications.test.mjs.

const { parseNotificationPage } = loadFeature('adapter/parse-page.ts');
const { NotificationCard } = loadFeature('components/NotificationCard.tsx');
const { NotificationsEmpty, NotificationsError, NotificationsLoading } = loadFeature(
  'components/NotificationStates.tsx'
);
const { NOTIFICATION_TYPES } = loadFeature('model/types.ts');
const { NOTIFICATION_REGISTRY } = loadFeature('registry/registry.ts');
const { ApiError } = loadSrc('lib/api-client.ts');
const nav = loadSrc('features/student/layout/student-navigation.ts');

const model = (type, extra = {}) =>
  parseNotificationPage({
    items: [raw(type, extra)],
    total: 1,
    page: 1,
    page_size: 20,
    total_pages: 1,
  }).items[0];

const card = (type, { locale = 'en', extra = {}, detailsEnabled = true, onMarkRead } = {}) =>
  render(
    React.createElement(NotificationCard, {
      notification: model(type, extra),
      now: NOW,
      detailsEnabled,
      onMarkRead,
    }),
    locale
  );

const tn = (locale, key) =>
  key.split('.').reduce((value, part) => value?.[part], messages[locale].StudentNotifications);

const ARABIC_INDIC_DIGITS = /[٠-٩۰-۹]/;

test('harness: the stubs render a translated element in both locales', () => {
  env.locale = 'en';
  assert.ok(messages.en.StudentLayout);
  assert.equal(render(React.createElement('p', null, 'x'), 'en'), '<p>x</p>');
  assert.equal(render(React.createElement('p', null, 'x'), 'ar'), '<p>x</p>');
});

// ----------------------------- US1: the card (FR-013, FR-014, FR-020 to FR-026) ---------

test('US1 card: each of the six types renders its icon box, title and body in en and ar', () => {
  const titles = {
    en: {
      deadline_reminder: 'Deadline approaching: DAAD',
      scholarship_match: 'A new scholarship matches your profile',
      saved_scholarship_updated: 'A saved scholarship was updated',
      scholarship_archived: 'Scholarship archived',
      profile_incomplete: 'Your profile is incomplete',
      document_analysis_ready: 'Your document analysis is ready',
    },
    ar: {
      deadline_reminder: 'موعد نهائي يقترب — DAAD',
      scholarship_match: 'منحة جديدة مطابقة لملفك',
      saved_scholarship_updated: 'تم تحديث منحة محفوظة',
      scholarship_archived: 'منحة مؤرشفة',
      profile_incomplete: 'ملفك الشخصي غير مكتمل',
      document_analysis_ready: 'اكتمل تحليل مستندك',
    },
  };
  for (const locale of ['en', 'ar']) {
    for (const type of NOTIFICATION_TYPES) {
      const html = card(type, { locale });
      assert.ok(html.includes(titles[locale][type]), `${locale} ${type} title`);
      assert.ok(html.includes(`data-notification-icon="${type}"`), `${locale} ${type} icon`);
      assert.ok(html.includes(NOTIFICATION_REGISTRY[type].boxClass), `${locale} ${type} tone`);
      assert.doesNotMatch(html, ARABIC_INDIC_DIGITS, `${locale} ${type} digits`);
      assert.match(html, /<bdi>/, `${locale} ${type} isolates the text`);
    }
  }
  assert.match(
    card('deadline_reminder'),
    /<img[^>]+src="\/images\/student\/notifications\/time-circle\.svg"/
  );
  assert.match(card('scholarship_match'), /<svg/);
});

test('US1 card: unread has the orange border and a New pill, read has neither', () => {
  const unread = card('scholarship_match');
  assert.match(unread, /data-unread="true"/);
  assert.match(unread, /border-orange-500/);
  assert.ok(unread.includes(`>${tn('en', 'new')}<`));
  const read = card('scholarship_match', { extra: { is_read: true } });
  assert.match(read, /data-unread="false"/);
  assert.doesNotMatch(read, /border-orange-500/);
  assert.match(read, /border-\[#e2e8f0\]/);
  assert.ok(!read.includes(`>${tn('en', 'new')}<`));
  assert.ok(card('scholarship_match', { locale: 'ar' }).includes(`>${tn('ar', 'new')}<`));
});

test('US1 card: the time line is a time element with dateTime and the exact time as title', () => {
  const html = card('scholarship_match');
  assert.match(
    html,
    /<time dateTime="2026-11-19T10:00:00Z" title="[^"]*2026[^"]*">2 hours ago<\/time>/
  );
  assert.match(card('deadline_reminder'), /Reminder 1 of 2/);
  assert.doesNotMatch(card('scholarship_match'), /Reminder/);
});

test('US1 card: the action shows only when the backend action and its destination allow it', () => {
  // open_scholarship follows SCHOLARSHIP_DETAILS_ENABLED.
  const on = card('scholarship_match', { detailsEnabled: true });
  assert.match(on, /<a href="\/student\/scholarships\/8"[^>]*>View<\/a>/);
  const off = card('scholarship_match', { detailsEnabled: false });
  assert.doesNotMatch(off, /<a /);
  // open_profile always exists.
  for (const detailsEnabled of [true, false]) {
    assert.match(
      card('profile_incomplete', { detailsEnabled }),
      /<a href="\/student\/profile"[^>]*>Complete profile<\/a>/
    );
  }
  assert.match(card('profile_incomplete', { locale: 'ar' }), />إكمال الملف<\/a>/);
  // open_document_analysis (no page yet), null, and an unknown kind show nothing.
  assert.doesNotMatch(card('document_analysis_ready'), /<a /);
  assert.doesNotMatch(card('scholarship_archived'), /<a /);
  assert.doesNotMatch(card('scholarship_match', { extra: { action: null } }), /<a /);
  assert.doesNotMatch(
    card('scholarship_match', { extra: { action: { type: 'open_somewhere', target_id: 8 } } }),
    /<a /
  );
  // The card itself is unchanged without an action.
  assert.match(
    card('scholarship_match', { detailsEnabled: false }),
    /A new scholarship matches your profile/
  );
});

test('US1 card: an unread card is a button with a Mark as read description, a read one is not', () => {
  const onMarkRead = () => {};
  const unread = card('scholarship_match', { onMarkRead });
  const button = /<button type="button"([^>]*)>([\s\S]*?)<\/button>/.exec(unread);
  assert.ok(button, 'an unread card has a button');
  assert.match(button[1], /aria-describedby="([^"]+)"/);
  const hintId = /aria-describedby="([^"]+)"/.exec(button[1])[1];
  assert.match(unread, new RegExp(`<span id="${hintId}" class="sr-only">Mark as read</span>`));
  assert.ok(button[2].includes('A new scholarship matches your profile'));
  // The action is a sibling of the button, never nested in it, and the button holds only phrasing content.
  assert.doesNotMatch(button[2], /<a |<div|<p |<ul|<li/);
  assert.match(unread, /<\/button>[\s\S]*<a href="\/student\/scholarships\/8"/);

  assert.doesNotMatch(
    card('scholarship_match', { extra: { is_read: true }, onMarkRead }),
    /<button/
  );
  assert.doesNotMatch(card('scholarship_match'), /<button/, 'display-only without a handler');
  assert.ok(
    card('scholarship_match', { locale: 'ar', onMarkRead }).includes(
      `>${tn('ar', 'markRead.hint')}</span>`
    )
  );
});

test('US1 card: nothing the backend sends is shown as a sentence', () => {
  const html = card('scholarship_archived', {
    extra: { title: 'SERVER SENTENCE', message: 'SERVER SENTENCE', body: 'SERVER SENTENCE' },
  });
  assert.doesNotMatch(html, /SERVER SENTENCE/);
});

test('US1 card: every control has a visible focus style and uses logical properties only', () => {
  const html = card('profile_incomplete', { onMarkRead: () => {} });
  for (const element of html.match(/<(button|a)\b[^>]*>/g)) {
    assert.match(element, /focus-visible:outline-orange-500/, element);
  }
  assert.doesNotMatch(html, /\b(rtl|ltr):/);
  assert.doesNotMatch(html, /[\s"](ml|mr|pl|pr|left|right|-ml|-mr)-[\w[]/);
  assert.doesNotMatch(html, /\btext-(left|right)\b/);
  assert.match(html, /text-start/);
});

// ----------------------------- US1: the states ---------------------------------------------

test('US1 states: loading has skeletons and a status message, empty has a heading and a link', () => {
  const loading = render(React.createElement(NotificationsLoading), 'en');
  assert.match(loading, /role="status"[^>]*>Loading notifications…</);
  assert.match(loading, /data-testid="notifications-loading"/);
  assert.equal((loading.match(/animate-pulse/g) ?? []).length, 3);

  const empty = render(React.createElement(NotificationsEmpty), 'en');
  assert.match(empty, /<h2[^>]*>No notifications yet<\/h2>/);
  assert.match(empty, /<a href="\/student\/scholarships"[^>]*>Search scholarships<\/a>/);
  assert.match(empty, /min-h-11/);
  assert.ok(render(React.createElement(NotificationsEmpty), 'ar').includes('لا توجد إشعارات بعد'));
});

test('US1 states: the error reasons follow the Saved and Tracking pages', () => {
  const error = (status) =>
    render(
      React.createElement(NotificationsError, {
        error: new ApiError('x', [], status),
        onRetry() {},
      }),
      'en'
    );
  const unauthorized = error(401);
  assert.match(unauthorized, /role="alert"/);
  assert.match(unauthorized, /data-notifications-error-reason="unauthorized"/);
  assert.match(unauthorized, /Your session has expired/);
  assert.match(unauthorized, /Try again/);
  const forbidden = error(403);
  assert.match(forbidden, /data-notifications-error-reason="forbidden"/);
  assert.doesNotMatch(forbidden, /<button/, 'no Retry when access is unavailable');
  for (const status of [404, 500, undefined]) {
    const generic = error(status);
    assert.match(generic, /data-notifications-error-reason="generic"/);
    assert.match(generic, /We could not load your notifications\./);
    assert.match(generic, /<button/);
    assert.match(generic, /min-h-11/);
  }
  // The backend's own text is never shown.
  assert.doesNotMatch(
    render(
      React.createElement(NotificationsError, {
        error: new ApiError('BACKEND SECRET', [], 500),
        onRetry() {},
      }),
      'en'
    ),
    /BACKEND SECRET/
  );
});

// ----------------------------- US1: route and header ---------------------------------------

test('US1 route: flag off is the 404 before any rendering, flag on renders the page', () => {
  const Page = loadSrc('app/[locale]/student/notifications/page.tsx').default;
  withEnv({ NOTIFICATIONS_ENABLED: undefined }, () => {
    assert.throws(
      () => Page(),
      (error) => String(error?.digest ?? error?.message).includes('404'),
      'the page must call notFound() when the flag is off'
    );
  });
  withEnv({ NOTIFICATIONS_ENABLED: 'true', SCHOLARSHIP_DETAILS_ENABLED: undefined }, () => {
    const element = Page();
    assert.equal(element.type.name, 'NotificationsPage');
    assert.equal(element.props.detailsEnabled, false);
  });
  withEnv({ NOTIFICATIONS_ENABLED: 'true', SCHOLARSHIP_DETAILS_ENABLED: 'true' }, () => {
    assert.equal(Page().props.detailsEnabled, true);
  });
  const source = stripComments(read('src/app/[locale]/student/notifications/page.tsx'));
  assert.match(source, /featureFlags\.notificationsEnabled/);
  assert.ok(source.indexOf('notFound()') < source.indexOf('<NotificationsPage'));
  assert.doesNotMatch(source, /^['"]use client['"]/m, 'a Server Component');
});

test('US1 route: the page renders its loading state first, without a request', () => {
  const { NotificationsPage } = loadFeature('components/NotificationsPage.tsx');
  const html = render(React.createElement(NotificationsPage, { detailsEnabled: false }), 'en');
  assert.match(html, /data-testid="notifications-loading"/);
});

test('US1 header: the route has a page key, a title and a description in both languages', () => {
  assert.equal(nav.getStudentPageKey('/student/notifications'), 'notifications');
  assert.equal(nav.getStudentPageKey('/student/notifications/anything'), 'notifications');
  assert.equal(nav.getStudentPageKey('/student/notificationsx'), null);
  // A page without a tab uses its own title in the compact bar.
  assert.equal(
    nav.getStudentCompactTitleKey('/student/notifications'),
    'pages.notifications.title'
  );
  assert.equal(messages.en.StudentLayout.pages.notifications.title, 'Notifications center');
  assert.equal(messages.ar.StudentLayout.pages.notifications.title, 'مركز التنبيهات والإشعارات');
  for (const locale of ['en', 'ar']) {
    assert.ok(messages[locale].StudentLayout.pages.notifications.description);
    assert.ok(messages[locale].StudentLayout.nav.notifications);
  }
});

test('US1 files: the feature has no hidden dependency on tests, scripts or fixtures', () => {
  const offenders = sourceFiles(featurePath)
    .filter((file) =>
      /from ['"](\.\.\/)+(tests|scripts|fixtures)|@\/(tests|scripts|fixtures)/.test(read(rel(file)))
    )
    .map(rel);
  assert.deepEqual(offenders, []);
  void fs;
  void path;
  void srcPath;
});

// ----------------------------- US2: mark all and the page wiring (FR-015, FR-033 to FR-038) ----

const { MarkAllReadButton } = loadFeature('components/MarkAllReadButton.tsx');

test('US2 mark all: an outlined pill with the label, a double check and a 44px target', () => {
  const html = render(
    React.createElement(MarkAllReadButton, { onClick() {}, disabled: false }),
    'en'
  );
  assert.match(html, /<button type="button"/);
  assert.match(html, /<span>Mark all as read<\/span>/);
  assert.match(html, /<svg/, 'the double-check icon');
  assert.match(html, /min-h-11/);
  assert.match(html, /rounded-full border border-\[#e2e8f0\]/);
  assert.match(html, /focus-visible:outline-orange-500/);
  assert.doesNotMatch(html, /\sdisabled(=|>)/);
  const disabled = render(
    React.createElement(MarkAllReadButton, { onClick() {}, disabled: true }),
    'en'
  );
  assert.match(disabled, /\sdisabled=""/);
  assert.ok(
    render(
      React.createElement(MarkAllReadButton, { onClick() {}, disabled: false }),
      'ar'
    ).includes(`<span>${messages.ar.StudentNotifications.markAll.label}</span>`)
  );
  assert.doesNotMatch(html, /\b(rtl|ltr):|[\s"](ml|mr|pl|pr)-/);
});

test('US2 page: mark all shows while something is unread, and the messages are role-tagged', () => {
  const page = stripComments(
    read('src/features/student/notifications/components/NotificationsPage.tsx')
  );
  // Offered while a loaded card is unread or the count says so, whether or not the count loaded.
  assert.match(page, /hasUnread\(list\.data\)\s*\|\|\s*\(count \?\? 0\) > 0/);
  assert.match(page, /disabled=\{markingAll\}/);
  // A persistent live region for the success message, an alert for failures.
  assert.match(page, /role="status"[\s\S]*markAll\.done/);
  assert.match(page, /role="alert"[\s\S]*markRead\.failed[\s\S]*markAll\.failed/);
  // Each attempt clears the previous message (it stays until the next attempt).
  assert.equal((page.match(/setFeedback\(null\)/g) ?? []).length, 2);
  // The cards get the handler, the action link marks through the same handler.
  assert.match(page, /onMarkRead=\{/);
  const card = stripComments(
    read('src/features/student/notifications/components/NotificationCard.tsx')
  );
  assert.match(card, /onClick=\{markRead\}/);
  assert.doesNotMatch(card, /preventDefault/, 'navigation is never delayed by the mark');
});

test('US2 messages: success has no number, failures say what to do, both languages', () => {
  for (const locale of ['en', 'ar']) {
    const copy = messages[locale].StudentNotifications;
    assert.doesNotMatch(copy.markAll.done, /[{}\d]/, `${locale} done has no number`);
    assert.ok(copy.markAll.failed && copy.markRead.failed && copy.markRead.hint);
  }
});

// ----------------------------- US3: shell, badge, bell (FR-040 to FR-045) --------------------

const { QueryClient } = loadPackage('@tanstack/react-query');
const { StudentSidebar } = loadSrc('features/student/layout/StudentSidebar.tsx');
const { NotificationsNavBadge } = loadFeature('components/NotificationsNavBadge.tsx');
const { NotificationsBell } = loadFeature('components/NotificationsBell.tsx');
const { NotificationBell } = loadSrc('features/student/home/components/NotificationBell.tsx');
const { StatCards } = loadSrc('features/student/home/components/StatCards.tsx');

const COUNT_KEY = ['student-home', 'notifications', 'real'];

// A client whose unread-count cache holds `count` (undefined: not loaded) or a stopped state.
function clientWith({ count, stoppedBy } = {}) {
  const client = new QueryClient();
  if (count !== undefined) client.setQueryData(COUNT_KEY, { unreadCount: count });
  if (stoppedBy) {
    const query = client.getQueryCache().build(client, { queryKey: COUNT_KEY });
    query.setState({
      ...query.state,
      status: 'error',
      fetchStatus: 'idle',
      error: new ApiError('x', [], stoppedBy),
    });
  }
  return client;
}

const sidebar = (items, { pathname = '/student/profile', badges } = {}) => {
  env.pathname = pathname;
  return render(React.createElement(StudentSidebar, { items, navigationBadges: badges }), 'en');
};

test('US3 shell: the Notifications item shows only with the flag, leads Personal, and is active on its page', () => {
  const off = sidebar(nav.studentNavigation);
  assert.doesNotMatch(off, /\/student\/notifications/);

  const items = nav.withNotificationsEnabled(nav.studentNavigation, true);
  const html = sidebar(items, { pathname: '/student/notifications' });
  assert.match(html, /<a href="\/student\/notifications"[^>]*aria-current="page"[^>]*>/);
  assert.match(html, /border-s-4 border-orange-500/);
  assert.match(html, />Notifications<\/span>/);
  assert.ok(
    html.indexOf('href="/student/notifications"') < html.indexOf('href="/student/profile"'),
    'Notifications comes before Profile'
  );
  // A sub-route keeps it active; another page does not.
  assert.match(
    sidebar(items, { pathname: '/student/notifications/anything' }),
    /<a href="\/student\/notifications"[^>]*aria-current="page"/
  );
  assert.doesNotMatch(
    sidebar(items, { pathname: '/student/profile' }),
    /<a href="\/student\/notifications"[^>]*aria-current/
  );
  assert.equal(
    messages.ar.StudentLayout.nav.notifications,
    'الإشعارات',
    'the Arabic label follows the design'
  );
});

test('US3 shell: the badge slot renders at the end of that item only', () => {
  const items = nav.withNotificationsEnabled(nav.studentNavigation, true);
  const html = sidebar(items, {
    badges: { notifications: React.createElement('span', { 'data-slot': 'badge' }, '3') },
  });
  const link = /<a href="\/student\/notifications"[^>]*>([\s\S]*?)<\/a>/.exec(html);
  assert.ok(link, 'the item renders');
  assert.match(link[1], /<span>Notifications<\/span><span data-slot="badge">3<\/span>$/);
  assert.equal((html.match(/data-slot="badge"/g) ?? []).length, 1);
});

test('US3 badge: nothing for no count, 0 or a stopped count; the number, then 99+', () => {
  const badge = (options, locale = 'en') =>
    render(React.createElement(NotificationsNavBadge), locale, clientWith(options));
  assert.equal(badge({}), '', 'not loaded: no invented number');
  assert.equal(badge({ count: 0 }), '');
  for (const status of [401, 403, 404]) {
    assert.equal(badge({ count: 3, stoppedBy: status }), '', `stopped by ${status}`);
  }
  const three = badge({ count: 3 });
  assert.match(three, /data-testid="notifications-badge"/);
  assert.match(three, /<span aria-hidden="true">3<\/span>/);
  assert.match(three, /<span class="sr-only">3 unread<\/span>/);
  assert.match(three, /ms-auto/);
  assert.match(badge({ count: 99 }), /aria-hidden="true">99</);
  const many = badge({ count: 100 });
  assert.match(many, /aria-hidden="true">99\+</);
  assert.match(many, /sr-only">100 unread</, 'the hidden text keeps the real number');
  const arabic = badge({ count: 3 }, 'ar');
  assert.match(arabic, /sr-only">3 غير مقروءة</);
  assert.doesNotMatch(arabic, ARABIC_INDIC_DIGITS);
});

test('US3 bell: a link to the center with a dot only while something is unread', () => {
  env.pathname = '/student/profile';
  const bell = (options, props = {}) =>
    render(React.createElement(NotificationsBell, props), 'en', clientWith(options));

  const three = bell({ count: 3 });
  assert.match(three, /<a href="\/student\/notifications"/);
  assert.match(three, /aria-label="3 unread notifications"/);
  assert.match(three, /data-bell-dot/);
  assert.doesNotMatch(three, /aria-current/);

  assert.doesNotMatch(bell({ count: 0 }), /data-bell-dot/);
  assert.doesNotMatch(bell({}), /data-bell-dot/, 'no dot before the count loads');
  assert.doesNotMatch(bell({ count: 5, stoppedBy: 404 }), /data-bell-dot/, 'no dot once stopped');
  // The link stays when the count is unavailable: the page is still reachable.
  assert.match(bell({ count: 5, stoppedBy: 403 }), /<a href="\/student\/notifications"/);

  env.pathname = '/student/notifications';
  assert.match(bell({ count: 1 }), /aria-current="page"/);
  env.pathname = '/student/profile';

  // The compact bell is a 44px target below sm (32px from sm), with the dot moved to match.
  const compact = bell({ count: 2 }, { size: 'compact' });
  assert.match(compact, /size-11 sm:size-8/);
  assert.match(compact, /end-3 top-3 sm:end-1\.5 sm:top-1\.5/);
  assert.match(bell({ count: 2 }), /size-8/);
});

test("US3 bell: Home's own bell is unchanged without an href (an indicator, not a link)", () => {
  const html = render(React.createElement(NotificationBell, { unreadCount: 2 }), 'en');
  assert.match(html, /^<span role="img" aria-label="2 unread notifications"/);
  assert.match(html, /size-8/);
  assert.match(html, /data-bell-dot/);
  assert.doesNotMatch(html, /<a /);
  assert.doesNotMatch(
    render(React.createElement(NotificationBell, { unreadCount: null }), 'en'),
    /data-bell-dot/
  );
});

test('US3 Home: the unread card links to the center only when it is given a destination', () => {
  const cards = (href) =>
    render(
      React.createElement(StatCards, {
        notifications: { state: 'ready', value: 3, href },
        saved: { state: 'ready', value: 1 },
        inProgress: { state: 'ready', value: 2 },
        upcoming: { state: 'ready', value: 0 },
      }),
      'en'
    );
  assert.match(cards('/student/notifications'), /<a href="\/student\/notifications"/);
  assert.doesNotMatch(cards(null), /<a href="\/student\/notifications"/);
});

// ----------------------------- US3: wiring (FR-040, plan decisions 11 and 12) ----------------

// Every element of a React tree, depth first (the layout is a Server Component: calling it gives
// elements that were never rendered).
function elements(node, found = []) {
  if (Array.isArray(node)) node.forEach((child) => elements(child, found));
  else if (node && typeof node === 'object' && 'props' in node) {
    found.push(node);
    elements(node.props.children, found);
  }
  return found;
}
const named = (tree, name) => tree.filter((element) => element.type?.name === name);

test('US3 layout: with the flag on it mounts the poller inside RoleGuard and hands the shell its nodes', () => {
  const Layout = loadSrc('app/[locale]/student/layout.tsx').default;
  withEnv({ NOTIFICATIONS_ENABLED: 'true', STUDENT_HOME_ENABLED: undefined }, () => {
    const tree = elements(Layout({ children: React.createElement('p') }));
    const shell = named(tree, 'StudentShell')[0];
    assert.equal(shell.props.notificationsEnabled, true);
    assert.equal(shell.props.navigationBadges.notifications.type.name, 'NotificationsNavBadge');
    assert.equal(shell.props.headerActions.type.name, 'NotificationsBell');
    const guard = tree.find((element) => element.type?.name === 'RoleGuard');
    const kids = [guard.props.children].flat();
    assert.equal(kids[0].type.name, 'NotificationsCountDriver', 'the poller sits inside RoleGuard');
    assert.equal(kids[1].type.name, 'StudentShell');
  });
});

test('US3 layout: with the flag off nothing of the feature is mounted or passed down', () => {
  const Layout = loadSrc('app/[locale]/student/layout.tsx').default;
  for (const home of [undefined, 'true']) {
    withEnv({ NOTIFICATIONS_ENABLED: undefined, STUDENT_HOME_ENABLED: home }, () => {
      const tree = elements(Layout({ children: React.createElement('p') }));
      const shell = named(tree, 'StudentShell')[0];
      assert.equal(shell.props.notificationsEnabled, false);
      assert.equal(shell.props.navigationBadges, undefined);
      for (const name of [
        'NotificationsCountDriver',
        'NotificationsNavBadge',
        'NotificationsBell',
      ]) {
        assert.equal(named(tree, name).length, 0, name);
      }
      // Home keeps its own indicator (and its demo source) exactly as before.
      assert.equal(
        shell.props.headerActions?.type?.name,
        home ? 'HomeNotificationBell' : undefined
      );
    });
  }
});

test('US3 Home route: the page gets the flag as a prop', () => {
  const Page = loadSrc('app/[locale]/student/page.tsx').default;
  withEnv({ STUDENT_HOME_ENABLED: 'true', NOTIFICATIONS_ENABLED: 'true' }, () => {
    assert.equal(Page().props.notificationsEnabled, true);
  });
  withEnv({ STUDENT_HOME_ENABLED: 'true', NOTIFICATIONS_ENABLED: undefined }, () => {
    assert.equal(Page().props.notificationsEnabled, false);
  });
});

test('US3 guards: the shell never imports a feature, and Home is touched by three files only', () => {
  const shellFiles = sourceFiles(path.join(srcPath, 'features/student/layout')).map(rel);
  assert.ok(shellFiles.length >= 10);
  for (const file of shellFiles) {
    assert.doesNotMatch(
      read(file),
      /features\/student\/(home|notifications)/,
      `${file} must stay generic`
    );
  }
  const importsHome = sourceFiles(featurePath)
    .filter((file) => /from ['"]@\/features\/student\/home/.test(read(rel(file))))
    .map((file) => path.relative(featurePath, file).replaceAll('\\', '/'))
    .sort();
  assert.deepEqual(importsHome, [
    'components/NotificationsBell.tsx',
    'lib/relative-time.ts',
    'lib/unread-source.ts',
  ]);
  // The data abstraction (source, query key, factory) is reached through one file.
  const dataImports = sourceFiles(featurePath)
    .filter((file) =>
      /from ['"]@\/features\/student\/home\/(hooks\/useHomeSources|lib\/source-query|query-keys|sources)/.test(
        read(rel(file))
      )
    )
    .map((file) => path.relative(featurePath, file).replaceAll('\\', '/'));
  assert.deepEqual(dataImports, ['lib/unread-source.ts']);
});

test('US3 tab bar: still the same five destinations, in the same order', () => {
  assert.deepEqual(nav.studentTabBarOrder, [
    'home',
    'scholarships',
    'saved',
    'tracking',
    'profile',
  ]);
  const everything = nav.studentNavigation.map((item) => ({ ...item, enabled: true }));
  assert.deepEqual(
    nav.getStudentTabBarItems(everything).map((item) => item.id),
    ['home', 'scholarships', 'saved', 'tracking', 'profile']
  );
});
