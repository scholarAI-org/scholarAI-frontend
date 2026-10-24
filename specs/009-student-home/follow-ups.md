# Follow-ups found during 009 (not fixed in this branch)

Each note is written so it can be copied into a task. None of these is caused by Student Home; they were found while verifying it. Baseline = `main` at `18c1453`, measured 2026-10-24, Node 24.22.1 on Windows.

---

## 1. Direction-dependent icons flip the wrong way on English pages

**Symptom**: on any `/en/...` page the sidebar's logout arrow is rotated 180° (measured in a browser: computed `rotate: 180deg` while the content `direction` is `ltr`). The same happens to the other `rtl:` classes listed below.

**Root cause**: `src/app/layout.tsx` hard-codes `<html lang="ar" dir="rtl">`. The real direction is only set one level down, on a wrapper `<div dir={dir}>` in `src/app/[locale]/layout.tsx`. Tailwind's `rtl:` variant also matches `[dir="rtl"] *`, so every element on every page, including English ones, matches it.

**Proposed fix** (smallest first):

- Replace `rtl:<utility>` with `[&:dir(rtl)]:<utility>` in the files below. `:dir()` uses the element's real directionality and is what Student Home already does (guarded by a test in `tests/student-home.test.mjs`).
- Longer term: make `<html lang dir>` locale-aware (needs the locale in the root layout), then `rtl:` is safe again.

**Files** (`rtl:` usages outside Student Home):

- `src/features/student/layout/StudentSidebar.tsx` (logout icon, line ~138)
- `src/features/student/scholarship-discovery/components/ScholarshipDetailsView.tsx` (external-link icon, `rtl:-scale-x-100`)
- `src/features/student/scholarship-discovery/components/DiscoveryFiltersDialog.tsx` (line ~124)
- `src/features/admin/components/AdminSidebar.tsx`
- `src/features/admin/manual-scholarship/components/ManualScholarshipForm.tsx`
- `src/features/admin/scholarship-review/components/ScholarshipReviewDetailPage.tsx`
- `src/features/admin/scholarship-review/components/ScholarshipReviewEditPage.tsx`
- `src/components/profile/ProfileField.tsx` (`rtl:text-right ltr:text-left`; check whether it has the same effect)

**Check**: load each page in `/en` and `/ar` and confirm the icon points the same way as the text flow. Add a static test like the Home one (no bare `rtl:` in the files above).

---

## 2. `tests/google-auth.test.mjs` fails: it imports a module that no longer exists

**Symptom**: the whole file fails with `Cannot find module src/lib/auth-storage.ts` (1 test, 0 pass).

**Root cause**: commit `25a22ac` ("migrate to cookie session auth") deleted `src/lib/auth-storage.ts` (token storage in `localStorage`/`sessionStorage`). The test still imports `setToken/getToken/clearToken` from it and has a test about storing the returned JWT. With cookie auth there is no token to store.

**Proposed fix**: in `tests/google-auth.test.mjs` remove the `auth-storage` import, the `mockSessionStorage`/`mockLocalStorage` setup and the test "stores returned application JWT without saving Google credential as app token". Keep "googleAuth function formats request body with credential key". Verified on a throwaway copy: with the import removed the remaining 3 tests pass and only the obsolete JWT-storage test fails, so deleting it is the whole fix.

**Files**: `tests/google-auth.test.mjs` only.

---

## 3. `tests/profile-personal-information.test.mjs`: 7 of 8 tests fail because the schema was tightened after the tests were written

**Symptom**: 7 failures (`ZodError` with `validation.firstNameArabic`, `validation.firstNameFourParts`, `validation.lastNameFourParts`, `validation.financialSituation`, plus assertion failures that follow from the same inputs).

**Root cause**: the tests were written on 2026-09-06 (`0fe2cdf`). The next day `0e00e22` changed `createPersonalInformationSchema` in `src/features/profile/schemas/personal-information.schema.ts` so that:

- `firstName` must be Arabic letters and at least 4 words,
- `lastName` must be English letters and at least 4 words,
- `financialSituation` is required (no empty value).

The test fixture still uses `first_name: 'Sara'`, `last_name: 'Ahmad'`, and the "omits blank optional fields" test blanks `financialSituation`, which is now invalid.

**Proposed fix**: update the fixture to valid values (a four-part Arabic first name and a four-part English last name) and change the "omits blank optionals" test so `financialSituation` stays filled. Re-check the expectations in the "completion" and "calling code" tests against the new rules.

**Open question for backend/product** (not a test fix): `docs/api/openapi.json` describes personal info with `full_name_ar` / `full_name_en`, while the frontend field map sends `first_name` / `last_name` (`src/features/profile/lib/personal-information.ts`, `personalInformationFieldMap`). Confirm which contract the deployed backend accepts. If the backend moved to `full_name_*`, the profile save is broken in production, which is more important than the tests.

**Files**: `tests/profile-personal-information.test.mjs`; read `src/features/profile/schemas/personal-information.schema.ts` and `src/features/profile/lib/personal-information.ts`.

---

## 4. `tests/student-scholarship-discovery.test.mjs`: image-fallback test fails on Windows only

**Symptom**: "the image fallback is a local asset and the img exception exists exactly once" fails (91 of 92 pass).

**Root cause**: the test builds relative paths with `path.relative(...)` and compares them to a string with forward slashes. On Windows the separator is `\`, so `features\student\scholarship-discovery\components\ScholarshipImage.tsx` is not equal to `features/student/scholarship-discovery/components/ScholarshipImage.tsx`. It should pass on Linux/macOS, so CI likely hides it.

**Proposed fix**: normalize separators before comparing, e.g. `.map((file) => path.relative(srcPath, file).split(path.sep).join('/'))` in the test around line 841.

**Files**: `tests/student-scholarship-discovery.test.mjs` (around lines 833–846).

---

Other follow-ups specific to this feature (landing page, Tracking type consolidation, personalized recommendations, the unauthenticated recommendations feed) are in `verification.md` §5 and `contract-notes.md` §2.
