import { backendState, fetchCatalog, titleIn } from '../support/backend';
import {
  atPath,
  expect,
  LOCALES,
  sidebar,
  startStudentSession,
  t,
  test,
} from '../support/fixtures';

// PENDING: start tracking a scholarship. These stay `test.fixme` (never run) until the
// start-tracking UI is on the branch under test.
//
// The UI lives on `feat/008b-tracking-finish` (commit 53a4ee4, "start tracking from a
// scholarship card and the details page"). This branch does not have it: the app here has
// no "Track application" control and no client call for PUT /api/scholarships/{id}/tracking.
//
// To enable once feat/008b-tracking-finish is merged and this branch is rebased on main:
//   1. Change `test.fixme` to `test` below.
//   2. Teach the fake backend (tests/e2e/fake-backend/server.mjs) the start endpoint:
//      PUT /api/scholarships/{id}/tracking with { status } creates the tracked row for the
//      signed-in user (idempotent per scholarship) and answers { status, updated_at }. It
//      returns no tracking id, so the Tracking page learns it from GET /tracked afterwards.
//      Unknown scholarship -> 404, as the app maps 404/403 to messages. GET answers the same
//      shape (404 when not tracked).
//   3. The messages used below (StudentTracking.track.*) arrive with that branch.
//   4. `E2E_REBUILD=1 pnpm test:e2e`, the Track control is gated by TRACKING_ENABLED, which
//      the flags-on server already sets. Details-page entry point: also needs
//      SCHOLARSHIP_DETAILS_ENABLED, which the servers leave off; cover it separately.
//   5. Then drop the "seeded because" note in docs/e2e/README.md ("What is not covered").
//
// The new tracking is started in `preparing_documents` (DEFAULT_START_STATUS on that branch).

for (const locale of LOCALES) {
  test.fixme(`start tracking from a scholarship card and find it on the Tracking page (${locale})`, async ({
    page,
  }) => {
    const catalog = await fetchCatalog();
    const aurora = catalog.find((s) => s.title_en === 'Aurora Scholarship')!;
    const title = titleIn(locale, aurora);
    const user = await startStudentSession(page);
    await page.goto(`/${locale}/student/scholarships?search=aurora`);

    await page
      .getByRole('button', { name: t(locale, 'StudentTracking.track.startFor', { title }) })
      .click();

    // The control flips at once to "Tracking: Preparing documents" and links to the Tracking page.
    await expect(
      page.getByRole('link', { name: t(locale, 'StudentTracking.track.trackingFor', { title }) })
    ).toBeVisible();
    await expect
      .poll(async () =>
        (await backendState(user.email)).tracked.map((row) => [row.scholarship_id, row.status])
      )
      .toEqual([[aurora.id, 'preparing_documents']]);

    await sidebar(page, locale)
      .getByRole('link', { name: t(locale, 'StudentLayout.nav.tracking') })
      .click();

    await expect(page).toHaveURL(atPath(`/${locale}/student/tracking`));
    const card = page.getByTestId('tracking-card').filter({ hasText: title });
    await expect(
      card.getByRole('combobox', {
        name: `${t(locale, 'StudentTracking.card.statusLabel')}: ${title}`,
      })
    ).toHaveValue('preparing_documents');
    await expect(page.getByTestId('tracking-card-preparing_documents')).toContainText('1');
  });
}
