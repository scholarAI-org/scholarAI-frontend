# Feature Specification: Admin Manual Scholarship Creation

**Feature Branch**: `003-admin-manual-scholarship`  
**Created**: 2026-09-17  
**Status**: Draft  
**Input**: Create a bilingual manual-scholarship form at
`/[locale]/admin/scholarships/new`, based on Figma node `2974:11473` and the
provided scholarship-creation contract.

## Summary

Allow an authenticated administrator to create a scholarship manually from the
existing ScholarAI Admin Application Shell. The form sends a real pending,
manual-ingestion scholarship to the backend and is reachable through the
Dashboard’s localized “Add scholarship manually” action.

This feature reuses the existing Admin Shell, role guard, authenticated-user
architecture, locale routing, and React Query setup. It does not rebuild or
duplicate any of them.

## Clarified Product Decisions and Existing Conventions

| Topic                      | Decision                                                                                                                                                                                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requiredness               | `title_ar`, `title_en`, `organization_name`, `country`, `study_level`, `funding_type`, `apply_link`, `image_url`, and a deadline when `no_deadline` is false are required. The remaining supplied fields are optional.                                                                                            |
| System fields              | `ingestion_type` is always `manual`; backend-owned initial status is `pending`. The form MUST NOT expose or submit editable system-owned fields such as `status`, `source`, `source_id`, `scraped_at`, `reviewed_at`, or `reviewed_by`.                                                                           |
| Study level / funding type | Existing `desired_degree_level` and `funding_type` enums are profile-preference taxonomies, not an authoritative scholarship taxonomy. This feature therefore uses validated required text inputs, not invented selects. A future confirmed scholarship taxonomy may replace them.                                |
| Country                    | Reuse the existing `useCountries` dataset only as a user-facing country source. Its ISO values belong to the profile convention and MUST NOT be assumed to be the scholarship API representation. Confirm the manual endpoint's accepted country representation before binding a selected value into the payload. |
| Multi-value fields         | Use accessible multiline textareas: one trimmed entry per line; ignore empty lines; submit string arrays; retain raw input after an error. Do not create a tags editor or comma-separated API convention.                                                                                                         |
| Description                | Use a normal textarea for textual `description_html`; add no rich-text editor or generated HTML.                                                                                                                                                                                                                  |
| Navigation                 | Back, Cancel, and successful creation all navigate with locale-aware navigation to `/[locale]/admin/dashboard`. Do not use browser-history navigation or create a review/detail destination.                                                                                                                      |
| Dashboard action           | Restore the real localized orange “Add scholarship manually” link to `/admin/scholarships/new` and update `002` documentation that previously excluded it because no destination existed.                                                                                                                         |
| Duplicate detection        | Do not add duplicate-check UI. Rely on normal backend validation/conflict behavior.                                                                                                                                                                                                                               |

### Backend Contract Compatibility

The checked-in backend implementation currently exposes an older
`ScholarshipCreate` shape: it requires `source` and legacy `title`, and does
not define `title_ar`, `title_en`, `ingestion_type`, `study_level`,
`funding_type`, or the agreed structured arrays. It therefore cannot be used
as the manual-create contract described by this feature without violating the
system-field and bilingual-title rules above.

The finalized feature assumption confirms that the deployed manual-create
endpoint accepts the agreed payload without requiring frontend `source` or a
legacy `title`. The checked-in older backend schema is treated as stale for
this feature. The frontend MUST NOT target that old schema, synthesize a legacy
title, or send a fake source value.

## Figma Interpretation and Boundaries

| Figma concept                            | Product behavior                                                                                                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Large white form card and grouped fields | Reproduce the semantic hierarchy, responsive two-column form layout, surfaces, borders, spacing, and orange creation action using project patterns—not absolute coordinates. |
| Page title and description               | Supply page-specific localized metadata through the existing Admin heading mechanism. The shared shell must not hard-code either dashboard or creation-page content.         |
| Back / Cancel                            | Use locale-aware navigation to the localized Admin Dashboard.                                                                                                                |
| Save action                              | Use creation language: “Create scholarship” / “إضافة المنحة”.                                                                                                                |
| Opportunity type / editable status       | Omit. Neither is a persisted, editable field in this contract.                                                                                                               |
| Example values and image                 | Visual-only samples. Do not ship them as defaults or application data.                                                                                                       |

## User Scenarios & Testing

### User Story 1 — Open the manual creation page (Priority: P1)

As an authorized administrator, I can open the localized manual scholarship
creation page from the Admin Dashboard and directly by its localized URL.

**Acceptance Scenarios**:

1. **Given** an administrator selects “Add scholarship manually” on the
   Dashboard, **When** the action is activated by mouse or keyboard, **Then**
   locale-aware navigation opens `/[locale]/admin/scholarships/new`.
