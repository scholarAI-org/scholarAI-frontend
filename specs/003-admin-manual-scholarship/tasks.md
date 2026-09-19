# Tasks: Admin Manual Scholarship Creation

**Feature**: `003-admin-manual-scholarship`  
**Plan**: [plan.md](./plan.md)  
**Specification**: [spec.md](./spec.md)  
**Checklist**: [implementation-quality.md](./checklists/implementation-quality.md)

## Phase 1: Confirm Boundaries and Existing Conventions

- [x] T001 Inspect the current frontend conventions and the finalized
      `POST /api/scholarships/` contract before implementation. Confirm:
      form/schema conventions, `apiClient` behavior, mutation/error patterns,
      reusable controls, success-feedback conventions, the exact representation
      expected for `country`, nullable optional-field behavior, and whether any
      authoritative study-level/funding/country taxonomies already exist. Do not
      reuse student-profile ISO country codes unless the scholarship endpoint
      explicitly expects them. If no authoritative country taxonomy or encoding
      exists, use a validated text input and submit the country value according
      to the actual scholarship endpoint contract.
- [ ] T002 Review the existing admin layout, `AdminShell`, `AdminHeader`,
      `AdminPageHeader`, dashboard route, `apiClient`, React Hook Form/Zod
      usage, mutation conventions, `useCountries`, and locale navigation;
      preserve ownership boundaries.
- [ ] T003 Reinspect Figma node `2974:11473` for supported hierarchy, field
      grouping, card rhythm, controls, and responsive intent. Record Figma
      opportunity-type/status fields and sample values as exclusions.
- [ ] T004 Confirm no authoritative scholarship study-level or funding-type
      taxonomy exists. Retain validated text inputs unless an authoritative
      scholarship taxonomy is discovered; do not reuse profile-only enums.
- [ ] T005 Confirm the existing country dataset is reused only as a discovery
      aid and no profile ISO representation is silently assumed for the
      scholarship payload.

## Phase 2: Shared Heading and Feature Data Layer

- [x] T006 Create `src/features/admin/page-metadata.ts` to resolve generic
      localized admin page metadata by internal pathname, including Dashboard
      and manual-create routes.
- [x] T007 Update `AdminHeader` to consume route metadata rather than importing
      Dashboard-specific heading copy directly. Keep shell controls generic and
      do not render a second page-global heading in route content.
- [x] T008 Create `src/features/admin/manual-scholarship/types.ts` with the
      finalized manual-create request and response contracts. Include only
      supported editable fields plus fixed `ingestion_type: 'manual'`.
- [x] T009 Create `src/features/admin/manual-scholarship/lib/normalizers.ts`
      with pure optional-string and newline-array helpers: split lines, trim,
      remove blanks, return string arrays/null, and never comma-serialize.
- [x] T010 Create `src/features/admin/manual-scholarship/schemas/manual-scholarship.schema.ts`
      with inferred form data and localized Zod validation for required fields,
      HTTP(S)-only URLs, and conditional `no_deadline`/deadline behavior.
- [x] T011 Create `src/features/admin/manual-scholarship/api/create-manual-scholarship.ts`
      using shared `apiClient` to POST `/api/scholarships/`; no custom fetch,
      tokens, status/source/legacy-title synthesis, or editable workflow data.
- [x] T012 Create `useCreateManualScholarship` as one React Query mutation.
      Do not blindly retry `400`, `401`, `403`, `409`, or `422`; preserve global
      auth/session behavior and use only bounded transient retry if appropriate.

## Phase 3: Form UI and Accessible Submission

- [x] T013 Add `AdminManualScholarship` Arabic and English messages for page
      metadata, all labels/placeholders, group headings, required/optional
      text, validation, no-deadline, pending workflow, actions, feedback, and
      accessible names.
- [x] T014 Create `ManualScholarshipForm` to own React Hook Form state, submit
      payload mapping, mutation lifecycle, mapped backend field errors, and
      form error feedback. Implement successful submission behavior: announce a
      localized accessible success message, keep it visible for approximately
      1500ms, then navigate to the locale-aware Admin Dashboard. Reuse an
      existing persistent success-feedback convention instead if one already
      exists; do not add a new toast system solely for this feature.
