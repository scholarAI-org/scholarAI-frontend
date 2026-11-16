import type { Page } from '@playwright/test';
import { backendRequests, backendState } from '../support/backend';
import { E2E_URLS } from '../support/env';
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
  type SeededUser,
} from '../support/fixtures';

// Student Settings > Change password (Feature 010). Runs on the flags-on server, where
// SETTINGS_ENABLED=true; flags-off.spec.ts covers the same route with the flag off.

const OLD_PASSWORD = 'Passw0rd!'; // what the fake backend seeds by default
const NEW_PASSWORD = 'N3w-passw0rd!';
const CHANGE_PATH = '/auth/change-password';
// Redirects are client-side navigations that fetch a dynamic page; allow them more room.
const REDIRECT_TIMEOUT = 20_000;

const s = (locale: Locale, key: string, params = {}) =>
  t(locale, `Settings.changePassword.${key}`, params);
const fb = (locale: Locale, key: string) => t(locale, `Settings.feedback.${key}`);
const val = (locale: Locale, key: string, params = {}) =>
  t(locale, `Settings.validation.${key}`, params);

const field = (
  page: Page,
  locale: Locale,
  key: 'currentPassword' | 'newPassword' | 'confirmPassword'
) => page.getByLabel(s(locale, key), { exact: true });
const submitButton = (page: Page, locale: Locale) =>
  page.getByRole('button', { name: s(locale, 'submit'), exact: true });
const otherDevices = (page: Page, locale: Locale) =>
  page.getByLabel(s(locale, 'signOutOtherDevices'), { exact: true });
/** Scoped to <main>: Next's route announcer is also a role=alert. */
const alerts = (page: Page) => page.getByRole('main').getByRole('alert');
const status = (page: Page) => page.getByRole('main').getByRole('status');

async function openSettings(page: Page, locale: Locale) {
  await page.goto(`/${locale}/student/settings`);
  await expect(pageTitle(page, locale, 'settings')).toBeVisible();
  await expect(field(page, locale, 'currentPassword')).toBeVisible();
}

async function fillForm(
  page: Page,
  locale: Locale,
  values: { current?: string; next?: string; confirm?: string }
) {
  if (values.current !== undefined)
    await field(page, locale, 'currentPassword').fill(values.current);
  if (values.next !== undefined) await field(page, locale, 'newPassword').fill(values.next);
  if (values.confirm !== undefined)
    await field(page, locale, 'confirmPassword').fill(values.confirm);
}

async function signInThroughTheForm(
  page: Page,
  locale: Locale,
  creds: Pick<SeededUser, 'email' | 'password'>
) {
  await page.getByLabel(t(locale, 'Login.email'), { exact: true }).fill(creds.email);
  await page.getByLabel(t(locale, 'Login.password'), { exact: true }).fill(creds.password);
  await page.getByRole('button', { name: t(locale, 'Login.submit') }).click();
}

