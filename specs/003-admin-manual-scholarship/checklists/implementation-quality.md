# Admin Manual Scholarship Creation Implementation Quality Checklist

Use this checklist to review `003-admin-manual-scholarship` against its
finalized specification, plan, backend contract, and Figma node `2974:11473`.

## Architecture and Route

- [ ] The page exists at `/[locale]/admin/scholarships/new` under the existing
      localized admin route hierarchy and works in Arabic and English.
- [ ] The existing Admin Shell, sidebar, shared header controls, logout,
      `RoleGuard`, auth/session architecture, locale switching, and navigation
      shell are reused without duplication.
- [ ] No second auth store, Bearer handling, custom auth fetch wrapper, or
      localStorage/sessionStorage token persistence is introduced.
- [ ] The existing shell-owned `AdminPageHeader` mechanism supplies localized
      creation-page metadata; the form does not render a second global heading.
- [ ] Internal navigation uses `Link`/router helpers from `@/i18n/navigation`
      and never manually concatenates a locale prefix.

## Dashboard Integration

- [ ] The Dashboard has an enabled, orange primary “إضافة منحة يدوياً” / “Add
      scholarship manually” action.
- [ ] The action is a locale-aware `Link` to `/admin/scholarships/new`, has an
      accessible name, visible focus, keyboard operation, and RTL/LTR support.
- [ ] The Dashboard does not duplicate the form or create a new unrelated
      route.
- [ ] The previous `002-admin-dashboard` manual-create exclusion is amended;
      other unsupported Dashboard actions remain excluded.

## API, Payload, and Mutation

- [ ] Creation uses shared `apiClient` to POST `/api/scholarships/`.
- [ ] The outgoing payload always has `ingestion_type: "manual"`.
- [ ] The frontend does not expose or submit a selected `status`, `source`,
      `source_id`, `scraped_at`, `reviewed_at`, or `reviewed_by` value.
- [ ] The payload does not synthesize or concatenate a legacy `title` field.
- [ ] API request and payload mapping are feature-local, typed, and not embedded
      in the route page.
- [ ] Creation uses a React Query mutation with no blind retries for `400`,
      `401`, `403`, `409`, or `422` errors.
- [ ] The mutation does not duplicate global auth/session redirect behavior.
- [ ] Pending submission prevents duplicate creation, exposes an accessible
      pending state, and retains entered values.
- [ ] API failure never clears values, creates fake success, or redirects.

## Required, Optional, and Conditional Fields

- [ ] `title_ar`, `title_en`, `organization_name`, `country`, `study_level`,
      `funding_type`, `apply_link`, and `image_url` are required in both UI and
      validation.
- [ ] Required state is visible and programmatic, has localized validation, and
      is not conveyed only by color or placeholders.
- [ ] `university_name`, `funding_amount`, `majors`, `language_requirements`,
      `eligibility_criteria`, `required_documents`, `source_url`,
      `description_html`, `apply_email`, and `apply_phone` remain optional.
- [ ] Optional inputs do not become required because of Figma asterisks or
      sample values; empty optional values normalize consistently.
- [ ] With `no_deadline: false`, a valid deadline is required and missing or
      invalid input blocks submission.
- [ ] With `no_deadline: true`, the deadline field is cleared/disabled and a
      stale deadline cannot be submitted; outgoing `deadline` is `null`.

## Field Semantics and Validation

- [ ] Arabic and English title inputs are separate, independently required, and
      are not auto-translated, copied, or derived from one another.
- [ ] Required `apply_link` and `image_url`, and supplied optional `source_url`,
      accept only HTTP(S) URLs.
- [ ] Invalid schemes such as `javascript:` and invalid URLs cannot be
      submitted.
- [ ] Study-level and funding inputs reuse an authoritative scholarship
      taxonomy only if one exists; otherwise they are validated text inputs and
      no arbitrary select options are invented.
- [ ] An existing country dataset/control is reused when compatible; no duplicate
      hard-coded country list is created and the submitted representation matches
      the scholarship API contract rather than assuming profile ISO values.
- [ ] `majors`, `language_requirements`, `eligibility_criteria`, and
      `required_documents` use multiline entry: one item per line, newline
      splitting, trimming, blank-line removal, and string-array payloads.
