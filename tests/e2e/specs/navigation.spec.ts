import { expect, LOCALES, sidebar, startStudentSession, t, test } from '../support/fixtures';

// With the features on (project "flags-on") the sidebar lists every destination, in order.
const ORDER = ['home', 'scholarships', 'saved', 'tracking', 'profile'] as const;

for (const locale of LOCALES) {
  test(`the sidebar lists Home, search, Saved, tracking and profile in order (${locale})`, async ({
    page,
  }) => {
    await startStudentSession(page);
    await page.goto(`/${locale}/student/profile`);

    await expect(sidebar(page, locale).getByRole('link')).toHaveText(
      ORDER.map((key) => t(locale, `StudentLayout.nav.${key}`))
    );
  });
}
