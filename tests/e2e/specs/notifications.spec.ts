import type { Page } from '@playwright/test';
import {
  backendState,
  delayEndpoint,
  failNext,
  notification,
  notificationRequests,
  type SeedNotification,
} from '../support/backend';
import {
  expect,
  LOCALES,
  pageTitle,
  startStudentSession,
  t,
  test,
  type Locale,
} from '../support/fixtures';

// Student Notifications (Feature 011), on the flags-on server where NOTIFICATIONS_ENABLED=true
// and SCHOLARSHIP_DETAILS_ENABLED is empty. flags-off.spec.ts covers the same route switched off.

const MINUTE = 1;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const n = (locale: Locale, key: string, params = {}) =>
  t(locale, `StudentNotifications.${key}`, params);

const list = (page: Page, locale: Locale) =>
  page.getByRole('list', { name: n(locale, 'page.listLabel') });
const cards = (page: Page, locale: Locale) => list(page, locale).getByRole('listitem');

/** One of each type, newest first by `minutes_ago`; the first three are unread. */
const sixTypes = (): SeedNotification[] => [
  notification('profile_incomplete', { minutes_ago: 5 }),
  notification('scholarship_match', { minutes_ago: 40 }),
  notification('deadline_reminder', { minutes_ago: 2 * HOUR }),
  notification('saved_scholarship_updated', { minutes_ago: 2 * DAY, is_read: true }),
  notification('scholarship_archived', { minutes_ago: 5 * DAY, is_read: true }),
  notification('document_analysis_ready', { minutes_ago: 7 * DAY, is_read: true }),
];

async function openNotifications(page: Page, locale: Locale) {
  await page.goto(`/${locale}/student/notifications`);
  await expect(pageTitle(page, locale, 'notifications')).toBeVisible();
}

for (const locale of LOCALES) {
  test.describe(`notification list (${locale})`, () => {
    test('shows all six types newest first with the right copy and the unread style', async ({
      page,
    }) => {
      await startStudentSession(page, {
        notifications: [
          ...sixTypes(),
          // A type this version does not know and a known type with bad params: both skipped.
          notification('mystery_type', { minutes_ago: 10 }),
          notification('deadline_reminder', {
            minutes_ago: 20,
            params: {
              scholarship_id: 7,
              scholarship_title: 'MALFORMED',
              days_left: -1,
              deadline: '2026-09-15',
              reminder_index: 1,
              reminder_total: 2,
            },
          }),
        ],
      });
      await openNotifications(page, locale);

      await expect(cards(page, locale)).toHaveCount(6);
      const titles = [
        n(locale, 'types.profile_incomplete.title'),
        n(locale, 'types.scholarship_match.title'),
        n(locale, 'types.deadline_reminder.title', { title: 'DAAD Scholarship' }),
        n(locale, 'types.saved_scholarship_updated.title'),
        n(locale, 'types.scholarship_archived.title'),
        n(locale, 'types.document_analysis_ready.title'),
      ];
      for (const [index, title] of titles.entries()) {
        await expect(cards(page, locale).nth(index)).toContainText(title);
      }
      await expect(page.getByRole('main')).not.toContainText('MALFORMED');

      // Body copy is built from type and params, never taken from the backend.
      await expect(cards(page, locale).nth(0)).toContainText(
        n(locale, 'types.profile_incomplete.body', { remaining: 18, threshold: 70 })
      );
      await expect(cards(page, locale).nth(1)).toContainText(
        n(locale, 'types.scholarship_match.body', {
          title: 'Erasmus Mundus Joint Masters',
          matched: 4,
          total: 5,
        })
      );
      await expect(cards(page, locale).nth(2)).toContainText(
        n(locale, 'types.deadline_reminder.documents', {
          list: n(locale, 'documents.recommendation_letters'),
        })
      );
      await expect(cards(page, locale).nth(2)).toContainText(
        n(locale, 'time.reminder', { index: 1, total: 2 })
      );
      await expect(cards(page, locale).nth(3)).toContainText(
        n(locale, 'types.saved_scholarship_updated.changes.language_requirement_added', {
          title: 'Chevening',
        })
      );
      await expect(cards(page, locale).nth(4)).toContainText(
        n(locale, 'types.scholarship_archived.body', { title: 'Islamic University 2025' })
      );
      await expect(cards(page, locale).nth(5)).toContainText(
        n(locale, 'types.document_analysis_ready.bodyForScholarship', {
          count: 8,
          title: 'DAAD Scholarship',
        })
      );

      // Unread: orange border and a "New" pill. Read: neither.
      for (const index of [0, 1, 2]) {
        const card = cards(page, locale).nth(index);
        await expect(card).toHaveClass(/border-orange-500/);
        await expect(card.getByTestId('notification-new')).toHaveText(n(locale, 'new'));
      }
      for (const index of [3, 4, 5]) {
        const card = cards(page, locale).nth(index);
        await expect(card).not.toHaveClass(/border-orange-500/);
        await expect(card.getByTestId('notification-new')).toHaveCount(0);
      }

      // Time lines are real <time> elements; the deadline clock is the design's SVG.
      await expect(page.getByRole('main').locator('time')).toHaveCount(6);
      await expect(
        page.locator('[data-notification-icon="deadline_reminder"] img').first()
      ).toBeVisible();

      // Latin digits in both languages.
      expect(await page.getByRole('main').innerText()).not.toMatch(/[٠-٩۰-۹]/);
    });

    test('actions: Complete profile is offered; View waits for the details flag (off here)', async ({
      page,
    }) => {
      await startStudentSession(page, { notifications: sixTypes() });
      await openNotifications(page, locale);

      const profile = cards(page, locale).nth(0).getByRole('link');
      await expect(profile).toHaveText(n(locale, 'actions.completeProfile'));
      await expect(profile).toHaveAttribute('href', /\/student\/profile$/);

      // SCHOLARSHIP_DETAILS_ENABLED is empty on this server, so no scholarship action shows;
      // the card itself is unchanged. open_document_analysis never shows in this release.
      for (const index of [1, 2, 3, 4, 5]) {
        await expect(cards(page, locale).nth(index).getByRole('link')).toHaveCount(0);
      }
      await expect(
        page
          .getByRole('main')
          .getByRole('link', { name: n(locale, 'actions.viewScholarship'), exact: true })
      ).toHaveCount(0);
    });

    test('the header title and description come from the shell messages', async ({ page }) => {
      await startStudentSession(page, { notifications: sixTypes() });
      await openNotifications(page, locale);
      await expect(page.getByRole('banner')).toContainText(
        t(locale, 'StudentLayout.pages.notifications.description')
      );
    });
  });
}

