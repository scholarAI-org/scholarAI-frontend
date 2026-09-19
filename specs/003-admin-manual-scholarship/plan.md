# Implementation Plan: Admin Manual Scholarship Creation

**Feature**: `003-admin-manual-scholarship`  
**Specification**: [spec.md](./spec.md)  
**Prerequisites**: `001-admin-application-shell`, `002-admin-dashboard`

## Technical Context

| Area                 | Decision                                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route and protection | Add `src/app/[locale]/admin/scholarships/new/page.tsx`. It inherits the existing admin layout, `RoleGuard`, `AdminShell`, authentication, and locale behavior.                                       |
| Heading              | Generalize the shell-owned page-metadata lookup so `AdminHeader` gets the localized manual-create title/description from route metadata; do not render a second page-global heading inside the form. |
| Form                 | Follow existing React Hook Form + Zod + `zodResolver` conventions. Use controlled form state only for editable payload fields.                                                                       |
| Transport            | Use a feature-local `api/create-manual-scholarship.ts` function over shared `apiClient`; cookies remain the only authentication transport.                                                           |
| Server state         | Use one focused React Query `useMutation`. Do not copy mutation/server state into `AuthProvider`, Zustand, or local storage.                                                                         |
| Navigation           | Use `Link`/`useRouter` from `@/i18n/navigation` with internal paths such as `/admin/dashboard` and `/admin/scholarships/new`, never hand-built locale prefixes.                                      |
| Feedback             | No shared toast convention exists in the checked frontend. Use a localized inline `aria-live` success/error feedback pattern consistent with existing forms.                                         |
| Styling              | Reuse current Tailwind/tokens, `Button`, `Input`, `Checkbox`, and accessible form conventions. Use responsive grid/flex; adapt Figma hierarchy, not its generated absolute-position code.            |

## Finalized Backend Contract

The plan proceeds on the supplied assumption that `POST /api/scholarships/`
accepts this manual-create payload and backend owns initial `pending` status:

```ts
type CreateManualScholarshipPayload = {
  ingestion_type: 'manual';
  title_ar: string;
  title_en: string;
  organization_name: string;
  country: string;
  university_name?: string | null;
  study_level: string;
  funding_type: string;
  funding_amount?: string | null;
  deadline?: string | null;
  no_deadline: boolean;
  majors?: string[] | null;
  language_requirements?: string[] | null;
  eligibility_criteria?: string[] | null;
  required_documents?: string[] | null;
  apply_link: string;
  image_url: string;
  source_url?: string | null;
  description_html?: string | null;
  apply_email?: string | null;
  apply_phone?: string | null;
};
```

The frontend always sends `ingestion_type: 'manual'`, never exposes or sends a
selected status, and does not synthesize legacy `title` or system fields such
as `source`, `source_id`, or reviewer/scrape metadata.

## Existing-Convention Decisions

- **Study level and funding type**: current enums are profile-preference
  taxonomies, not an authoritative scholarship taxonomy. Use required text
  inputs with non-empty validation rather than inventing dropdown values.
- **Country**: reuse `useCountries`/`public/data/countries.json` as a discovery
  source for an accessible country text input (for example, localized datalist
  suggestions). Submit the selected/entered scholarship country string; do not
  silently submit the profile dataset's ISO value as the scholarship contract.
- **Structured arrays**: keep each multiline raw value in form state; a pure
  `toTrimmedLines` helper produces `string[] | null` at submission time. Empty
  lines are ignored; comma splitting is never used.
- **Description**: render `description_html` as a normal textarea. Do not add a
  rich-text library, auto-generate markup, or render the entered content.
- **Existing controls**: `FormField` is suitable for labelled text inputs and
  associated field errors. Add a feature-level labelled textarea/select-input
  wrapper only where it removes genuine repeated accessibility wiring; it must
  not contain hard-coded UI copy.

## Component and Module Design

Place the feature under `src/features/admin/manual-scholarship/`.

