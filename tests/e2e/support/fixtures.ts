import { test as base, expect, type Page } from '@playwright/test';
import { seedStudent, type SeedOptions, type SeededUser } from './backend';
import { isRemoteTarget } from './env';
import { t, type Locale } from './messages';

export { expect, t };
export { LOCALES } from './messages';
export type { Locale, SeededUser };

const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

// What the browser would fetch from third parties on the profile and auth pages. Local runs
// answer them here and abort anything else that leaves the machine, so no test depends on
// the network. Remote runs (E2E_BASE_URL) are read-only and leave the network alone.
const THIRD_PARTY_STUBS: [RegExp, unknown][] = [
  [
    /countries\.dev\/countries/,
    [
      { name: 'Palestine', alpha2Code: 'PS', callingCodes: ['970'], flag: '🇵🇸' },
      { name: 'Germany', alpha2Code: 'DE', callingCodes: ['49'], flag: '🇩🇪' },
    ],
  ],
  [/api\.openalex\.org\//, { meta: { count: 0 }, results: [] }],
  [/cdn\.simplelocalize\.io\//, []],
];

export const test = base.extend<{ hermeticNetwork: void }>({
  hermeticNetwork: [
    async ({ context }, use) => {
      if (!isRemoteTarget) {
        await context.route(
          (url) => !['127.0.0.1', 'localhost'].includes(url.hostname),
          (route) => {
            const stub = THIRD_PARTY_STUBS.find(([pattern]) => pattern.test(route.request().url()));
            return stub ? route.fulfill(json(stub[1])) : route.abort();
          }
        );
      }
      await use();
    },
    { auto: true },
  ],
});

/** Seeds a verified student in the fake backend and signs the browser in as them. */
export async function startStudentSession(page: Page, options: SeedOptions = {}) {
  const user = await seedStudent(options);
  await signIn(page, user);
  return user;
}

/** Signs in through the app's own /backend proxy, so the session cookie is first-party. */
export async function signIn(page: Page, user: Pick<SeededUser, 'email' | 'password'>) {
  const response = await page.request.post('/backend/auth/login', {
    data: { email: user.email, password: user.password },
  });
  expect(response.ok(), `sign in as ${user.email}`).toBe(true);
}

/**
 * A signed-in student for specs that also run against a deployed environment. Local runs
 * seed a fresh account; remote runs sign in with E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD
 * from the environment (never from the repo).
 */
export async function startReadonlySession(page: Page) {
  if (!isRemoteTarget) return startStudentSession(page);
  const email = process.env.E2E_STUDENT_EMAIL;
  const password = process.env.E2E_STUDENT_PASSWORD;
  if (!email || !password) {
    throw new Error('Set E2E_STUDENT_EMAIL and E2E_STUDENT_PASSWORD to run against E2E_BASE_URL');
  }
  await signIn(page, { email, password });
  return { id: 0, email, password };
}

/** The student sidebar. The mobile drawer is a separate element, so this is the desktop one. */
export const sidebar = (page: Page, locale: Locale) =>
  page.getByRole('navigation', { name: t(locale, 'StudentLayout.navigationLabel') }).first();

/** Matches the current URL by exact pathname; use with expect(page).toHaveURL(...). */
export const atPath = (pathname: string) => (url: URL) => url.pathname === pathname;

/** The page title in the student header. Some pages repeat it as their own h1, so scope to the banner. */
export const pageTitle = (page: Page, locale: Locale, key: string, params = {}) =>
  page.getByRole('banner').getByRole('heading', {
    level: 1,
    name: t(locale, `StudentLayout.pages.${key}.title`, params),
  });