- [ ] No API behavior depends on comma-separated structured-field text.
- [ ] Description uses a normal textarea; no rich-text editor, automatic
      translation, or unsafe `dangerouslySetInnerHTML` rendering is added.

## Form Semantics and Error Handling

- [ ] The page uses a real semantic `form`, real labels, stable control IDs,
      suitable URL/date/email/tel input types, and a checkbox for no deadline.
- [ ] Invalid controls have `aria-invalid`, associated error descriptions, and
      visible keyboard focus.
- [ ] Client validation, field-mappable backend errors, form-level errors,
      `409` conflicts, `401`/`403`, `422`, and network/server failures are
      handled truthfully.
- [ ] Backend errors map to the appropriate registered field when possible;
      non-field errors remain localized form-level feedback.
- [ ] No unsupported opportunity-type or editable-status field is persisted or
      leaves a broken layout gap.

## Navigation and Feedback

- [ ] Back-to-dashboard and Cancel explicitly use locale-aware navigation to
      `/admin/dashboard`; `router.back()` is not the required behavior.
- [ ] Success exposes localized feedback through the project convention (or a
      `role="status"` / `aria-live="polite"` inline fallback), remains visible
      for approximately 1500ms, then navigates to `/admin/dashboard`.
- [ ] No review/detail route is invented as a success destination.
- [ ] Failure does not navigate or reset the form.

## Internationalization, RTL, and Accessibility

- [ ] Every visible string exists in both Arabic and English: metadata, group
      headings, labels, placeholders, required/optional copy, validation,
      no-deadline notice, pending-workflow text, actions, success/errors, and
      accessible names.
- [ ] Reusable form components do not hard-code Arabic or English UI copy.
- [ ] Arabic uses correct RTL reading order, paired fields, error alignment, and
      action order.
- [ ] English uses LTR correctly without RTL-specific offsets or spacing bugs.
- [ ] Logical CSS utilities preserve direction and URL fields are readable in
      their appropriate LTR context.

## Responsive and Figma Intent

- [ ] Desktop preserves Figma’s supported hierarchy: shell title band,
      back-to-dashboard action, large white form surface, rounded controls,
      borders, typography, generous spacing, paired fields, multiline areas,
      bottom actions, and orange creation CTA.
- [ ] Narrow screens collapse to one column with no fixed Figma widths,
      horizontal clipping, hidden errors, or inaccessible buttons.
- [ ] Textareas grow naturally and action controls remain readable/reachable.
- [ ] Layout uses responsive grid/flex patterns and no screenshot-coordinate
      absolute positioning, fixed screenshot height, sample identity, or sample
      form data.
- [ ] Figma’s editing label “حفظ التغييرات” is not used; the primary action is
      “إضافة المنحة” / “Create scholarship”.
- [ ] Existing project tokens and faithful components/icons are reused before
      downloading a genuine Figma asset; no replacement SVG artwork is invented.

## Scope and Code Quality

- [ ] No approval, publishing, review, edit flow, duplicate-check UI, scraper
      behavior, upload flow, rich-text editing, automatic translation, auth
      infrastructure, or unrelated scholarship-management page is added.
- [ ] The schema is feature-owned, types are explicit, URL/deadline rules are
      centralized, and multiline normalization is not duplicated.
- [ ] Components are extracted only for meaningful form responsibilities; inputs
      are not fragmented into dozens of one-off components.

## Verification Commands and Final Acceptance

- [ ] Tests cover required/optional fields, deadline branches, URL protocols,
      multiline arrays, mapped errors, `409`/`422`, pending duplicate prevention,
      preserved failure input, success/dashboard redirect, Back/Cancel, and the
      Dashboard CTA.
- [ ] Arabic/RTL, English/LTR, desktop, narrow layout, keyboard focus, and
      screen-reader-relevant validation states are checked.
- [ ] The completed page is compared with Figma node `2974:11473` for supported
      visual intent—not unsupported fields or example data.
- [ ] `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` are run; an
      external Google-font/network build blocker is documented if it persists.
- [ ] The feature is accepted only when real manual creation succeeds through
      the agreed API and returns the administrator to the Dashboard with all
      accessibility, i18n, responsive, and scope requirements preserved.
