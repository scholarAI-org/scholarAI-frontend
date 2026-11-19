import type { Page } from '@playwright/test';
import {
  addNotifications,
  backendRequests,
  failNext,
  notification,
  type SeedNotification,
} from '../support/backend';
import {
  expect,
  LOCALES,
  sidebar,
  startStudentSession,
  t,
  test,
  type Locale,
} from '../support/fixtures';

// The unread count (Feature 011): the sidebar badge, the header bell and Home's card read one
// query that one poller keeps fresh. A controlled clock (page.clock) makes a minute take no time.

const COUNT_PATH = '/api/notifications/unread-count';

/** `unread` unread rows and `read` read ones, of mixed types. */
const rows = (unread: number, read = 0): SeedNotification[] => [
  ...Array.from({ length: unread }, (_, index) =>
    notification(index % 2 === 0 ? 'scholarship_match' : 'profile_incomplete', {
      minutes_ago: 5 + index,
    })
  ),
  ...Array.from({ length: read }, (_, index) =>
    notification('scholarship_archived', { minutes_ago: 600 + index, is_read: true })
  ),
];

const countRequests = async (email: string) => (await backendRequests(email, COUNT_PATH)).length;

const badge = (page: Page, locale: Locale) =>
  sidebar(page, locale).getByTestId('notifications-badge');
const bell = (page: Page) => page.locator('a[data-notifications-bell]').first();
const dot = (page: Page) => bell(page).locator('[data-bell-dot]');
const homeCard = (page: Page) => page.locator('[data-stat="notifications"]');

/** The clock starts running at natural pace; fastForward then jumps and fires due timers once. */
async function startClock(page: Page) {
  await page.clock.install();
}

async function setHidden(page: Page, hidden: boolean) {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', {
      value: value ? 'hidden' : 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
  }, hidden);
}

