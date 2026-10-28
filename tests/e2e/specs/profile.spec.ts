import type { Page } from '@playwright/test';
import { backendRequests, backendState } from '../support/backend';
import { expect, LOCALES, startStudentSession, t, test, type Locale } from '../support/fixtures';

const STORED = {
  full_name_ar: 'محمد أحمد خالد الحسن',
  full_name_en: 'Mohammad Ahmad Khaled Hassan',
  email: 'mohammad@e2e.test',
  birth_date: '2000-01-15',
  gender: 'MALE',
  nationality: 'PS',
  country_of_residence: 'PS',
  financial_status: 'LIMITED',
};

const EDITED = {
  full_name_ar: 'سارة محمد علي الأحمد',
  full_name_en: 'Sara Mohammad Ali Ahmad',
};

const arabicNameField = (page: Page, locale: Locale) =>
  page.getByLabel(t(locale, 'PersonalInformation.fields.firstName'));
const englishNameField = (page: Page, locale: Locale) =>
  page.getByLabel(t(locale, 'PersonalInformation.fields.lastName'));

// The form's submit button. Its label is "حفظ ومتابعة" in every language (the card ignores the
// translated PersonalInformation.save), so it is found by type rather than by name.
const saveButton = (page: Page, locale: Locale) =>
  page
    .locator('form')
    .filter({ has: arabicNameField(page, locale) })
    .locator('button[type="submit"]');

for (const locale of LOCALES) {
  test(`personal information saves both full names and shows them after a reload (${locale})`, async ({
    page,
  }) => {
    const user = await startStudentSession(page, { personal: STORED });
    await page.goto(`/${locale}/student/profile`);

    // The stored names arrive from the backend before the form is edited.
    await expect(arabicNameField(page, locale)).toHaveValue(STORED.full_name_ar);
    await expect(englishNameField(page, locale)).toHaveValue(STORED.full_name_en);

    await arabicNameField(page, locale).fill(EDITED.full_name_ar);
    await englishNameField(page, locale).fill(EDITED.full_name_en);
    await saveButton(page, locale).click();

    // "Save and continue": a successful save moves on to the Academic step, and the profile
    // summary above shows both new names.
    await expect(
      page.getByRole('heading', { level: 2, name: t(locale, 'AcademicInformation.title') })
    ).toBeVisible();
    await expect(
      page
        .getByRole('heading', { level: 2 })
        .filter({ hasText: EDITED.full_name_ar })
        .filter({ hasText: EDITED.full_name_en })
    ).toBeVisible();

    // The backend got the names under its own field names, with nothing else changed.
    const [save] = await backendRequests(user.email, '/profile/personal-info');
    expect(save.method).toBe('PUT');
    expect(save.status).toBe(200);
    expect(save.body).toEqual({
      ...STORED,
      ...EDITED,
      phone_number: undefined,
      city: undefined,
      id_number: undefined,
      passport_number: undefined,
    });
    expect((await backendState(user.email)).personal).toMatchObject(EDITED);

    await page.reload();

    await expect(arabicNameField(page, locale)).toHaveValue(EDITED.full_name_ar);
    await expect(englishNameField(page, locale)).toHaveValue(EDITED.full_name_en);
  });
}

test('a name that is not four parts is rejected before anything is sent', async ({ page }) => {
  const user = await startStudentSession(page, { personal: STORED });
  await page.goto('/en/student/profile');
  await expect(englishNameField(page, 'en')).toHaveValue(STORED.full_name_en);

  await englishNameField(page, 'en').fill('Sara Ahmad');
  await saveButton(page, 'en').click();

  await expect(
    page.getByText(t('en', 'PersonalInformation.validation.lastNameFourParts'))
  ).toBeVisible();
  expect(await backendRequests(user.email, '/profile/personal-info')).toHaveLength(0);
});
