import type { Page } from '@playwright/test';
import { backendState, fetchCatalog, titleIn } from '../support/backend';
import { expect, LOCALES, startStudentSession, t, test, type Locale } from '../support/fixtures';

const tr = (locale: Locale, key: string, params = {}) =>
  t(locale, `StudentTracking.${key}`, params);

const card = (page: Page, title: string) =>
  page.getByTestId('tracking-card').filter({ hasText: title });

const summary = (page: Page, status: string) => page.getByTestId(`tracking-card-${status}`);

// The app has no "start tracking" action yet, so each test begins with applications the
// backend already holds: scholarship 4 (no note) and 6 (with a note), plus 2 only saved.
const SEED = {
  saved: [2],
  tracked: [
    { scholarship_id: 4, status: 'preparing_documents' },
    { scholarship_id: 6, status: 'applied', notes: 'Bring the transcript' },
  ],
};

async function openTracking(page: Page, locale: Locale) {
  const catalog = await fetchCatalog();
  const titleOf = (id: number) =>
    titleIn(
      locale,
      catalog.find((s) => s.id === id)!
    );
  const user = await startStudentSession(page, SEED);
  await page.goto(`/${locale}/student/tracking`);
  return { user, preparing: titleOf(4), applied: titleOf(6) };
}

const trackedStatus = async (email: string, scholarshipId: number) =>
  (await backendState(email)).tracked.find((row) => row.scholarship_id === scholarshipId);

for (const locale of LOCALES) {
  test.describe(`application tracking (${locale})`, () => {
    test('lists the tracked applications with their status and counts', async ({ page }) => {
      const { preparing, applied } = await openTracking(page, locale);

      await expect(card(page, preparing)).toBeVisible();
      await expect(card(page, applied)).toBeVisible();
      await expect(
        card(page, preparing).getByRole('combobox', {
          name: `${tr(locale, 'card.statusLabel')}: ${preparing}`,
        })
      ).toHaveValue('preparing_documents');
      await expect(card(page, applied)).toContainText('Bring the transcript');

      // One saved-only, one preparing, one applied, none accepted.
      await expect(summary(page, 'saved')).toContainText('1');
      await expect(summary(page, 'preparing_documents')).toContainText('1');
      await expect(summary(page, 'applied')).toContainText('1');
      await expect(summary(page, 'accepted')).toContainText('0');
    });

    test('changing the status is saved and moves the counters', async ({ page }) => {
      const { user, preparing } = await openTracking(page, locale);
      const select = card(page, preparing).getByRole('combobox', {
        name: `${tr(locale, 'card.statusLabel')}: ${preparing}`,
      });

      await select.selectOption('accepted');

      await expect(summary(page, 'accepted')).toContainText('1');
      await expect(summary(page, 'preparing_documents')).toContainText('0');
      await expect.poll(async () => (await trackedStatus(user.email, 4))?.status).toBe('accepted');

      await page.reload();
      await expect(select).toHaveValue('accepted');
    });

    test('adds a note and edits an existing one', async ({ page }) => {
      const { user, preparing, applied } = await openTracking(page, locale);

      await card(page, preparing)
        .getByRole('button', { name: tr(locale, 'note.editLabel', { title: preparing }) })
        .click();
      await card(page, preparing)
        .getByTestId('tracking-note-input')
        .fill('Ask the advisor for a reference letter');
      await card(page, preparing)
        .getByRole('button', { name: tr(locale, 'note.save'), exact: true })
        .click();

      await expect(card(page, preparing)).toContainText('Ask the advisor for a reference letter');
      await expect
        .poll(async () => (await trackedStatus(user.email, 4))?.notes)
        .toBe('Ask the advisor for a reference letter');

      await card(page, applied)
        .getByRole('button', { name: tr(locale, 'note.editLabel', { title: applied }) })
        .click();
      await card(page, applied).getByTestId('tracking-note-input').fill('Transcript sent');
      await card(page, applied)
        .getByRole('button', { name: tr(locale, 'note.save'), exact: true })
        .click();

      await expect(card(page, applied)).toContainText('Transcript sent');
      await expect(card(page, applied)).not.toContainText('Bring the transcript');
      await expect
        .poll(async () => (await trackedStatus(user.email, 6))?.notes)
        .toBe('Transcript sent');
    });

    test('stopping tracking removes the application but keeps the saved scholarship', async ({
      page,
    }) => {
      const { user, preparing, applied } = await openTracking(page, locale);

      await card(page, preparing)
        .getByRole('button', { name: tr(locale, 'card.removeLabel', { title: preparing }) })
        .click();
      await page
        .getByTestId('tracking-remove-dialog')
        .getByRole('button', { name: tr(locale, 'remove.confirm') })
        .click();

      await expect(card(page, preparing)).toHaveCount(0);
      await expect(card(page, applied)).toBeVisible();
      await expect(summary(page, 'preparing_documents')).toContainText('0');
      await expect.poll(async () => (await trackedStatus(user.email, 4)) ?? null).toBeNull();
      expect((await backendState(user.email)).savedIds).toEqual([2]);

      // Removing the last one leaves the empty state.
      await card(page, applied)
        .getByRole('button', { name: tr(locale, 'card.removeLabel', { title: applied }) })
        .click();
      await page
        .getByTestId('tracking-remove-dialog')
        .getByRole('button', { name: tr(locale, 'remove.confirm') })
        .click();
      await expect(page.getByRole('heading', { name: tr(locale, 'empty.heading') })).toBeVisible();
    });
  });
}