| File                                            | Responsibility                                                                                                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                                      | Export the finalized request payload and typed create response only.                                                                                                  |
| `schemas/manual-scholarship.schema.ts`          | Define form values and a localized Zod schema: required strings, guarded HTTP(S) URLs, conditional deadline, and optional value normalization.                        |
| `lib/normalizers.ts`                            | Export pure line-array and optional-string helpers. No localized copy or API calls.                                                                                   |
| `api/create-manual-scholarship.ts`              | POST typed payload through `apiClient`; accept an `AbortSignal` if supported by the mutation caller.                                                                  |
| `hooks/useCreateManualScholarship.ts`           | Wrap the API in `useMutation`; no automatic retry for validation, auth, or conflict errors.                                                                           |
| `components/ManualScholarshipForm.tsx`          | Own RHF form state, submit mapping, client/backend error mapping, feedback, and route navigation.                                                                     |
| `components/ManualScholarshipBasicFields.tsx`   | Group bilingual title, organization, country, university, study/funding, deadline, and URL controls. Receives form bindings/messages rather than owning server state. |
| `components/ManualScholarshipDetailsFields.tsx` | Group optional funding, multiline arrays, contacts, source URL, and textual description.                                                                              |
| `components/ManualScholarshipFormActions.tsx`   | Own the accessible Cancel/Create action row and pending affordance; it does not perform the mutation itself.                                                          |
| `components/MultilineArrayField.tsx`            | Add only if it removes repeated labelled-textarea/error markup across the four structured fields. It keeps newline text, not a chip editor.                           |
| `page-metadata.ts` (admin feature)              | Resolve page-specific translation keys from the current internal admin path so the shell heading stays generic.                                                       |

Avoid splitting every field into an individual component. The basic/details
groups and action row are meaningful readability boundaries; an optional
repeated multiline-field boundary is sufficient for the four array controls.

## Validation and Submission Flow

1. Initialize React Hook Form with empty editable values and `no_deadline:
false`; do not use Figma sample values as defaults.
2. Use `watch('no_deadline')` to disable and clear `deadline` immediately when
   enabled. Zod permits `deadline: null` only in that branch and requires a
   valid date otherwise.
3. Validate `apply_link` and `image_url` as required HTTP(S) URLs; validate
   supplied `source_url` similarly. Reject `javascript:` and other protocols.
4. Mark all required labels with localized visible required text/symbol plus
   programmatic required semantics. Show optional indication where it improves
   scanning.
5. Convert nullable optional strings to `null`/omitted fields according to the
   final request type, and convert newline fields with `toTrimmedLines` only at
   submit time.
6. Call the mutation once. While pending, disable the submit and navigation
   actions that could produce a duplicate request, while retaining entered form
   values and exposing an accessible loading label. Do not automatically retry
   `400`, `401`, `403`, `409`, or `422`; only use bounded retry for genuinely
   transient failures if an existing mutation convention supports it.
7. On `ApiError.details`, map recognized backend locations to their registered
   form field using `setError`; leave values intact. Display a localized,
   truthful form-level error for unrecognized/non-field failures (including
   conflict responses). Do not redirect on failure.

### Post-create Feedback and Navigation

On successful mutation:

1. Expose the localized success message through the form's accessible
   `role="status"` / `aria-live="polite"` region.
2. Keep the success state visible for approximately 1500ms.
3. Navigate with the locale-aware router to `/admin/dashboard`.

If the repository already has an established success-feedback mechanism that
persists across navigation, reuse that convention instead. Do not add a new
toast system solely for this feature. Do not navigate on failed creation.

## Page, Heading, and Dashboard Integration

1. Generalize `AdminHeader`’s current dashboard-only translation lookup into a
   route-metadata resolver. The resolver maps `/admin/dashboard` and
   `/admin/scholarships/new` to their own message keys and returns no
   page-specific data for unknown future pages. Shell components retain only
   generic lookup logic.
2. Add the new route page as a thin composition of `ManualScholarshipForm`; it
   must rely on the existing layout for `RoleGuard`, shell, and heading.
3. Add a localized Back-to-dashboard `Link` above the form card, using an
   existing faithful arrow icon (or a genuine Figma asset only if none matches).
4. Update `DashboardWelcome` (the dashboard-specific welcome/summary area) to
   render the real orange manual-create `Link` alongside its summary content.
   Use `buttonStyles` or equivalent existing primary treatment—do not nest a
   button inside a link and do not create a second form in the dashboard.
5. Update `002` spec, plan, task/checklist/verification notes where the
   manual-create action was marked omitted solely because no destination
   existed. Preserve the exclusion for all other unsupported Dashboard actions.

## Responsive, RTL, and Accessibility Strategy