for (const locale of LOCALES) {
  test.describe(`unread count (${locale})`, () => {
    test('the sidebar badge, the bell dot and Home card show the same number', async ({ page }) => {
      await startStudentSession(page, { notifications: rows(3, 2) });
      await page.goto(`/${locale}/student`);

      await expect(homeCard(page)).toContainText('3');
      await expect(badge(page, locale)).toHaveText(/^3/);
      await expect(badge(page, locale)).toContainText(
        t(locale, 'StudentNotifications.badge.short', { count: 3 })
      );
      await expect(dot(page)).toBeVisible();
      await expect(bell(page)).toHaveAttribute(
        'aria-label',
        t(locale, 'StudentHome.bell.label', { count: 3 })
      );
      await expect(bell(page)).toHaveAttribute(
        'href',
        new RegExp(`/${locale}/student/notifications$`)
      );

      // The sidebar item itself links to the page, with the count in its accessible name.
      const item = sidebar(page, locale).getByRole('link', {
        name: new RegExp(t(locale, 'StudentLayout.nav.notifications')),
      });
      await expect(item).toHaveAttribute('href', new RegExp(`/${locale}/student/notifications$`));
      await expect(item).toContainText(t(locale, 'StudentNotifications.badge.short', { count: 3 }));
    });

    test('the Home card opens the notification center, and the bell shows it as current there', async ({
      page,
    }) => {
      await startStudentSession(page, { notifications: rows(2) });
      await page.goto(`/${locale}/student`);
      await homeCard(page).getByRole('link').click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/student/notifications$`));
      await expect(bell(page)).toHaveAttribute('aria-current', 'page');
      await expect(
        sidebar(page, locale).getByRole('link', {
          name: new RegExp(t(locale, 'StudentLayout.nav.notifications')),
        })
      ).toHaveAttribute('aria-current', 'page');
    });

    test('nothing shows at 0: no badge, no dot', async ({ page }) => {
      await startStudentSession(page, { notifications: rows(0, 3) });
      await page.goto(`/${locale}/student/profile`);
      await expect(
        sidebar(page, locale).getByRole('link', {
          name: new RegExp(t(locale, 'StudentLayout.nav.notifications')),
        })
      ).toBeVisible();
      await expect(bell(page)).toBeVisible();
      await expect(badge(page, locale)).toHaveCount(0);
      await expect(dot(page)).toHaveCount(0);
    });

    test('99+ above 99, with the real number for assistive technology', async ({ page }) => {
      await startStudentSession(page, { notifications: rows(100) });
      await page.goto(`/${locale}/student/profile`);
      await expect(badge(page, locale)).toContainText('99+');
      await expect(badge(page, locale)).toContainText(
        t(locale, 'StudentNotifications.badge.short', { count: 100 })
      );
    });

    test('the count is polled about once a minute without a reload', async ({ page }) => {
      const user = await startStudentSession(page, { notifications: rows(3) });
      await startClock(page);
      await page.goto(`/${locale}/student/profile`);
      await expect(badge(page, locale)).toHaveText(/^3/);
      const first = await countRequests(user.email);
      expect(first).toBeGreaterThanOrEqual(1);

      await addNotifications(user.email, rows(1));
      await page.clock.fastForward(60_000);
      await expect(badge(page, locale)).toHaveText(/^4/);
      expect(await countRequests(user.email)).toBe(first + 1);

      await addNotifications(user.email, rows(1));
      await page.clock.fastForward(60_000);
      await expect(badge(page, locale)).toHaveText(/^5/);
      expect(await countRequests(user.email)).toBe(first + 2);
    });

    test('a hidden tab makes no request, a visible one requests at once', async ({ page }) => {
      const user = await startStudentSession(page, { notifications: rows(2) });
      await startClock(page);
      await page.goto(`/${locale}/student/profile`);
      await expect(badge(page, locale)).toHaveText(/^2/);
      const first = await countRequests(user.email);

      await setHidden(page, true);
      await addNotifications(user.email, rows(1));
      await page.clock.fastForward(180_000);
      await page.waitForTimeout(500);
      expect(await countRequests(user.email)).toBe(first);
      await expect(badge(page, locale)).toHaveText(/^2/);

      // Back on the tab: refetched straight away, without waiting for the next tick.
      await setHidden(page, false);
      await expect(badge(page, locale)).toHaveText(/^3/);
      expect(await countRequests(user.email)).toBe(first + 1);
    });

    test('one poller serves the badge, the bell and Home: one request a minute', async ({
      page,
    }) => {
      const user = await startStudentSession(page, { notifications: rows(3) });
      await startClock(page);
      await page.goto(`/${locale}/student`);
      await expect(homeCard(page)).toContainText('3');
      await expect(badge(page, locale)).toHaveText(/^3/);
      await expect(dot(page)).toBeVisible();
      await page.waitForTimeout(500);
      const settled = await countRequests(user.email);

      for (let minute = 1; minute <= 3; minute += 1) {
        await page.clock.fastForward(60_000);
        await expect.poll(() => countRequests(user.email)).toBe(settled + minute);
      }
      // Still one request per tick after the whole set of readers has had time to misbehave.
      await page.waitForTimeout(500);
      expect(await countRequests(user.email)).toBe(settled + 3);
    });

    for (const status of [401, 403, 404]) {
      test(`a ${status} stops the polling and hides the badge and the dot`, async ({ page }) => {
        const user = await startStudentSession(page, { notifications: rows(3) });
        await failNext(user.email, 'unread-count', status, 1);
        await startClock(page);
        await page.goto(`/${locale}/student/profile`);

        await expect.poll(() => countRequests(user.email)).toBe(1);
        // The page is still there, and so are the links; only the numbers are gone.
        await expect(bell(page)).toBeVisible();
        await expect(badge(page, locale)).toHaveCount(0);
        await expect(dot(page)).toHaveCount(0);

        await page.clock.fastForward(300_000);
        await setHidden(page, true);
        await setHidden(page, false);
        await page.waitForTimeout(500);
        expect(await countRequests(user.email)).toBe(1);
        await expect(badge(page, locale)).toHaveCount(0);
      });
    }

    test('a 5xx keeps the last count and the polling carries on', async ({ page }) => {
      const user = await startStudentSession(page, { notifications: rows(3) });
      await startClock(page);
      await page.goto(`/${locale}/student/profile`);
      await expect(badge(page, locale)).toHaveText(/^3/);

      await failNext(user.email, 'unread-count', 500, 1);
      await page.clock.fastForward(60_000);
      await page.waitForTimeout(500);
      await expect(badge(page, locale)).toHaveText(/^3/);

      await addNotifications(user.email, rows(1));
      await page.clock.fastForward(60_000);
      await expect(badge(page, locale)).toHaveText(/^4/);
    });
  });
}
