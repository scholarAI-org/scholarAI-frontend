import type { Page } from '@playwright/test';
import {
  addNotifications,
  backendRequests,
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
  sidebar,
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

// ----------------------------------------------------------------------------- pagination and states (US5)

/** `count` notifications, newest first: "Scholarship 0" is the newest. */
const many = (count: number, firstMinutesAgo = 0): SeedNotification[] =>
  Array.from({ length: count }, (_, index) =>
    notification('scholarship_archived', {
      minutes_ago: firstMinutesAgo + index,
      params: { scholarship_id: 10, scholarship_title: `Scholarship ${firstMinutesAgo + index}` },
    })
  );

const listRequests = async (email: string) =>
  (await notificationRequests(email)).filter((request) => request.path === '/api/notifications');
const loadMore = (page: Page) => page.getByTestId('notifications-load-more');
const cardIds = (page: Page, locale: Locale) =>
  cards(page, locale).evaluateAll((items) =>
    items.map((item) => item.getAttribute('data-notification-id'))
  );

for (const locale of LOCALES) {
  test.describe(`pagination and states (${locale})`, () => {
    test('Load more adds the next page without duplicates and disappears after the last', async ({
      page,
    }) => {
      const user = await startStudentSession(page, { notifications: many(45) });
      await openNotifications(page, locale);

      await expect(cards(page, locale)).toHaveCount(20);
      await expect(cards(page, locale).first()).toContainText('Scholarship 0');
      await expect(loadMore(page)).toBeVisible();
      await loadMore(page).click();
      await expect(cards(page, locale)).toHaveCount(40);
      await loadMore(page).click();
      await expect(cards(page, locale)).toHaveCount(45);
      await expect(loadMore(page)).toHaveCount(0);

      const ids = await cardIds(page, locale);
      expect(new Set(ids).size).toBe(45);
      await expect(cards(page, locale).last()).toContainText('Scholarship 44');

      const requested = await listRequests(user.email);
      expect(requested.map((request) => request.query.page)).toEqual(['1', '2', '3']);
      expect(requested.every((request) => request.query.page_size === '20')).toBe(true);
      expect(requested.every((request) => !('is_read' in request.query))).toBe(true);
    });

    test('an item added between pages shifts them, and nothing is shown twice', async ({
      page,
    }) => {
      const user = await startStudentSession(page, { notifications: many(25, 10) });
      await openNotifications(page, locale);
      await expect(cards(page, locale)).toHaveCount(20);

      // A newer notification pushes the last card of page 1 onto page 2.
      await addNotifications(user.email, [notification('profile_incomplete', { minutes_ago: 0 })]);
      await loadMore(page).click();
      await expect(cards(page, locale)).toHaveCount(25);
      expect(new Set(await cardIds(page, locale)).size).toBe(25);
      await expect(loadMore(page)).toHaveCount(0);
    });

    test('loading shows skeleton cards and a status message first', async ({ page }) => {
      const user = await startStudentSession(page, { notifications: many(3) });
      await delayEndpoint(user.email, 'list', 1500);
      await page.goto(`/${locale}/student/notifications`);

      await expect(page.getByTestId('notifications-loading')).toBeVisible();
      await expect(
        page.getByRole('status').filter({ hasText: n(locale, 'page.loading') })
      ).toBeAttached();
      await expect(cards(page, locale)).toHaveCount(3);
      await expect(page.getByTestId('notifications-loading')).toHaveCount(0);
    });

    test('a student with nothing sees the empty state and a way forward', async ({ page }) => {
      await startStudentSession(page);
      await openNotifications(page, locale);
      const empty = page.getByTestId('notifications-empty');
      await expect(empty.getByRole('heading', { name: n(locale, 'empty.heading') })).toBeVisible();
      await expect(empty).toContainText(n(locale, 'empty.body'));
      await expect(empty.getByRole('link', { name: n(locale, 'empty.cta') })).toHaveAttribute(
        'href',
        new RegExp(`/${locale}/student/scholarships$`)
      );
      await expect(page.getByRole('button', { name: n(locale, 'markAll.label') })).toHaveCount(0);
      await expect(list(page, locale)).toHaveCount(0);
    });

    test('a first-page failure shows the error with Retry, and Retry recovers', async ({
      page,
    }) => {
      const user = await startStudentSession(page, { notifications: many(3) });
      // A 5xx is retried twice before it is shown, so three failures reach the student.
      await failNext(user.email, 'list', 500, 3);
      await openNotifications(page, locale);

      const error = page.getByTestId('notifications-error');
      await expect(error).toHaveAttribute('data-notifications-error-reason', 'generic', {
        timeout: 15_000,
      });
      await expect(error).toContainText(n(locale, 'errors.generic'));
      await expect(page.getByTestId('notifications-empty')).toHaveCount(0);
      await error.getByRole('button', { name: n(locale, 'errors.retry') }).click();
      await expect(cards(page, locale)).toHaveCount(3);
      await expect(page.getByTestId('notifications-error')).toHaveCount(0);
    });

    test('a 401 says the session expired and re-checks the session; a 403 has no Retry', async ({
      page,
    }) => {
      const user = await startStudentSession(page, { notifications: many(3) });
      await failNext(user.email, 'list', 401, 1);
      await openNotifications(page, locale);
      const error = page.getByTestId('notifications-error');
      await expect(error).toHaveAttribute('data-notifications-error-reason', 'unauthorized');
      await expect(error).toContainText(n(locale, 'errors.unauthorized'));
      await expect(error.getByRole('button')).toHaveCount(1);
      // The current-user query was asked again (the shell's own check plus the re-check).
      await expect
        .poll(async () => (await backendRequests(user.email, '/auth/me')).length)
        .toBeGreaterThanOrEqual(2);

      await failNext(user.email, 'list', 403, 1);
      await error.getByRole('button', { name: n(locale, 'errors.retry') }).click();
      await expect(error).toHaveAttribute('data-notifications-error-reason', 'forbidden');
      await expect(error).toContainText(n(locale, 'errors.forbidden'));
      await expect(error.getByRole('button')).toHaveCount(0);
    });

    test('a 404 on the list is the generic error and Retry works', async ({ page }) => {
      const user = await startStudentSession(page, { notifications: many(2) });
      await failNext(user.email, 'list', 404, 1);
      await openNotifications(page, locale);
      const error = page.getByTestId('notifications-error');
      await expect(error).toHaveAttribute('data-notifications-error-reason', 'generic');
      await error.getByRole('button', { name: n(locale, 'errors.retry') }).click();
      await expect(cards(page, locale)).toHaveCount(2);
    });

    test('a later page that fails keeps the loaded cards and offers its own Retry', async ({
      page,
    }) => {
      const user = await startStudentSession(page, { notifications: many(45) });
      await openNotifications(page, locale);
      await expect(cards(page, locale)).toHaveCount(20);

      await failNext(user.email, 'list', 500, 3);
      await loadMore(page).click();
      const error = page.getByTestId('notifications-load-more-error');
      await expect(error).toContainText(n(locale, 'errors.loadMoreFailed'), { timeout: 15_000 });
      await expect(cards(page, locale)).toHaveCount(20);
      await expect(loadMore(page)).toHaveCount(0);

      await page.getByTestId('notifications-load-more-retry').click();
      await expect(cards(page, locale)).toHaveCount(40);
      await expect(page.getByTestId('notifications-load-more-error')).toHaveCount(0);
      await expect(loadMore(page)).toBeVisible();
    });

    test('Retry on the list also restarts a count that had stopped', async ({ page }) => {
      const user = await startStudentSession(page, { notifications: rowsOf(3) });
      await failNext(user.email, 'unread-count', 404, 1);
      await failNext(user.email, 'list', 500, 3);
      await openNotifications(page, locale);

      const error = page.getByTestId('notifications-error');
      await expect(error).toBeVisible({ timeout: 15_000 });
      await expect(sidebar(page, locale).getByTestId('notifications-badge')).toHaveCount(0);

      await error.getByRole('button', { name: n(locale, 'errors.retry') }).click();
      await expect(cards(page, locale)).toHaveCount(3);
      await expect(sidebar(page, locale).getByTestId('notifications-badge')).toHaveText(/^3/);
    });

    test('a page of skipped items still offers Load more; the empty state waits for the last page', async ({
      page,
    }) => {
      // The 20 newest are of a type this version does not know; five renderable ones follow.
      await startStudentSession(page, {
        notifications: [
          ...Array.from({ length: 20 }, (_, index) =>
            notification('mystery_type', { minutes_ago: index })
          ),
          ...many(5, 100),
        ],
      });
      await openNotifications(page, locale);
      await expect(loadMore(page)).toBeVisible();
      await expect(cards(page, locale)).toHaveCount(0);
      await expect(page.getByTestId('notifications-empty')).toHaveCount(0);

      await loadMore(page).click();
      await expect(cards(page, locale)).toHaveCount(5);
      await expect(loadMore(page)).toHaveCount(0);
    });

    test('only skipped items on the last page is the empty state', async ({ page }) => {
      await startStudentSession(page, {
        notifications: [notification('mystery_type', { minutes_ago: 1 })],
      });
      await openNotifications(page, locale);
      await expect(page.getByTestId('notifications-empty')).toBeVisible();
      await expect(loadMore(page)).toHaveCount(0);
    });
  });
}

/** Unread rows for the count tests. */
function rowsOf(unread: number): SeedNotification[] {
  return Array.from({ length: unread }, (_, index) =>
    notification('scholarship_match', { minutes_ago: 5 + index })
  );
}

// ----------------------------------------------------------------------------- the phone (US6)

const PHONE = { width: 390, height: 844 };
const TABLET = { width: 768, height: 1024 };

const LONG_TITLE =
  'A very long scholarship title that goes on and on and on without any natural break so that it has to wrap or clamp inside the card on a phone screen';

/** The compact top bar's bell: the visible one (the desktop group is hidden below lg). */
const visibleBell = (page: Page) => page.locator('a[data-notifications-bell]:visible');
const tabBar = (page: Page, locale: Locale) =>
  page.getByRole('navigation', { name: t(locale, 'StudentLayout.tabBarLabel') });

const hasNoHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

for (const locale of LOCALES) {
  test.describe(`on a phone (${locale})`, () => {
    test('the top bar has the bell with its dot, and it opens the notification center', async ({
      page,
    }) => {
      await startStudentSession(page, { notifications: sixTypes() });
      await page.setViewportSize(PHONE);
      await page.goto(`/${locale}/student/profile`);

      const bell = visibleBell(page);
      await expect(bell).toHaveCount(1);
      await expect(bell.locator('[data-bell-dot]')).toBeVisible();
      await expect(bell).toHaveAttribute(
        'aria-label',
        t(locale, 'StudentHome.bell.label', { count: 3 })
      );
      // A 44px touch target.
      const box = (await bell.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);

      await bell.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/student/notifications$`));
      await expect(cards(page, locale)).toHaveCount(6);
      await expect(visibleBell(page)).toHaveAttribute('aria-current', 'page');
    });

    test('the account menu has a Notifications link', async ({ page }) => {
      await startStudentSession(page, { notifications: sixTypes() });
      await page.setViewportSize(PHONE);
      await page.goto(`/${locale}/student/profile`);

      await page.getByRole('button', { name: t(locale, 'StudentLayout.userMenu.label') }).click();
      const link = page.getByRole('menuitem', {
        name: t(locale, 'StudentLayout.userMenu.notifications'),
      });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', new RegExp(`/${locale}/student/notifications$`));
      const box = (await link.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/student/notifications$`));
    });

    test('the tab bar still has the same five destinations', async ({ page }) => {
      await startStudentSession(page, { notifications: sixTypes() });
      await page.setViewportSize(PHONE);
      await page.goto(`/${locale}/student/notifications`);

      const tabs = tabBar(page, locale).getByRole('link');
      await expect(tabs).toHaveText(
        ['home', 'scholarships', 'saved', 'tracking', 'profile'].map((key) =>
          t(locale, `StudentLayout.tabs.${key}`)
        )
      );
      await expect(tabs).toHaveCount(5);
    });

    test('one column, full-width actions, 44px targets and no horizontal scroll', async ({
      page,
    }) => {
      await startStudentSession(page, {
        notifications: [
          notification('profile_incomplete', { minutes_ago: 1 }),
          notification('scholarship_archived', {
            minutes_ago: 3,
            is_read: true,
            params: { scholarship_id: 10, scholarship_title: LONG_TITLE },
          }),
          notification('deadline_reminder', {
            minutes_ago: 5,
            params: {
              scholarship_id: 7,
              scholarship_title: LONG_TITLE,
              days_left: 3,
              deadline: '2026-09-15',
              reminder_index: 1,
              reminder_total: 2,
              missing_documents: ['cv', 'passport', 'recommendation_letters'],
            },
          }),
          ...many(25, 10),
        ],
      });
      await page.setViewportSize(PHONE);
      await openNotifications(page, locale);
      await expect(cards(page, locale)).toHaveCount(20);
      expect(await hasNoHorizontalScroll(page)).toBe(true);

      // Every control inside the page is at least 44px tall and wide.
      const controls = page.getByRole('main').locator('button:visible, a:visible');
      const count = await controls.count();
      expect(count).toBeGreaterThan(3);
      for (let index = 0; index < count; index += 1) {
        const box = (await controls.nth(index).boundingBox())!;
        const label = await controls.nth(index).innerText();
        expect(box.height, `height of "${label.slice(0, 30)}"`).toBeGreaterThanOrEqual(43.5);
        expect(box.width, `width of "${label.slice(0, 30)}"`).toBeGreaterThanOrEqual(43.5);
      }

      // The first card: icon and text on one row, the pill on that row, the action under the text.
      const first = cards(page, locale).first();
      const cardBox = (await first.boundingBox())!;
      const action = first.getByRole('link');
      const actionBox = (await action.boundingBox())!;
      const pillBox = (await first.getByTestId('notification-new').boundingBox())!;
      const textBox = (await first.locator('button').boundingBox())!;
      expect(actionBox.width).toBeGreaterThan(cardBox.width - 40);
      expect(actionBox.y).toBeGreaterThan(textBox.y + textBox.height - 4);
      expect(pillBox.y + pillBox.height).toBeLessThan(actionBox.y);
      expect(pillBox.y).toBeLessThan(textBox.y + textBox.height);

      // Nothing inside a card is wider than the card.
      const overflowing = await page.evaluate(
        () =>
          [...document.querySelectorAll('main li *')].filter(
            (element) =>
              element.getBoundingClientRect().right > window.innerWidth + 1 ||
              element.getBoundingClientRect().left < -1
          ).length
      );
      expect(overflowing).toBe(0);

      await loadMore(page).click();
      await expect(cards(page, locale)).toHaveCount(28);
      expect(await hasNoHorizontalScroll(page)).toBe(true);
    });

    test('Mark all as read and the states also fit the phone', async ({ page }) => {
      const user = await startStudentSession(page, { notifications: sixTypes() });
      await page.setViewportSize(PHONE);
      await delayEndpoint(user.email, 'list', 600);
      await page.goto(`/${locale}/student/notifications`);
      expect(await hasNoHorizontalScroll(page)).toBe(true);
      const markAll = page.getByRole('button', { name: n(locale, 'markAll.label') });
      await expect(markAll).toBeVisible();
      const box = (await markAll.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(43.5);
      await markAll.click();
      await expect(
        page.getByRole('status').filter({ hasText: n(locale, 'markAll.done') })
      ).toBeVisible();
      expect(await hasNoHorizontalScroll(page)).toBe(true);
    });

    test('an empty list and an error fit the phone', async ({ page }) => {
      await startStudentSession(page);
      await page.setViewportSize(PHONE);
      await openNotifications(page, locale);
      await expect(page.getByTestId('notifications-empty')).toBeVisible();
      expect(await hasNoHorizontalScroll(page)).toBe(true);
      const cta = page.getByTestId('notifications-empty-cta');
      expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    });

    test('the tablet bar has the bell and the drawer has the item with its badge', async ({
      page,
    }) => {
      await startStudentSession(page, { notifications: sixTypes() });
      await page.setViewportSize(TABLET);
      await page.goto(`/${locale}/student/profile`);

      await expect(visibleBell(page)).toHaveCount(1);
      await expect(visibleBell(page).locator('[data-bell-dot]')).toBeVisible();

      await page.getByRole('button', { name: t(locale, 'StudentLayout.openNavigation') }).click();
      const drawer = page.getByRole('dialog', {
        name: t(locale, 'StudentLayout.navigationLabel'),
      });
      const item = drawer.getByRole('link', {
        name: new RegExp(t(locale, 'StudentLayout.nav.notifications')),
      });
      await expect(item).toBeVisible();
      await expect(item.getByTestId('notifications-badge')).toHaveText(/^3/);
      await item.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/student/notifications$`));
    });
  });
}