// ----------------------------------------------------------------------------- marking (US2)

const MARK_PATH = /^\/api\/notifications\/\d+\/read$/;

const markRequests = async (email: string) =>
  (await notificationRequests(email)).filter(
    (request) => request.method === 'PATCH' && MARK_PATH.test(request.path)
  );
const readAllRequests = async (email: string) =>
  (await notificationRequests(email)).filter(
    (request) => request.path === '/api/notifications/read-all'
  );
const unreadIds = async (email: string) =>
  (await backendState(email)).notifications.filter((row) => !row.is_read).map((row) => row.id);
const idOfType = async (email: string, type: string) =>
  (await backendState(email)).notifications.find((row) => row.type === type)!.id;

/** The card at `index` and its text button (only unread cards have one). */
const textButton = (page: Page, locale: Locale, index: number) =>
  cards(page, locale).nth(index).locator('button');
const alertText = (page: Page) => page.getByTestId('notifications-mark-error');

for (const locale of LOCALES) {
  test.describe(`marking notifications (${locale})`, () => {
    test('a click reads the card before the server answers, with exactly one PATCH', async ({
      page,
    }) => {
      const user = await startStudentSession(page, { notifications: sixTypes() });
      await delayEndpoint(user.email, 'mark-read', 1500);
      await openNotifications(page, locale);

      const card = cards(page, locale).nth(1);
      await expect(card).toHaveAttribute('data-unread', 'true');
      const target = await idOfType(user.email, 'scholarship_match');
      await textButton(page, locale, 1).dblclick();

      // The PATCH is still waiting on the (delayed) server, and the card already shows as read.
      await expect(card).toHaveAttribute('data-unread', 'false', { timeout: 1000 });
      expect(await unreadIds(user.email)).toContain(target);
      await expect(card.getByTestId('notification-new')).toHaveCount(0);
      await expect(card.locator('button')).toHaveCount(0);

      await expect.poll(async () => unreadIds(user.email)).not.toContain(target);
      // Two clicks, one request; a read card sends nothing more.
      expect(await markRequests(user.email)).toHaveLength(1);
      await card.click();
      expect(await markRequests(user.email)).toHaveLength(1);
      await expect(alertText(page)).toHaveCount(0);
    });

    test('Enter and Space on the unread card mark it read', async ({ page }) => {
      const user = await startStudentSession(page, { notifications: sixTypes() });
      await openNotifications(page, locale);

      await textButton(page, locale, 1).focus();
      await page.keyboard.press('Enter');
      await expect(cards(page, locale).nth(1)).toHaveAttribute('data-unread', 'false');

      await textButton(page, locale, 2).focus();
      await page.keyboard.press('Space');
      await expect(cards(page, locale).nth(2)).toHaveAttribute('data-unread', 'false');

      await expect.poll(async () => (await unreadIds(user.email)).length).toBe(1);
    });

    test('a refused PATCH puts only that card back and says so', async ({ page }) => {
      const user = await startStudentSession(page, { notifications: sixTypes() });
      await delayEndpoint(user.email, 'mark-read', 800);
      await failNext(user.email, 'mark-read', 500);
      await openNotifications(page, locale);

      await textButton(page, locale, 1).click();
      await expect(cards(page, locale).nth(1)).toHaveAttribute('data-unread', 'false');
      // The failure arrives: the card is unread again, the others are untouched, an alert shows.
      await expect(cards(page, locale).nth(1)).toHaveAttribute('data-unread', 'true');
      await expect(cards(page, locale).nth(0)).toHaveAttribute('data-unread', 'true');
      await expect(cards(page, locale).nth(3)).toHaveAttribute('data-unread', 'false');
      await expect(alertText(page)).toHaveText(n(locale, 'markRead.failed'));
      expect((await unreadIds(user.email)).length).toBe(3);

      // It stays until the next mark attempt, which then works.
      await textButton(page, locale, 1).click();
      await expect(alertText(page)).toHaveCount(0);
      await expect(cards(page, locale).nth(1)).toHaveAttribute('data-unread', 'false');
    });

    test('a 404 on a mark means the notification is gone: the card is dropped, no message', async ({
      page,
    }) => {
      const user = await startStudentSession(page, { notifications: sixTypes() });
      await failNext(user.email, 'mark-read', 404);
      await openNotifications(page, locale);

      await textButton(page, locale, 1).click();
      await expect(cards(page, locale)).toHaveCount(5);
      await expect(page.getByRole('main')).not.toContainText(
        n(locale, 'types.scholarship_match.title')
      );
      await expect(alertText(page)).toHaveCount(0);
    });

    test('clicking the action marks the notification read and navigates without waiting', async ({
      page,
    }) => {
      const user = await startStudentSession(page, { notifications: sixTypes() });
      await delayEndpoint(user.email, 'mark-read', 1500);
      await openNotifications(page, locale);
      const target = await idOfType(user.email, 'profile_incomplete');

      await cards(page, locale)
        .nth(0)
        .getByRole('link', { name: n(locale, 'actions.completeProfile') })
        .click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/student/profile`));

      // The PATCH still reaches the server and marks it.
      await expect.poll(async () => unreadIds(user.email), { timeout: 8000 }).not.toContain(target);
      expect(await markRequests(user.email)).toHaveLength(1);
    });

    test('Mark all as read: one PATCH, every card reads, the button goes away', async ({
      page,
    }) => {
      const user = await startStudentSession(page, { notifications: sixTypes() });
      await delayEndpoint(user.email, 'read-all', 1000);
      await openNotifications(page, locale);

      const button = page.getByRole('button', { name: n(locale, 'markAll.label') });
      await expect(button).toBeVisible();
      await button.click();
      // Optimistic: everything reads while the PATCH is still on its way.
      await expect(page.locator('[data-unread="true"]')).toHaveCount(0, { timeout: 800 });
      expect(await unreadIds(user.email)).toHaveLength(3);
      await expect(
        page.getByRole('status').filter({ hasText: n(locale, 'markAll.done') })
      ).toBeVisible();
      await expect(button).toHaveCount(0);

      await expect.poll(async () => unreadIds(user.email)).toHaveLength(0);
      expect(await readAllRequests(user.email)).toHaveLength(1);
      await expect(alertText(page)).toHaveCount(0);
    });

    test('a refused Mark all restores everything and says so', async ({ page }) => {
      const user = await startStudentSession(page, { notifications: sixTypes() });
      await delayEndpoint(user.email, 'read-all', 600);
      await failNext(user.email, 'read-all', 500);
      await openNotifications(page, locale);

      await page.getByRole('button', { name: n(locale, 'markAll.label') }).click();
      await expect(page.locator('[data-unread="true"]')).toHaveCount(0, { timeout: 500 });
      await expect(page.locator('[data-unread="true"]')).toHaveCount(3);
      await expect(alertText(page)).toHaveText(n(locale, 'markAll.failed'));
      await expect(page.getByRole('button', { name: n(locale, 'markAll.label') })).toBeVisible();
      expect(await unreadIds(user.email)).toHaveLength(3);
    });

    test('Mark all is not offered when everything is read', async ({ page }) => {
      await startStudentSession(page, {
        notifications: sixTypes().map((item) => ({ ...item, is_read: true })),
      });
      await openNotifications(page, locale);
      await expect(cards(page, locale)).toHaveCount(6);
      await expect(page.getByRole('button', { name: n(locale, 'markAll.label') })).toHaveCount(0);
      await expect(page.locator('[data-unread="true"]')).toHaveCount(0);
    });
  });
}