/** A second signed-in browser: another session for the same account. */
async function signInSomewhereElse(user: Pick<SeededUser, 'email' | 'password'>) {
  const response = await fetch(`${E2E_URLS.fakeBackend}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  expect(response.ok).toBe(true);
}

const changeRequests = (email: string) => backendRequests(email, CHANGE_PATH);

for (const locale of LOCALES) {
  test.describe(`settings: change password (${locale})`, () => {
    test('changes the password, empties the form, then signing in needs the new one', async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const user = await startStudentSession(page, { name: 'Layla Student' });
      await openSettings(page, locale);

      await fillForm(page, locale, {
        current: OLD_PASSWORD,
        next: NEW_PASSWORD,
        confirm: NEW_PASSWORD,
      });
      await submitButton(page, locale).click();

      // Success: a translated message, the form is empty, and the student stays here.
      await expect(status(page)).toContainText(fb(locale, 'success'));
      await expect(page).toHaveURL(atPath(`/${locale}/student/settings`));
      for (const key of ['currentPassword', 'newPassword', 'confirmPassword'] as const) {
        await expect(field(page, locale, key)).toHaveValue('');
      }
      await expect(otherDevices(page, locale)).not.toBeChecked();
      await expect(alerts(page)).toHaveCount(0);

      // One request, with exactly the three contract fields (no alias, no confirmation).
      const sent = await changeRequests(user.email);
      expect(sent).toHaveLength(1);
      expect(sent[0].status).toBe(200);
      expect(Object.keys(sent[0].body as object).sort()).toEqual([
        'current_password',
        'invalidate_other_sessions',
        'new_password',
      ]);
      expect(sent[0].body).toEqual({
        current_password: OLD_PASSWORD,
        new_password: NEW_PASSWORD,
        invalidate_other_sessions: false,
      });

      // Afterwards the session is confirmed with GET /auth/me.
      await expect
        .poll(async () => {
          const all = await backendRequests(user.email);
          const changedAt = all.findIndex((request) => request.path === CHANGE_PATH);
          return all.slice(changedAt + 1).some((request) => request.path === '/auth/me');
        })
        .toBe(true);

      // Sign out and sign in again: the new password works, the old one does not.
      await page
        .locator('aside')
        .getByRole('button', { name: t(locale, 'StudentLayout.logout') })
        .click();
      await expect(page).toHaveURL(atPath(`/${locale}/login`), { timeout: REDIRECT_TIMEOUT });

      const stale = await page.request.post('/backend/auth/login', {
        data: { email: user.email, password: OLD_PASSWORD },
      });
      expect(stale.status()).toBe(401);

      await signInThroughTheForm(page, locale, { email: user.email, password: NEW_PASSWORD });
      await expect(page).toHaveURL(atPath(`/${locale}/student/profile`), {
        timeout: REDIRECT_TIMEOUT,
      });
    });

    test('a wrong current password shows the backend message and empties the passwords', async ({
      page,
    }) => {
      const user = await startStudentSession(page);
      await openSettings(page, locale);

      await otherDevices(page, locale).check();
      await fillForm(page, locale, {
        current: 'Not-my-passw0rd!',
        next: NEW_PASSWORD,
        confirm: NEW_PASSWORD,
      });
      await submitButton(page, locale).click();

      await expect(alerts(page)).toHaveCount(1);
      await expect(alerts(page)).toHaveText('Current password is incorrect');
      for (const key of ['currentPassword', 'newPassword', 'confirmPassword'] as const) {
        await expect(field(page, locale, key)).toHaveValue('');
      }
      // The checkbox is not a password: it keeps the student's choice. Focus returns to the
      // first field so they can type again.
      await expect(otherDevices(page, locale)).toBeChecked();
      await expect(field(page, locale, 'currentPassword')).toBeFocused();
      await expect(status(page)).not.toContainText(fb(locale, 'success'));

      const sent = await changeRequests(user.email);
      expect(sent).toHaveLength(1);
      expect(sent[0].status).toBe(400);
      // The account still has its old password.
      const old = await page.request.post('/backend/auth/login', {
        data: { email: user.email, password: OLD_PASSWORD },
      });
      expect(old.ok()).toBe(true);
    });

    test('a new password equal to the current one is blocked on the device', async ({ page }) => {
      const user = await startStudentSession(page);
      await openSettings(page, locale);

      await fillForm(page, locale, {
        current: OLD_PASSWORD,
        next: OLD_PASSWORD,
        confirm: OLD_PASSWORD,
      });
      await submitButton(page, locale).click();

      await expect(page.getByText(val(locale, 'sameAsCurrent'))).toBeVisible();
      expect(await changeRequests(user.email)).toEqual([]);
    });

    test('a mismatched confirmation is blocked on the device and nothing is sent', async ({
      page,
    }) => {
      const user = await startStudentSession(page);
      await openSettings(page, locale);

      await fillForm(page, locale, {
        current: OLD_PASSWORD,
        next: NEW_PASSWORD,
        confirm: 'Different-passw0rd!',
      });
      await submitButton(page, locale).click();

      await expect(page.getByText(val(locale, 'passwordMismatch'))).toBeVisible();
      await expect(field(page, locale, 'confirmPassword')).toHaveAttribute('aria-invalid', 'true');
      // What was typed stays where it is.
      await expect(field(page, locale, 'currentPassword')).toHaveValue(OLD_PASSWORD);
      await expect(field(page, locale, 'newPassword')).toHaveValue(NEW_PASSWORD);
      await expect(status(page)).not.toContainText(fb(locale, 'success'));

      // Asserted on the backend's own log: no request reached it.
      expect(await changeRequests(user.email)).toEqual([]);
    });

    test('an empty form and weak passwords show field errors and send nothing', async ({
      page,
    }) => {
      const user = await startStudentSession(page);
      await openSettings(page, locale);

      await submitButton(page, locale).click();
      await expect(page.getByText(val(locale, 'currentRequired'))).toBeVisible();
      await expect(page.getByText(val(locale, 'newRequired'))).toBeVisible();
      await expect(page.getByText(val(locale, 'confirmRequired'))).toBeVisible();

      const weak: [string, string][] = [
        ['Ab1!xyz', val(locale, 'passwordMin', { count: 8 })],
        ['Password!', val(locale, 'passwordDigit')],
        ['Password1', val(locale, 'passwordSpecial')],
      ];
      for (const [password, message] of weak) {
        await fillForm(page, locale, { current: OLD_PASSWORD, next: password, confirm: password });
        await submitButton(page, locale).click();
        await expect(page.getByText(message, { exact: true })).toBeVisible();
      }

      expect(await changeRequests(user.email)).toEqual([]);
    });

    test('"Sign out of other devices" is off by default and sends the choice', async ({ page }) => {
      const user = await startStudentSession(page);
      await signInSomewhereElse(user);
      expect((await backendState(user.email)).sessionCount).toBe(2);
      await openSettings(page, locale);
      await expect(otherDevices(page, locale)).not.toBeChecked();

      // Off: the other device stays signed in.
      await fillForm(page, locale, {
        current: OLD_PASSWORD,
        next: NEW_PASSWORD,
        confirm: NEW_PASSWORD,
      });
      await submitButton(page, locale).click();
      await expect(status(page)).toContainText(fb(locale, 'success'));
      expect((await backendState(user.email)).sessionCount).toBe(2);

      // On: the other device is signed out; this one is not.
      await otherDevices(page, locale).check();
      await fillForm(page, locale, {
        current: NEW_PASSWORD,
        next: 'An0ther-passw0rd!',
        confirm: 'An0ther-passw0rd!',
      });
      await submitButton(page, locale).click();
      await expect(status(page)).toContainText(fb(locale, 'success'));
      await expect(otherDevices(page, locale)).not.toBeChecked(); // the form was reset

      const sent = await changeRequests(user.email);
      expect(
        sent.map((request) => (request.body as Record<string, unknown>).invalidate_other_sessions)
      ).toEqual([false, true]);
      expect((await backendState(user.email)).sessionCount).toBe(1);

      await page.reload();
      await expect(pageTitle(page, locale, 'settings')).toBeVisible();
    });

    test('the show/hide buttons reveal and hide each password on its own', async ({ page }) => {
      await startStudentSession(page);
      await openSettings(page, locale);

      const toggles = page.getByRole('button', { name: s(locale, 'showPassword'), exact: true });
      await expect(toggles).toHaveCount(3);
      for (const key of ['currentPassword', 'newPassword', 'confirmPassword'] as const) {
        await expect(field(page, locale, key)).toHaveAttribute('type', 'password');
      }

      await toggles.nth(1).click();
      await expect(field(page, locale, 'newPassword')).toHaveAttribute('type', 'text');
      await expect(field(page, locale, 'currentPassword')).toHaveAttribute('type', 'password');
      await expect(field(page, locale, 'confirmPassword')).toHaveAttribute('type', 'password');

      const hide = page.getByRole('button', { name: s(locale, 'hidePassword'), exact: true });
      await expect(hide).toHaveCount(1);
      await expect(hide).toHaveAttribute('aria-pressed', 'true');
      await hide.click();
      await expect(field(page, locale, 'newPassword')).toHaveAttribute('type', 'password');
    });

    test('pressing Enter and clicking again while a request runs sends one request', async ({
      page,
    }) => {
      const user = await startStudentSession(page);
      // Hold the first response so the request is still in flight for the extra attempts.
      await page.route('**/backend/auth/change-password', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        await route.continue();
      });
      await openSettings(page, locale);
      await fillForm(page, locale, {
        current: OLD_PASSWORD,
        next: NEW_PASSWORD,
        confirm: NEW_PASSWORD,
      });

      await field(page, locale, 'confirmPassword').press('Enter');
      await expect(page.getByRole('button', { name: s(locale, 'submitting') })).toBeDisabled();
      await field(page, locale, 'confirmPassword').press('Enter');
      await page.getByRole('button', { name: s(locale, 'submitting') }).click({ force: true });

      await expect(status(page)).toContainText(fb(locale, 'success'));
      expect(await changeRequests(user.email)).toHaveLength(1);
    });

    test('a request that never arrives shows the generic error and keeps the typed values', async ({
      page,
    }) => {
      await startStudentSession(page);
      await page.route('**/backend/auth/change-password', (route) => route.abort('failed'));
      await openSettings(page, locale);

      await fillForm(page, locale, {
        current: OLD_PASSWORD,
        next: NEW_PASSWORD,
        confirm: NEW_PASSWORD,
      });
      await submitButton(page, locale).click();

      await expect(alerts(page)).toHaveText(fb(locale, 'unavailable'));
      await expect(field(page, locale, 'currentPassword')).toHaveValue(OLD_PASSWORD);
      await expect(field(page, locale, 'newPassword')).toHaveValue(NEW_PASSWORD);
      await expect(field(page, locale, 'confirmPassword')).toHaveValue(NEW_PASSWORD);
      await expect(page).toHaveURL(atPath(`/${locale}/student/settings`));
    });

    test('a 5xx shows the generic error, not the server text, and keeps the typed values', async ({
      page,
    }) => {
      await startStudentSession(page);
      await page.route('**/backend/auth/change-password', (route) =>
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'upstream connect error' }),
        })
      );
      await openSettings(page, locale);

      await fillForm(page, locale, {
        current: OLD_PASSWORD,
        next: NEW_PASSWORD,
        confirm: NEW_PASSWORD,
      });
      await submitButton(page, locale).click();

      await expect(alerts(page)).toHaveText(fb(locale, 'unavailable'));
      await expect(page.getByText('upstream connect error')).toHaveCount(0);
      await expect(field(page, locale, 'newPassword')).toHaveValue(NEW_PASSWORD);
    });

    test('a 422 is shown next to the field it names and keeps the typed values', async ({
      page,
    }) => {
      await startStudentSession(page);
      await page.route('**/backend/auth/change-password', (route) =>
        route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: [
              { loc: ['body', 'new_password'], msg: 'Password is too common', type: 'value_error' },
            ],
          }),
        })
      );
      await openSettings(page, locale);

      await fillForm(page, locale, {
        current: OLD_PASSWORD,
        next: NEW_PASSWORD,
        confirm: NEW_PASSWORD,
      });
      await submitButton(page, locale).click();

      await expect(page.getByText('Password is too common')).toBeVisible();
      await expect(field(page, locale, 'newPassword')).toHaveAttribute('aria-invalid', 'true');
      await expect(field(page, locale, 'currentPassword')).toHaveValue(OLD_PASSWORD);
      await expect(field(page, locale, 'newPassword')).toHaveValue(NEW_PASSWORD);
    });

    test('a 422 that names no field of the form is a form-level alert', async ({ page }) => {
      await startStudentSession(page);
      await page.route('**/backend/auth/change-password', (route) =>
        route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: [{ loc: ['body'], msg: 'Request body is not acceptable', type: 'value_error' }],
          }),
        })
      );
      await openSettings(page, locale);

      await fillForm(page, locale, {
        current: OLD_PASSWORD,
        next: NEW_PASSWORD,
        confirm: NEW_PASSWORD,
      });
      await submitButton(page, locale).click();

      await expect(alerts(page)).toHaveText('Request body is not acceptable');
      await expect(field(page, locale, 'newPassword')).toHaveValue(NEW_PASSWORD);
    });

    test('a session the change ended sends the student to login and back to Settings', async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const user = await startStudentSession(page, { revokeSessionOnPasswordChange: true });
      await openSettings(page, locale);

      await fillForm(page, locale, {
        current: OLD_PASSWORD,
        next: NEW_PASSWORD,
        confirm: NEW_PASSWORD,
      });
      await submitButton(page, locale).click();

      await expect(page).toHaveURL(
        (url) =>
          url.pathname === `/${locale}/login` &&
          url.searchParams.get('next') === '/student/settings',
        { timeout: REDIRECT_TIMEOUT }
      );

      await signInThroughTheForm(page, locale, { email: user.email, password: NEW_PASSWORD });
      await expect(page).toHaveURL(atPath(`/${locale}/student/settings`), {
        timeout: REDIRECT_TIMEOUT,
      });
      await expect(pageTitle(page, locale, 'settings')).toBeVisible({ timeout: REDIRECT_TIMEOUT });
    });

    test('a request refused with 401 re-checks the session and goes to login', async ({ page }) => {
      test.setTimeout(60_000);
      const user = await startStudentSession(page);
      await openSettings(page, locale);

      // The session ends elsewhere (the browser also drops the cookie), then the form is sent.
      await page.request.post('/backend/auth/logout');
      await fillForm(page, locale, {
        current: OLD_PASSWORD,
        next: NEW_PASSWORD,
        confirm: NEW_PASSWORD,
      });
      await submitButton(page, locale).click();

      await expect(page).toHaveURL(
        (url) =>
          url.pathname === `/${locale}/login` &&
          url.searchParams.get('next') === '/student/settings',
        { timeout: REDIRECT_TIMEOUT }
      );
      // The password was never changed.
      const stillOld = await page.request.post('/backend/auth/login', {
        data: { email: user.email, password: OLD_PASSWORD },
      });
      expect(stillOld.ok()).toBe(true);
    });

    test('on desktop the sidebar link above Log out opens Settings and shows as active', async ({
      page,
    }) => {
      await startStudentSession(page);
      await page.goto(`/${locale}/student/profile`);

      const aside = page.locator('aside');
      const label = t(locale, 'StudentLayout.settings');
      const link = aside.getByRole('link', { name: label, exact: true });
      const logout = aside.getByRole('button', { name: t(locale, 'StudentLayout.logout') });
      await expect(link).toBeVisible();
      await expect(link).not.toHaveAttribute('aria-current', 'page');

      // Directly above Log out, in the same footer, with the icon and label on the same line.
      const linkBox = (await link.boundingBox())!;
      const logoutBox = (await logout.boundingBox())!;
      const gap = logoutBox.y - (linkBox.y + linkBox.height);
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThan(16);
      expect(Math.abs(linkBox.x - logoutBox.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(linkBox.width - logoutBox.width)).toBeLessThanOrEqual(1);
      const iconX = async (row: typeof link) => (await row.locator('svg').boundingBox())!.x;
      expect(Math.abs((await iconX(link)) - (await iconX(logout)))).toBeLessThanOrEqual(1);

      // Not a navigation item.
      await expect(
        sidebar(page, locale).getByRole('link', { name: label, exact: true })
      ).toHaveCount(0);

      await link.click();
      await expect(page).toHaveURL(atPath(`/${locale}/student/settings`));
      await expect(pageTitle(page, locale, 'settings')).toBeVisible();
      await expect(field(page, locale, 'currentPassword')).toBeVisible();

      // Active, and the only active item: Settings activates nothing in the list.
      await expect(link).toHaveAttribute('aria-current', 'page');
      await expect(aside.locator('[aria-current="page"]')).toHaveCount(1);
    });

    test('on a tablet the drawer carries the same link and closes when it is used', async ({
      page,
    }) => {
      await startStudentSession(page);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`/${locale}/student/profile`);

      await page.getByRole('button', { name: t(locale, 'StudentLayout.openNavigation') }).click();
      const drawer = page.getByRole('dialog', {
        name: t(locale, 'StudentLayout.navigationLabel'),
      });
      const link = drawer.getByRole('link', {
        name: t(locale, 'StudentLayout.settings'),
        exact: true,
      });
      await expect(link).toBeVisible();

      await link.click();
      await expect(page).toHaveURL(atPath(`/${locale}/student/settings`));
      await expect(pageTitle(page, locale, 'settings')).toBeVisible();
      await expect(drawer).toHaveCount(0);
    });

    test('on a 390px phone the page fits and the account menu leads to Settings', async ({
      page,
    }) => {
      await startStudentSession(page, { name: 'Layla Student' });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${locale}/student/profile`);

      // The entry point: account menu > Settings.
      await page.getByRole('button', { name: t(locale, 'StudentLayout.userMenu.label') }).click();
      const item = page.getByRole('menuitem', {
        name: t(locale, 'StudentLayout.userMenu.settings'),
      });
      await expect(item).toBeVisible();
      await expect(
        page.getByRole('menuitem', { name: t(locale, 'StudentLayout.logout') })
      ).toBeVisible();
      await item.click();

      await expect(page).toHaveURL(atPath(`/${locale}/student/settings`));
      await expect(field(page, locale, 'currentPassword')).toBeVisible();

      // No sideways scroll, and every control sits inside the screen.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
      for (const locator of [
        field(page, locale, 'currentPassword'),
        field(page, locale, 'newPassword'),
        field(page, locale, 'confirmPassword'),
        submitButton(page, locale),
      ]) {
        const box = (await locator.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(390);
      }
      // Touch targets: the inputs and the button are at least 44px tall.
      for (const locator of [field(page, locale, 'currentPassword'), submitButton(page, locale)]) {
        expect((await locator.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }

      // The page's own content follows the language direction.
      const direction = await page
        .getByRole('main')
        .evaluate((main) => getComputedStyle(main).direction);
      expect(direction).toBe(locale === 'ar' ? 'rtl' : 'ltr');
    });
  });
}
