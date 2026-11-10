import type { Page } from '@playwright/test';
import { backendState, fetchCatalog, titleIn } from '../support/backend';
import {
  atPath,
  expect,
  LOCALES,
  pageTitle,
  sidebar,
  startStudentSession,
  t,
  test,
  type Locale,
} from '../support/fixtures';

const saveButton = (page: Page, locale: Locale, title: string) =>
  page.getByRole('button', {
    name: t(locale, 'StudentScholarshipDiscovery.bookmark.saveFor', { title }),
  });
const removeButton = (page: Page, locale: Locale, title: string) =>
  page.getByRole('button', {
    name: t(locale, 'StudentScholarshipDiscovery.bookmark.removeFor', { title }),
  });

const savedCount = (page: Page, locale: Locale, count: number) =>
  page.getByText(t(locale, 'StudentSavedScholarships.count', { count }), { exact: true });

for (const locale of LOCALES) {
  test.describe(`saved scholarships (${locale})`, () => {
    test('save from the results, find it on the Saved page, then unsave it', async ({ page }) => {
      const catalog = await fetchCatalog();
      const aurora = catalog.find((s) => s.title_en === 'Aurora Scholarship')!;
      const title = titleIn(locale, aurora);
      const user = await startStudentSession(page);
      await page.goto(`/${locale}/student/scholarships?search=aurora`);

      await saveButton(page, locale, title).click();

      await expect(removeButton(page, locale, title)).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(async () => (await backendState(user.email)).savedIds).toEqual([aurora.id]);

      // The saved state is the server's, not just the page's: it survives a reload.
      await page.reload();
      await expect(removeButton(page, locale, title)).toHaveAttribute('aria-pressed', 'true');

      await sidebar(page, locale)
        .getByRole('link', { name: t(locale, 'StudentLayout.nav.saved') })
        .click();
      await expect(page).toHaveURL(atPath(`/${locale}/student/saved`));
      await expect(pageTitle(page, locale, 'saved')).toBeVisible();
      await expect(savedCount(page, locale, 1)).toBeVisible();
      await expect(page.getByRole('article', { name: title })).toBeVisible();

      await removeButton(page, locale, title).click();

      await expect(
        page.getByRole('heading', { name: t(locale, 'StudentSavedScholarships.empty.heading') })
      ).toBeVisible();
      await expect.poll(async () => (await backendState(user.email)).savedIds).toEqual([]);
    });

    test('the Saved page lists what was saved before and removing one keeps the rest', async ({
      page,
    }) => {
      const catalog = await fetchCatalog();
      const [first, second] = [3, 9].map((id) => catalog.find((s) => s.id === id)!);
      const user = await startStudentSession(page, { saved: [first.id, second.id] });

      await page.goto(`/${locale}/student/saved`);

      await expect(savedCount(page, locale, 2)).toBeVisible();
      await expect(page.getByRole('article', { name: titleIn(locale, first) })).toBeVisible();
      await expect(page.getByRole('article', { name: titleIn(locale, second) })).toBeVisible();

      await removeButton(page, locale, titleIn(locale, first)).click();

      await expect(savedCount(page, locale, 1)).toBeVisible();
      await expect(page.getByRole('article', { name: titleIn(locale, first) })).toHaveCount(0);
      await expect.poll(async () => (await backendState(user.email)).savedIds).toEqual([second.id]);
    });

    test('with nothing saved the empty state points to the search page', async ({ page }) => {
      await startStudentSession(page);
      await page.goto(`/${locale}/student/saved`);

      await expect(
        page.getByRole('heading', { name: t(locale, 'StudentSavedScholarships.empty.heading') })
      ).toBeVisible();
      await page
        .getByRole('link', { name: t(locale, 'StudentSavedScholarships.empty.cta') })
        .click();

      await expect(page).toHaveURL(atPath(`/${locale}/student/scholarships`));
    });
  });
}
