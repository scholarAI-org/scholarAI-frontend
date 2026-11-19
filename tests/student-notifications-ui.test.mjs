import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  React,
  env,
  featurePath,
  loadFeature,
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