2. **Given** the creation page is open, **When** I use Back or Cancel, **Then**
   I return to the localized Admin Dashboard.
3. **Given** a non-administrator opens the URL, **When** role protection is
   evaluated, **Then** the existing `RoleGuard` behavior applies without a new
   auth mechanism.

### User Story 2 — Enter a valid bilingual scholarship (Priority: P1)

As an administrator, I can enter the required bilingual, organization,
destination, study, funding, URL, and deadline information in a clear form.

**Acceptance Scenarios**:

1. **Given** the form is displayed, **When** I inspect it in Arabic or English,
   **Then** every control has a localized visible label and required controls
   are identified visually and programmatically.
2. **Given** `no_deadline` is false, **When** I submit without a valid deadline,
   **Then** the deadline control presents its localized associated error and
   nothing is submitted.
3. **Given** `no_deadline` is true, **When** I enable it, **Then** the deadline
   control is disabled and cleared and the submitted deadline is `null`.
4. **Given** a supplied apply, image, or source URL is invalid or not HTTP(S),
   **When** validation runs, **Then** its corresponding field presents a
   localized error and the request is not sent.
5. **Given** I enter Arabic and English titles, **When** I submit, **Then** both
   values remain independent; neither is translated, concatenated, or derived
   from the other in the frontend.

### User Story 3 — Submit a manual pending scholarship (Priority: P1)

As an administrator, I can submit a valid form once and receive truthful,
localized feedback from the backend workflow.

**Acceptance Scenarios**:

1. **Given** all required values are valid, **When** I create the scholarship,
   **Then** the frontend submits `ingestion_type: "manual"` through
   `POST /api/scholarships/`, and the backend creates the record as `pending`.
2. **Given** the request is pending, **When** I activate the primary action,
   **Then** duplicate submissions are prevented and the action exposes an
   accessible pending state.
3. **Given** the backend rejects the request, **When** its validation response
   arrives, **Then** the entered values remain and truthful localized API or
   field errors are presented.
4. **Given** creation succeeds, **When** success feedback is presented,
   **Then** localized success feedback is shown and locale-aware navigation
   goes to the Admin Dashboard; no approval or review workflow starts.

### User Story 4 — Use the form at any viewport or direction (Priority: P1)

As an Arabic or English administrator, I can complete the form in RTL/LTR on
desktop and narrow screens.

**Acceptance Scenarios**:

1. **Given** a wide viewport, **When** the page renders, **Then** related form
   fields use a readable two-column layout where space permits.
2. **Given** a narrow viewport, **When** the page renders, **Then** fields
   collapse to one column without clipping labels, errors, or actions.
3. **Given** an invalid control receives focus, **When** I navigate by keyboard,
   **Then** its visible focus and associated error remain understandable in both
   writing directions.

## Functional Requirements

### Routing, Shell, and Dashboard Integration

- **FR-001**: The page MUST be implemented at
  `/[locale]/admin/scholarships/new` inside the existing protected admin route
  hierarchy, `AdminShell`, and `RoleGuard`.
- **FR-002**: The feature MUST NOT duplicate the sidebar, header controls,
  logout, locale switching, auth state, or role checks.
- **FR-003**: The shared heading mechanism MUST render localized manual-create
  metadata for this route without hard-coding dashboard-specific content in a
  reusable shell component.
- **FR-004**: The Dashboard MUST expose its existing manual-create primary
  action as a locale-aware `Link` from `@/i18n/navigation` to this route, with
  an accessible name, keyboard focus, RTL/LTR support, and faithful primary
  orange styling.

### Form Fields and Payload

- **FR-005**: The form MUST require `title_ar`, `title_en`,
  `organization_name`, `country`, `study_level`, `funding_type`, `apply_link`,
  and `image_url`.
- **FR-006**: It MUST support optional `university_name`, `funding_amount`,
  `majors`, `language_requirements`, `eligibility_criteria`,
  `description_html`, `source_url`, `required_documents`, `apply_email`, and
  `apply_phone`.
- **FR-007**: `majors`, `language_requirements`, `eligibility_criteria`, and
  `required_documents` MUST be maintained and submitted as string arrays. The
  frontend MUST NOT create a comma-separated serialization contract.
- **FR-008**: The payload MUST set `ingestion_type` to `manual`. Initial
  `pending` status is backend-owned; neither value is editable and the form
  MUST NOT submit an admin-selected status.
- **FR-009**: The form MUST NOT expose or submit editable `status`, `source`,
  `source_id`, `scraped_at`, `reviewed_at`, `reviewed_by`, or a separate
  opportunity-type field.
