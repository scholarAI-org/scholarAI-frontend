import type { Page } from '@playwright/test';
import { backendRequests, backendState, seedStudent, uniqueEmail } from '../support/backend';
import { atPath, expect, LOCALES, pageTitle, t, test, type Locale } from '../support/fixtures';

const PASSWORD = 'Passw0rd!';
// The fake backend accepts this single verification code.
const OTP = '123456';

async function signInThroughTheForm(
  page: Page,
  locale: Locale,
  creds: { email: string; password: string }
) {
  await page.getByLabel(t(locale, 'Login.email'), { exact: true }).fill(creds.email);
  await page.getByLabel(t(locale, 'Login.password'), { exact: true }).fill(creds.password);
  await page.getByRole('button', { name: t(locale, 'Login.submit') }).click();
}

for (const locale of LOCALES) {
  test.describe(`email accounts (${locale})`, () => {
    test('register, verify the code, then sign in', async ({ page }) => {
      const email = uniqueEmail('registrant');
      await page.goto(`/${locale}/register`);

      await page.getByLabel(t(locale, 'Register.name'), { exact: true }).fill('E2E Registrant');
      await page.getByLabel(t(locale, 'Register.email'), { exact: true }).fill(email);
      await page.getByLabel(t(locale, 'Register.password'), { exact: true }).fill(PASSWORD);
      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: t(locale, 'Register.submit') }).click();

      // Email verification is on by default, so registering leads to the code screen.
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === `/${locale}/verify-email` && url.searchParams.get('email') === email
      );
      await expect(
        page.getByRole('heading', { name: t(locale, 'VerifyEmail.title') })
      ).toBeVisible();
      const otpLabel = t(locale, 'VerifyEmail.otpLabel');
      for (const [index, digit] of [...OTP].entries()) {
        await page.getByLabel(`${otpLabel} ${index + 1}`, { exact: true }).fill(digit);
      }
      await page.getByRole('button', { name: t(locale, 'VerifyEmail.submit') }).click();

      await expect(page).toHaveURL(atPath(`/${locale}/verify-email/success`));
      await page
        .getByRole('link', { name: t(locale, 'EmailVerificationSuccess.continue') })
        .click();

      await expect(page).toHaveURL(atPath(`/${locale}/login`));
      await signInThroughTheForm(page, locale, { email, password: PASSWORD });
      await expect(page).toHaveURL(atPath(`/${locale}/student/profile`));
      await expect(pageTitle(page, locale, 'profile')).toBeVisible();

      // Only the three documented fields are sent; the role is assigned by the server.
      const [registration] = await backendRequests(email, '/auth/register');
      expect(Object.keys(registration.body as object).sort()).toEqual([
        'email',
        'full_name',
        'password',
      ]);
      expect(registration.body).toMatchObject({ full_name: 'E2E Registrant', email });
      expect((await backendState(email)).verified).toBe(true);
    });

    test('sign in with email and land on the profile page', async ({ page }) => {
      const user = await seedStudent({ name: 'Layla Student' });
      await page.goto(`/${locale}/login`);

      await signInThroughTheForm(page, locale, user);

      await expect(page).toHaveURL(atPath(`/${locale}/student/profile`));
      await expect(pageTitle(page, locale, 'profile')).toBeVisible();
      await expect(page.locator('bdi', { hasText: 'Layla Student' }).first()).toBeVisible();
    });
  });
}

test('a wrong password shows the backend message and stays on the login page', async ({ page }) => {
  const user = await seedStudent();
  await page.goto('/en/login');

  await signInThroughTheForm(page, 'en', { email: user.email, password: 'Wrong-pass1!' });

  await expect(page.getByText('Invalid email or password')).toBeVisible();
  await expect(page).toHaveURL(atPath('/en/login'));
});

// Both redirects below are client-side navigations that fetch a dynamic page from the server.
// Under a full parallel run one of them took longer than the default 10 s (it passes in ~5 s
// on its own), so these assertions wait up to 20 s for the URL and the test gets room for it.
const REDIRECT_TIMEOUT = 20_000;

test('a guest sent to a protected page returns to it after signing in', async ({ page }) => {
  test.setTimeout(60_000);
  const user = await seedStudent();

  await page.goto('/en/student/saved');
  await expect(page).toHaveURL(
    (url) => url.pathname === '/en/login' && url.searchParams.get('next') === '/student/saved',
    { timeout: REDIRECT_TIMEOUT }
  );

  await signInThroughTheForm(page, 'en', user);

  await expect(page).toHaveURL(atPath('/en/student/saved'), { timeout: REDIRECT_TIMEOUT });
  await expect(pageTitle(page, 'en', 'saved')).toBeVisible({ timeout: REDIRECT_TIMEOUT });
});
