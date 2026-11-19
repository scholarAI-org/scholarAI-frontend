import { backendRequests, notification } from '../support/backend';
import {
  atPath,
  expect,
  LOCALES,
  pageTitle,
  sidebar,
  startStudentSession,
  t,
  test,
} from '../support/fixtures';

// Runs against the second server (project "flags-off"): the same build with the Home, Saved
// and Tracking flags unset.
const FLAG_GATED = [
  { route: '/student', navKey: 'home' },
  { route: '/student/saved', navKey: 'saved' },
  { route: '/student/tracking', navKey: 'tracking' },
] as const;

for (const locale of LOCALES) {
  test.describe(`features switched off (${locale})`, () => {
    test('the sidebar offers only search and profile', async ({ page }) => {
      await startStudentSession(page);
      await page.goto(`/${locale}/student/scholarships`);
      await expect(pageTitle(page, locale, 'scholarships')).toBeVisible();

      const nav = sidebar(page, locale);
      for (const key of ['scholarships', 'profile']) {
        await expect(
          nav.getByRole('link', { name: t(locale, `StudentLayout.nav.${key}`) })
        ).toBeVisible();
      }
      for (const { navKey } of FLAG_GATED) {
        await expect(
          nav.getByRole('link', { name: t(locale, `StudentLayout.nav.${navKey}`) })
        ).toHaveCount(0);
      }
    });

    for (const { route } of FLAG_GATED) {
      test(`${route} is not found and fetches no data`, async ({ page }) => {
        const user = await startStudentSession(page);

        await page.goto(`/${locale}${route}`);

        await expect(page).toHaveURL(atPath(`/${locale}${route}`));
        // The localized 404 page (src/app/[locale]/not-found.tsx), not Next's default one.
        await expect(
          page.getByRole('heading', { level: 1, name: t(locale, 'NotFound.title') })
        ).toBeVisible();
        await expect(page.getByRole('link', { name: t(locale, 'NotFound.home') })).toBeVisible();

        // The gate runs before any page code: none of the feature's data was requested.
        const requested = (await backendRequests(user.email)).map((request) => request.path);
        expect(requested).not.toContain('/api/scholarships/saved');
        expect(requested).not.toContain('/api/scholarships/tracked');
        expect(requested).not.toContain('/profile');
      });
    }

    // Settings is not a navigation item (it hangs off the account menu), so it is checked
    // on its own rather than through FLAG_GATED.
    test('/student/settings is not found and nothing is requested for it', async ({ page }) => {
      const user = await startStudentSession(page);

      await page.goto(`/${locale}/student/settings`);

      await expect(page).toHaveURL(atPath(`/${locale}/student/settings`));
      await expect(
        page.getByRole('heading', { level: 1, name: t(locale, 'NotFound.title') })
      ).toBeVisible();
      await expect(page.getByRole('link', { name: t(locale, 'NotFound.home') })).toBeVisible();
      // No form on the page.
      await expect(
        page.getByLabel(t(locale, 'Settings.changePassword.currentPassword'), { exact: true })
      ).toHaveCount(0);

      // Besides the test's own sign-in, the only request is the shell's session check; the
      // gate ran before the page.
      const requested = (await backendRequests(user.email)).map((request) => request.path);
      expect(requested).not.toContain('/auth/change-password');
      expect(requested.filter((path) => !['/auth/login', '/auth/me'].includes(path))).toEqual([]);
    });

    test('the sidebar and the tablet drawer have no Settings link', async ({ page }) => {
      await startStudentSession(page);
      await page.goto(`/${locale}/student/profile`);

      // Desktop: the footer holds Log out and nothing else.
      const aside = page.locator('aside');
      await expect(
        aside.getByRole('button', { name: t(locale, 'StudentLayout.logout') })
      ).toBeVisible();
      await expect(
        aside.getByRole('link', { name: t(locale, 'StudentLayout.settings'), exact: true })
      ).toHaveCount(0);
      await expect(page.locator('a[href$="/student/settings"]')).toHaveCount(0);

      // Tablet: the same sidebar inside the drawer.
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.getByRole('button', { name: t(locale, 'StudentLayout.openNavigation') }).click();
      const drawer = page.getByRole('dialog', {
        name: t(locale, 'StudentLayout.navigationLabel'),
      });
      await expect(
        drawer.getByRole('button', { name: t(locale, 'StudentLayout.logout') })
      ).toBeVisible();
      await expect(
        drawer.getByRole('link', { name: t(locale, 'StudentLayout.settings'), exact: true })
      ).toHaveCount(0);
      await expect(page.locator('a[href$="/student/settings"]')).toHaveCount(0);
    });

    test('the account menu has no Settings item', async ({ page }) => {
      await startStudentSession(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${locale}/student/profile`);

      await page.getByRole('button', { name: t(locale, 'StudentLayout.userMenu.label') }).click();

      // The menu is open (Log out is in it) and Settings is not.
      await expect(
        page.getByRole('menuitem', { name: t(locale, 'StudentLayout.logout') })
      ).toBeVisible();
      await expect(
        page.getByRole('menuitem', { name: t(locale, 'StudentLayout.userMenu.settings') })
      ).toHaveCount(0);
      await expect(page.locator('a[href$="/student/settings"]')).toHaveCount(0);
    });

    // Notifications (Feature 011): NOTIFICATIONS_ENABLED is empty on this server.
    test('/student/notifications is not found and nothing is requested for it', async ({
      page,
    }) => {
      // The student has notifications, so any request for them would show in the log.
      const user = await startStudentSession(page, {
        notifications: [notification('profile_incomplete'), notification('scholarship_match')],
      });

      await page.goto(`/${locale}/student/notifications`);

      await expect(page).toHaveURL(atPath(`/${locale}/student/notifications`));
      await expect(
        page.getByRole('heading', { level: 1, name: t(locale, 'NotFound.title') })
      ).toBeVisible();
      await expect(page.getByRole('link', { name: t(locale, 'NotFound.home') })).toBeVisible();
      await expect(
        page.getByRole('main').getByRole('list', {
          name: t(locale, 'StudentNotifications.page.listLabel'),
        })
      ).toHaveCount(0);

      // The gate ran before the page: no notification request, and besides the test's own
      // sign-in only the shell's session check.
      const requested = (await backendRequests(user.email)).map((request) => request.path);
      expect(requested.filter((path) => path.startsWith('/api/notifications'))).toEqual([]);
      expect(requested.filter((path) => !['/auth/login', '/auth/me'].includes(path))).toEqual([]);
    });

    test('no Notifications item, bell, dot or badge anywhere, and no request, at any width', async ({
      page,
    }) => {
      const user = await startStudentSession(page, {
        notifications: [notification('profile_incomplete'), notification('scholarship_match')],
      });
      const everywhere = [
        'a[href$="/student/notifications"]',
        '[data-notifications-bell]',
        '[data-bell-dot]',
        '[data-testid="notifications-badge"]',
      ].join(', ');

      // Desktop: the sidebar and the header.
      await page.goto(`/${locale}/student/profile`);
      await expect(
        sidebar(page, locale).getByRole('link', { name: t(locale, 'StudentLayout.nav.profile') })
      ).toBeVisible();
      await expect(
        sidebar(page, locale).getByRole('link', {
          name: t(locale, 'StudentLayout.nav.notifications'),
        })
      ).toHaveCount(0);
      await expect(page.locator(everywhere)).toHaveCount(0);

      // Tablet: the compact bar and the drawer (the same sidebar).
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator(everywhere)).toHaveCount(0);
      await page.getByRole('button', { name: t(locale, 'StudentLayout.openNavigation') }).click();
      const drawer = page.getByRole('dialog', {
        name: t(locale, 'StudentLayout.navigationLabel'),
      });
      await expect(
        drawer.getByRole('button', { name: t(locale, 'StudentLayout.logout') })
      ).toBeVisible();
      await expect(page.locator(everywhere)).toHaveCount(0);
      await page.keyboard.press('Escape');

      // Phone: the top bar and the account menu.
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.locator(everywhere)).toHaveCount(0);
      await page.getByRole('button', { name: t(locale, 'StudentLayout.userMenu.label') }).click();
      await expect(
        page.getByRole('menuitem', { name: t(locale, 'StudentLayout.logout') })
      ).toBeVisible();
      await expect(
        page.getByRole('menuitem', { name: t(locale, 'StudentLayout.userMenu.notifications') })
      ).toHaveCount(0);
      await expect(page.locator(everywhere)).toHaveCount(0);

      // Moving around never asks for notifications.
      await page.goto(`/${locale}/student/scholarships`);
      await expect(
        page.getByRole('banner').getByRole('heading', {
          level: 1,
          name: t(locale, 'StudentLayout.pages.scholarships.title'),
        })
      ).toBeVisible();
      await page.waitForTimeout(500);
      const requested = (await backendRequests(user.email)).map((request) => request.path);
      expect(requested.filter((path) => path.startsWith('/api/notifications'))).toEqual([]);
    });
  });
}