- **FR-010**: Both title fields MUST be independent required values. The
  frontend MUST NOT translate, concatenate, or synthesize a legacy `title`.
- **FR-011**: The form MUST post through the shared `apiClient` using its
  HttpOnly-cookie credentials. It MUST NOT add Bearer headers, browser token
  storage, or a second auth store.

### Validation and Submission

- **FR-012**: Client validation MUST use the project’s existing schema approach
  and prevent invalid requests.
- **FR-013**: `apply_link`, `image_url`, and supplied `source_url` MUST be
  valid HTTP(S) URLs.
- **FR-014**: When `no_deadline` is false, a valid deadline is required. When
  true, deadline MUST be cleared/disabled and submitted as `null`.
- **FR-015**: Field validation errors MUST be linked to their controls using
  labels, `aria-invalid`, and accessible descriptions; placeholders alone MUST
  NOT serve as labels.
- **FR-016**: Submission MUST use a React Query mutation, disable duplicate
  requests, preserve user input after failure, and expose localized pending,
  success, API-error, and backend-validation feedback.
- **FR-017**: Backend validation errors MUST be surfaced truthfully; they MUST
  NOT be replaced by sample values or misleading generic success states.
- **FR-018**: Back, Cancel, and successful creation MUST navigate to the
  localized Admin Dashboard with project locale-aware navigation.

### Internationalization, Visual Quality, and Accessibility

- **FR-019**: Every new visible string—including metadata, labels, helper text,
  required/optional indicators, placeholders, no-deadline copy, pending-workflow
  notice, actions, validation, success, API errors, and accessible names—MUST
  have Arabic and English `next-intl` messages. Reusable components MUST NOT
  hard-code Arabic UI copy.
- **FR-020**: Use semantic `form`, `label`, input, textarea, select/combobox,
  checkbox, and button elements where appropriate.
- **FR-021**: The layout MUST preserve Figma’s supported visual hierarchy: large
  white card, rounded controls, form groups, two-column desktop rhythm,
  localized typography, borders, and orange primary action. It MUST use
  responsive grid/flex patterns, not copied absolute coordinates.
- **FR-022**: RTL and LTR are first-class requirements: logical alignment,
  direction-appropriate icons, errors, and focus states must remain readable.

## API Contract

### Manual Scholarship Creation Payload

`POST /api/scholarships/`

The frontend assumes the manual scholarship creation contract supports:

```ts
type ManualScholarshipCreatePayload = {
  ingestion_type: 'manual';

  title_ar: string;
  title_en: string;

  organization_name: string;
  country: string;
  deadline: string | null;
  no_deadline: boolean;

  university_name?: string | null;
  study_level: string;
  funding_type: string;
  funding_amount?: string | null;

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

Optional fields may be omitted or submitted as `null` according to the final
API contract. When `no_deadline = true`, the submitted value MUST be
`deadline = null`; when `no_deadline = false`, `deadline` MUST contain a valid
date. Empty optional form values MUST be normalized consistently before
submission. The frontend MUST NOT submit empty strings when the finalized API
contract expects `null`.

The backend remains the source of truth for initial `pending` workflow status,
validation, persistence, and legacy `title` compatibility.

### Successful Creation Feedback

After the backend confirms successful scholarship creation:

1. The form MUST expose a localized success message using an accessible
   `role="status"` / `aria-live="polite"` region.
2. The success message MUST remain visible briefly before navigation.
3. After approximately 1500ms, navigate to the localized Admin Dashboard.
4. Do not introduce a new toast library solely for this feature.
5. If the project already contains an established persistent success-feedback
   convention that survives navigation, reuse it instead of the temporary
   inline announcement.

The form MUST NOT redirect before the backend confirms success.

## Non-Goals

- Scholarship approval, publishing, review, editing, or management pages.
- Scraper operation, source health, source metadata, and collection controls.
- Image/file upload or a new rich-text editor.
- Automatic title translation.
- Admin auth, role, shell, or navigation rewrites.
- Inventing taxonomy values, API properties, destinations, or Figma sample data.

## Success Criteria

- **SC-001**: An authenticated administrator opens the localized new-scholarship
  page from the Dashboard and directly by URL inside the existing admin shell.
- **SC-002**: Valid manual scholarship data is submitted once as a pending,
  manual-ingestion scholarship via the provided API contract.
- **SC-003**: Invalid inputs, URLs, deadlines, and backend validation failures
  provide accessible localized feedback without losing entered values.
- **SC-004**: Arabic/RTL and English/LTR layouts remain readable at desktop and
  narrow widths, with no screenshot-specific positioning.
- **SC-005**: No unsupported workflow controls, fake data, duplicate auth, or
  new unrelated management routes are introduced.
