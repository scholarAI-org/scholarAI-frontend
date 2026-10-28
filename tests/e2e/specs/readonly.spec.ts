import { atPath, expect, pageTitle, startReadonlySession, t, test } from '../support/fixtures';

// Read-only checks that make no assumption about the data behind them, so the same specs
// can run against a deployed environment (E2E_BASE_URL, see docs/e2e/README.md): they look,
// search and never register, save, change or remove anything. They expect the Saved,
// Tracking and Home features to be on in that environment.

test('@readonly a student can sign in through the login form', async ({ page }) => {
  // Remote runs use E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD; local runs seed a user.
  const student = await startReadonlySession(page);
  await page.context().clearCookies();

  await page.goto('/en/login');
  await page.getByLabel(t('en', 'Login.email'), { exact: true }).fill(student.email);
  await page.getByLabel(t('en', 'Login.password'), { exact: true }).fill(student.password);
  await page.getByRole('button', { name: t('en', 'Login.submit') }).click();

  await expect(page).toHaveURL(atPath('/en/student/profile'));
  await expect(pageTitle(page, 'en', 'profile')).toBeVisible();
});

test('@readonly every student page opens for a signed-in student', async ({ page }) => {
  await startReadonlySession(page);

  for (const key of ['scholarships', 'saved', 'tracking', 'profile'] as const) {
    await page.goto(`/en/student/${key}`);
    await expect(pageTitle(page, 'en', key)).toBeVisible();
  }

  await page.goto('/en/student');
  await expect(page.getByRole('heading', { level: 2, name: /^Welcome back/ })).toBeVisible();
});

test('@readonly searching the scholarships updates the address and the results', async ({
  page,
}) => {
  await startReadonlySession(page);
  await page.goto('/en/student/scholarships');

  await page
    .getByRole('searchbox', { name: t('en', 'StudentScholarshipDiscovery.search.label') })
    .fill('a');

  await expect(page).toHaveURL((url) => url.searchParams.get('search') === 'a');
  // "12 scholarships" or "No scholarships": a count heading, whatever the data holds.
  await expect(page.getByRole('heading', { level: 2, name: /scholarship/i })).toBeVisible();
});