- Match Figma’s page rhythm: shell-owned title band, a modest Back link,
  spacious white rounded card, grouped field headings, 16–24px-scale gaps, and
  an orange creation action.
- Use one column by default and two columns at a content-safe wide breakpoint;
  textarea groups span both columns. Do not use fixed page coordinates.
- Use logical text alignment and spacing utilities. Keep URL fields LTR while
  preserving the surrounding locale direction.
- Associate every label/error/control with stable ids. Apply `aria-invalid`,
  `aria-describedby`, visible focus treatment, semantic checkbox, native date
  input, and real buttons/links.
- Keep source URL as data only; do not preview remote images or render entered
  description HTML in this feature.

## Internationalization

Add an `AdminManualScholarship` namespace to both message files for:

- route title `إضافة منحة جديدة` / “Add a new scholarship” and description
  `أدخل بيانات المنحة بدقة — ستظهر للطلاب بعد النشر` / “Enter scholarship
  details accurately — it will appear to students after publication”, plus form
  and group headings and required/optional markers;
- all labels/placeholders and textarea newline guidance;
- date/no-deadline notice; Back, Cancel, Create, and pending labels;
- validation strings, API/form-level errors, success feedback, and accessible
  names; and
- Dashboard’s manual-create action label in both locales.

Do not hard-code Arabic or English text inside reusable form components.

## File-Level Change Plan

| File                                                           | Change                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/app/[locale]/admin/scholarships/new/page.tsx`             | Add thin protected-by-inheritance route composition.                                 |
| `src/features/admin/page-metadata.ts`                          | Add generic route-to-message metadata for Dashboard and manual creation.             |
| `src/features/admin/components/AdminHeader.tsx`                | Consume metadata resolver rather than importing Dashboard-specific text directly.    |
| `src/features/admin/manual-scholarship/**`                     | Add the focused types, schema, normalizers, API, mutation hook, and form components. |
| `src/features/admin/dashboard/components/DashboardWelcome.tsx` | Add the real localized manual-create CTA link.                                       |
| `src/messages/ar.json`, `src/messages/en.json`                 | Add manual-create and Dashboard CTA messages.                                        |
| `specs/002-admin-dashboard/*`                                  | Amend now-outdated manual-create omission documentation only.                        |
| `specs/003-admin-manual-scholarship/*`                         | Add implementation tasks/checklist and record validation outcomes.                   |

## Implementation Sequence

1. Confirm the finalized endpoint accepts the supplied payload and country
   string representation; retain the current backend source discrepancy as an
   external compatibility note, not a frontend workaround.
2. Add generic admin route metadata and bilingual heading messages without
   changing shell ownership.
3. Create form types, pure normalizers, Zod schema, typed API function, and
   mutation hook.
4. Add the route page and large form surface with basic/details/action
   components, all fields, conditional deadline handling, and localized
   accessible validation.
5. Add success/error behavior and Dashboard manual-create link.
6. Amend `002` documentation and verify no previously excluded action except
   this now-valid CTA is introduced.
7. Test required/optional validation, URL protocols, deadline branches,
   line-array normalization, mapped backend errors, duplicate-submit
   prevention, successful dashboard redirect, both locales, and responsive
   layouts.

## Verification Plan

- Unit-test pure normalizers and schema branches, especially HTTP(S)-only URLs,
  `no_deadline`, blank optional values, and newline arrays.
- Test API request construction for exact payload shape: manual ingestion, no
  selected status/source/legacy title, correct null deadline, and arrays.
- Exercise mutation pending, mapped backend validation, non-field API failure,
  `409` conflict, `422` validation, preserved values, success feedback, and
  locale-aware dashboard navigation.
- Verify Dashboard CTA keyboard operation and correct locale route.
- Compare supported form hierarchy with Figma node `2974:11473` at desktop and
  narrow viewport widths, without copying its sample data, unsupported fields,
  or absolute positions.
- Run `pnpm lint`, `pnpm exec tsc --noEmit`, relevant feature tests, and
  `pnpm build`; document the known Google-font network blocker if it persists.

## Explicit Non-Goals

- Approval, publishing, review, editing, duplicate detection UI, scraper work,
  uploads, rich-text editing, translation, notifications, and new management
  pages.
- Figma opportunity-type/status fields, fake images/data, arbitrary taxonomy
  selects, browser token storage, or duplicated shell/auth behavior.
