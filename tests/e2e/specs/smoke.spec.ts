import { test, expect, t, LOCALES } from '../support/fixtures';

// Boots the app against the fake backend and checks the public entry point renders in both languages.
for (const locale of LOCALES) {
  test(`@readonly login page renders in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/login`);
    await expect(page.getByRole('heading', { name: t(locale, 'Login.title') })).toBeVisible();
    await expect(page.getByLabel(t(locale, 'Login.email'))).toBeVisible();
    await expect(page.getByRole('button', { name: t(locale, 'Login.submit') })).toBeVisible();
  });
}