- [x] T015 Create `ManualScholarshipBasicFields` for separate required Arabic/
      English titles, organization, country, optional university, validated
      study/funding text inputs, deadline/no-deadline control, and required URL
      fields. Clearly identify required state in UI and semantics.
- [x] T016 Create `ManualScholarshipDetailsFields` for optional funding amount,
      source/application contacts, normal description textarea, and no unsafe
      HTML rendering or rich-text editor.
- [x] T017 Add `MultilineArrayField` only if it removes genuine duplicate
      labelled-textarea/error wiring for majors, language requirements,
      eligibility criteria, and required documents. Use one item per line.
- [x] T018 Create `ManualScholarshipFormActions` with Back/Cancel links to the
      locale-aware Dashboard route and a create-semantic primary action
      (“إضافة المنحة” / “Create scholarship”), never Figma’s edit-copy label.
- [x] T019 Ensure `no_deadline` immediately clears/disables deadline, submits
      null, prevents stale dates, retains values on failure, disables duplicate
      submission during pending, and does not redirect on failure.

## Phase 4: Route, Dashboard, and Visual Integration

- [x] T020 Add `src/app/[locale]/admin/scholarships/new/page.tsx` as thin form
      composition under the inherited admin layout. Do not duplicate shell,
      RoleGuard, auth, sidebar, header controls, or heading.
- [x] T021 Add a locale-aware Back-to-dashboard link above the form surface,
      using an existing faithful icon before downloading any Figma asset.
- [x] T022 Build the responsive form surface: large white rounded card,
      grouped sections, two-column desktop layout, one-column narrow layout,
      logically aligned errors/actions, growing textareas, and no fixed Figma
      coordinates or sample data.
- [ ] T023 Update `DashboardWelcome` to restore the real orange manual-create
      `Link` using `@/i18n/navigation`, keyboard focus, accessible naming, and
      internal `/admin/scholarships/new` routing without a nested button.
- [ ] T024 Update `002-admin-dashboard` spec, plan, tasks, checklist, and
      verification documentation to remove only the obsolete manual-create
      exclusion now that this valid destination exists.
- [ ] T025 Verify the manual form contains no opportunity type, editable status,
      review/approval/edit flow, duplicate-check UI, upload, scraper behavior,
      auto translation, or unrelated management-page implementation.

## Phase 5: Verification

- [ ] T026 Unit-test normalizers and Zod validation: required/optional values,
      HTTP(S) and `javascript:` URLs, deadline/no-deadline branches, and newline
      array trimming/empty-line removal.
- [ ] T027 Test request construction: exact manual payload, no status/source/
      legacy title, nullable deadline/optional values, and string arrays.
- [ ] T028 Test mutation states: pending duplicate prevention, mapped field
      errors, non-field error, `409` conflict, `422` validation, `401`/`403`,
      network/server failure, and preservation of entered values.
- [ ] T029 Test success feedback and locale-aware redirect to `/admin/dashboard`;
      test Back and Cancel routes and the Dashboard manual-create link.
- [ ] T030 Verify Arabic/RTL and English/LTR labels, directions, URL/date input
      readability, field/error order, actions, required semantics, focus, and
      screen-reader associations.
- [ ] T031 Compare the supported creation page against Figma node `2974:11473`
      at desktop and narrow viewports; correct hierarchy/proportion differences
      without sample data, unsupported fields, or screenshot positioning.
- [ ] T032 Run `pnpm lint`, `pnpm exec tsc --noEmit`, relevant feature tests,
      and `pnpm build`; document the existing Google-font/network blocker if it
      persists.
- [ ] T033 Complete the [implementation-quality checklist](./checklists/implementation-quality.md)
      and document accepted exceptions.

## Dependency Order

`T001–T005` → `T006–T012` → `T013–T019` → `T020–T025` → `T026–T033`

Tasks T006–T012 can proceed in parallel after the API/taxonomy confirmation.
Form details and the route depend on the data layer; final validation follows
the completed Dashboard integration.

## Out of Scope

- Scholarship approval, publishing, review, editing, duplicate-check UI,
  scraper controls, uploads, rich-text editing, automatic translation, auth
  changes, and unrelated scholarship-management screens.
