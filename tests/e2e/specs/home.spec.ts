import type { Page } from '@playwright/test';
import { fetchCatalog, titleIn } from '../support/backend';
import {
  expect,
  LOCALES,
  sidebar,
  startStudentSession,
  t,
  test,
  type Locale,
} from '../support/fixtures';

const h = (locale: Locale, key: string, params = {}) => t(locale, `StudentHome.${key}`, params);

const stat = (page: Page, id: 'saved' | 'inProgress' | 'upcoming') =>
  page.locator(`[data-stat="${id}"]`);

const section = (page: Page, name: string) => page.getByRole('region', { name });

// Home looks 30 days ahead (UPCOMING_WINDOW_DAYS) and shows the 3 soonest deadlines.
const WINDOW_DAYS = 30;

for (const locale of LOCALES) {
  test.describe(`student home (${locale})`, () => {
    test('summarises saved, in-progress and upcoming items', async ({ page }) => {
      const catalog = await fetchCatalog();
      const byId = (id: number) =>
        titleIn(
          locale,
          catalog.find((s) => s.id === id)!
        );
      // Saved 2 and 3; tracked 4 (preparing), 5 (applied), 6 (accepted: finished, so it is
      // neither "in progress" nor an upcoming deadline). Deadlines fall 6, 9, 12 and 15 days
      // out for 2, 3, 4 and 5.
      await startStudentSession(page, {
        name: 'Layla Student',
        completion: 85,
        saved: [2, 3],
        tracked: [
          { scholarship_id: 4, status: 'preparing_documents' },
          { scholarship_id: 5, status: 'applied' },
          { scholarship_id: 6, status: 'accepted' },
        ],
      });

      await page.goto(`/${locale}/student`);

      await expect(
        page.getByRole('heading', { level: 2, name: h(locale, 'welcome.title', { name: 'Layla' }) })
      ).toBeVisible();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '85');
      await expect(stat(page, 'saved')).toContainText('2');
      await expect(stat(page, 'inProgress')).toContainText('2');
      await expect(stat(page, 'upcoming')).toContainText('4');

      // Soonest first, capped at three even though four are due.
      const deadlines = section(page, h(locale, 'deadlines.title')).getByRole('listitem');
      await expect(deadlines).toHaveCount(3);
      for (const [index, id] of [2, 3, 4].entries()) {
        await expect(deadlines.nth(index)).toContainText(byId(id));
      }

      // 85% is past the 70% unlock line: the three newest scholarships are listed.
      const latest = section(page, h(locale, 'recommendations.latestTitle'));
      for (const id of [26, 25, 24]) await expect(latest).toContainText(byId(id));

      await expect(
        sidebar(page, locale).getByRole('link', { name: t(locale, 'StudentLayout.nav.home') })
      ).toHaveAttribute('aria-current', 'page');
    });

    test('keeps the latest scholarships locked below 70% profile completion', async ({ page }) => {
      const catalog = await fetchCatalog();
      await startStudentSession(page, { completion: 40 });

      await page.goto(`/${locale}/student`);

      const latest = section(page, h(locale, 'recommendations.latestTitle'));
      await expect(latest).toContainText(h(locale, 'recommendations.locked.title'));
      await expect(latest).not.toContainText(
        titleIn(
          locale,
          catalog.find((s) => s.id === 26)!
        )
      );
    });

    test('a new account sees zeros and the empty deadlines state', async ({ page }) => {
      await startStudentSession(page);

      await page.goto(`/${locale}/student`);

      await expect(stat(page, 'saved')).toContainText('0');
      await expect(stat(page, 'inProgress')).toContainText('0');
      await expect(stat(page, 'upcoming')).toContainText('0');
      await expect(section(page, h(locale, 'deadlines.title'))).toContainText(
        h(locale, 'deadlines.empty.title', { days: WINDOW_DAYS })
      );
    });
  });
}
