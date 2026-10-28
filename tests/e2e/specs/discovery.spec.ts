import type { Page } from '@playwright/test';
import { fetchCatalog, titleIn, type CatalogScholarship } from '../support/backend';
import { expect, LOCALES, startStudentSession, t, test, type Locale } from '../support/fixtures';

const d =
  (key: string, params = {}) =>
  (locale: Locale) =>
    t(locale, `StudentScholarshipDiscovery.${key}`, params);

const PAGE_SIZE = 20;

// The cards on the page, by their title. Details are off, so the title is plain text.
const cardTitles = (page: Page) => page.getByRole('article').getByRole('heading', { level: 3 });

const resultCount = (page: Page, locale: Locale, count: number) =>
  page.getByRole('heading', { level: 2, name: d('results.count', { count })(locale) });

// The "no matches" message is a status region, not a heading.
const noMatches = (page: Page, locale: Locale) =>
  page.getByRole('status').filter({ hasText: d('empty.noMatches.title')(locale) });

const newestFirst = (items: CatalogScholarship[]) => [...items].sort((a, b) => b.id - a.id);

async function openDiscovery(page: Page, locale: Locale, query = '') {
  await startStudentSession(page);
  await page.goto(`/${locale}/student/scholarships${query}`);
}

for (const locale of LOCALES) {
  test.describe(`scholarship discovery (${locale})`, () => {
    test('lists the first page of scholarships, newest first', async ({ page }) => {
      const catalog = await fetchCatalog();
      await openDiscovery(page, locale);

      await expect(resultCount(page, locale, catalog.length)).toBeVisible();
      await expect(cardTitles(page)).toHaveText(
        newestFirst(catalog)
          .slice(0, PAGE_SIZE)
          .map((s) => titleIn(locale, s))
      );
    });

    test('search narrows the results and clearing it brings them back', async ({ page }) => {
      const catalog = await fetchCatalog();
      const zephyr = catalog.find((s) => s.title_en === 'Zephyr Scholarship')!;
      await openDiscovery(page, locale);
      await expect(resultCount(page, locale, catalog.length)).toBeVisible();

      const search = page.getByRole('searchbox', { name: d('search.label')(locale) });
      await search.fill('zephyr');

      await expect(resultCount(page, locale, 1)).toBeVisible();
      await expect(cardTitles(page)).toHaveText([titleIn(locale, zephyr)]);
      await expect(page).toHaveURL((url) => url.searchParams.get('search') === 'zephyr');

      await page.getByRole('button', { name: d('search.clear')(locale) }).click();

      await expect(resultCount(page, locale, catalog.length)).toBeVisible();
      await expect(page).toHaveURL((url) => !url.searchParams.has('search'));
    });

    test('a search with no matches shows the empty state', async ({ page }) => {
      await openDiscovery(page, locale, '?search=no-such-scholarship');

      await expect(noMatches(page, locale)).toBeVisible();
    });

    test('filters combine, show their own empty state and clear', async ({ page }) => {
      const catalog = await fetchCatalog();
      await openDiscovery(page, locale);
      await expect(resultCount(page, locale, catalog.length)).toBeVisible();

      // Fully funded, in Turkey.
      await page.getByRole('checkbox', { name: d('filters.funding.full')(locale) }).check();
      await page.getByRole('button', { name: d('filters.country.placeholder')(locale) }).click();
      await page.getByRole('checkbox', { name: 'Turkey' }).check();

      const funded = catalog.filter((s) => s.funding_type === 'full' && s.country === 'Turkey');
      expect(funded.length).toBeGreaterThan(0);
      await expect(resultCount(page, locale, funded.length)).toBeVisible();
      await expect(cardTitles(page)).toHaveText(newestFirst(funded).map((s) => titleIn(locale, s)));
      await expect(page).toHaveURL(
        (url) =>
          url.searchParams.getAll('funding_type').join() === 'full' &&
          url.searchParams.getAll('country').join() === 'Turkey'
      );

      // No Turkish PhD in the catalog: the filter-specific empty state appears.
      // Exact: in Arabic the PhD label is a substring of the Postdoc one.
      await page
        .getByRole('checkbox', { name: d('filters.academicLevel.phd')(locale), exact: true })
        .check();
      const phdInTurkey = funded.filter((s) => s.study_level.includes('phd'));
      expect(phdInTurkey).toHaveLength(0);
      await expect(noMatches(page, locale)).toBeVisible();

      await page.getByRole('button', { name: d('empty.noMatches.clearFilters')(locale) }).click();

      await expect(resultCount(page, locale, catalog.length)).toBeVisible();
      await expect(page).toHaveURL(
        (url) => !url.searchParams.has('funding_type') && !url.searchParams.has('country')
      );
    });

    test('sorting by deadline puts the soonest deadline first', async ({ page }) => {
      const catalog = await fetchCatalog();
      await openDiscovery(page, locale);
      await expect(resultCount(page, locale, catalog.length)).toBeVisible();

      await page
        .getByRole('combobox', { name: d('sort.label')(locale) })
        .selectOption({ label: d('sort.deadlineSoon')(locale) });

      const soonest = catalog
        .filter((s) => s.deadline)
        .sort((a, b) => a.deadline!.localeCompare(b.deadline!) || b.id - a.id);
      await expect(cardTitles(page).first()).toHaveText(titleIn(locale, soonest[0]));
      await expect(page).toHaveURL((url) => url.searchParams.get('sort') === 'deadline_soon');
    });

    test('the second page holds the remaining scholarships', async ({ page }) => {
      const catalog = await fetchCatalog();
      await openDiscovery(page, locale);
      await expect(resultCount(page, locale, catalog.length)).toBeVisible();

      await page.getByRole('button', { name: d('pagination.page', { page: 2 })(locale) }).click();

      await expect(page).toHaveURL((url) => url.searchParams.get('page') === '2');
      await expect(cardTitles(page)).toHaveText(
        newestFirst(catalog)
          .slice(PAGE_SIZE)
          .map((s) => titleIn(locale, s))
      );
    });
  });
}
