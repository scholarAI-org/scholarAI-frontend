# Tasks: 007-scholarship-details-page

## Task Progress

### Task 1 — Feature flag reconciliation

- [x] Extend `src/lib/feature-flags.ts` with `scholarshipDetailsEnabled` getter (`process.env.SCHOLARSHIP_DETAILS_ENABLED === 'true'`).
- [x] Add `SCHOLARSHIP_DETAILS_ENABLED=` to `.env.example`.
- [x] Refactor `details-link.ts` signature `getScholarshipDetailsHref(id, enabled)` to accept `enabled` boolean.
- [x] Update discovery card component tree (`ScholarshipCardParts`, `ScholarshipGridCard`, `ScholarshipListRow`, `ScholarshipResults`, `ScholarshipDiscoveryPage`) to pass down `detailsEnabled` from server page.

### Task 2 — Route page ([id]/page.tsx)

- [x] Create server component `src/app/[locale]/student/scholarships/[id]/page.tsx`.
- [x] Validate positive safe integer `id`. Call `notFound()` on non-numeric, 0, negative, or invalid IDs.
- [x] Call `notFound()` when `featureFlags.scholarshipDetailsEnabled` is false.

### Task 3 — Feature module scaffolding

- [x] Create `src/features/student/scholarship-details/` module.
- [x] Implement response validator `validateDetailsResponse.ts` and `DetailsContractError`.
- [x] Implement API wrapper `api/scholarship-details.ts`.
- [x] Implement React Query hook `hooks/useScholarshipDetailsQuery.ts`.
- [x] Implement presentation view `components/ScholarshipDetailsView.tsx`.
- [x] Implement page container `components/ScholarshipDetailsPage.tsx`.

### Task 4 — UI match to Figma

- [x] Implement Desktop (2481-4537), Tablet (3610:8390), and Mobile (3606:11330) layouts.
- [x] Implement Hero Banner, Facts Grid (8 fields), Majors List, Eligibility Criteria, and Required Documents.
- [x] Implement Sticky Sidebar Actions Card with Apply Now CTA button, Bookmark toggle pill, and contact links.
- [x] Add external link hints (`<NewTabHint>`) and accessibility focus rings.

### Task 5 — i18n

- [x] Localize namespace `StudentScholarshipDetails.*` in `src/messages/ar.json` and `src/messages/en.json`.
- [x] Ensure 100% key parity and proper Arabic plurals (`=0`, `one`, `two`, `few`, `many`, `other`).
- [x] Add `StudentScholarshipDetails` to `tests/i18n-numerals.test.mjs`.

### Task 6 — Tests & Verification

- [x] Create `tests/student-scholarship-details.test.mjs` covering route validation, feature flag, response validator, localized 401/403/404/5xx error states, i18n key parity, ICU `#` check, and single active nav.
- [x] Pass full test and build verification pipeline.

### Gate 1 Close-out

- [x] Execute Gate 1 pre-push audit and documentation updates.
