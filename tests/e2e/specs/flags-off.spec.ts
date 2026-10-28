import { backendRequests } from '../support/backend';
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
        await expect(page.getByText('This page could not be found.')).toBeVisible();
        await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();

        // The gate runs before any page code: none of the feature's data was requested.
        const requested = (await backendRequests(user.email)).map((request) => request.path);
        expect(requested).not.toContain('/api/scholarships/saved');
        expect(requested).not.toContain('/api/scholarships/tracked');
        expect(requested).not.toContain('/profile');
      });
    }
  });
}
