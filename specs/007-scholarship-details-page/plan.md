# Technical Implementation Plan: 007-scholarship-details-page

## 1. Architecture & Feature Scaffolding

Sub-feature directory: `src/features/student/scholarship-details/`

- `api/scholarship-details.ts`: Client API wrapper `getScholarshipDetails(id, signal)` calling `GET /api/scholarships/${id}` with contract validation.
- `lib/validateDetailsResponse.ts`: Strict response validator `validateDetailsResponse(raw)` and typed `DetailsContractError`.
- `hooks/useScholarshipDetailsQuery.ts`: React Query hook wrapping `getScholarshipDetails` with retry rules.
- `components/ScholarshipDetailsView.tsx`: Presentational view matching Figma design (Hero, Facts grid, Majors, Eligibility, Documents, Actions card).
- `components/ScholarshipDetailsPage.tsx`: Interactive container component handling query loading/error states and document title updating.
- `types.ts`: Re-exporting `ScholarshipDetailsModel` and `ScholarshipDetailsResponse`.
- `index.ts`: Module barrel export.

---

## 2. Feature Flag Reconciliation

Server-only feature flag added in `src/lib/feature-flags.ts`:

```ts
get scholarshipDetailsEnabled(): boolean {
  return process.env.SCHOLARSHIP_DETAILS_ENABLED === 'true';
}
```

Client link visibility in `details-link.ts`:

- `getScholarshipDetailsHref(id: number, enabled: boolean = true)` takes explicit `enabled` parameter.
- `SCHOLARSHIP_DETAILS_ROUTE_ENABLED` legacy constant kept with `@deprecated` JSDoc tag for backwards-compatibility without runtime bypass.

---

## 3. Route Component

Path: `src/app/[locale]/student/scholarships/[id]/page.tsx`

- Server Component checking `featureFlags.scholarshipDetailsEnabled`.
- Calls `notFound()` if flag is OFF or if route `[id]` fails safe integer validation (`Number.isSafeInteger(numId) && numId > 0`).
- Delegates rendering to `<ScholarshipDetailsPage rawId={id} />`.

---

## 4. Verification Plan

### Automated Test Suite

- `node --test --test-isolation=none tests/student-scholarship-details.test.mjs`
- `node --test --test-isolation=none tests/student-saved-scholarships.test.mjs`
- `pnpm test:student-layout`
- `pnpm test:i18n`
- `pnpm test:scholarship-discovery`
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm build`
