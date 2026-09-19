# Implementation-quality checklist — 004 Admin scholarship review

Use this checklist to validate the review-detail workflow and its integration with the pending review queue. Check an item only after verifying it against the deployed contract, implemented UI, and appropriate automated/manual evidence.

## Contract

- [ ] Detail fetches only `GET /admin/scholarships/{id}/review-details`.
- [ ] Approval uses only `POST /admin/scholarships/{id}/approve` and sends no invented correction payload.
- [ ] Rejection uses only `POST /admin/scholarships/{id}/reject` with `{ reason: string }`.
- [ ] Rejection prevents whitespace-only and fewer-than-three-character reasons.
- [ ] Archive is absent; DELETE is never presented as archive.
- [ ] Edit UI is absent until an approved edit workflow exists.
- [ ] Duplicate-check UI is absent from this feature slice.
- [ ] The queue is described as shared manual/scraped review work, not as scraper-only.
- [ ] Detail renders `ingestion_type` only when supplied by the backend and never infers it.

## Queries

- [ ] Detail query key includes the real numeric scholarship ID.
- [ ] Invalid IDs are safely disabled or handled without a network request.
- [ ] Retry policy does not retry `401`, `403`, `404`, or other non-transient 4xx responses.
- [ ] Detail provides loading, success, not-found, and retryable generic-error states.
- [ ] No query failure becomes sample or empty scholarship data.
- [ ] Mutation success invalidates detail, pending list, and statistics through `scholarshipReviewKeys` only.
- [ ] No action clears unrelated React Query cache state.

## Detail rendering

- [ ] The dynamic route is thin and delegates feature logic to `src/features/admin/scholarship-review`.
- [ ] The parent Admin Shell, RoleGuard, header, authentication, and locale handling are reused.
- [ ] Summary renders only supplied title, context, status, ingestion type, timestamp, and source information.
- [ ] Organization, university, and country are not fabricated into misleading context.
- [ ] Funding safely handles type only, amount only, both, and neither.
- [ ] `no_deadline=true` renders localized “No deadline” / “لا يوجد موعد نهائي” without a date.
- [ ] Real deadlines use locale-aware formatting; missing/invalid values are truthful.
- [ ] Majors safely handle null, empty, one, and multiple values.
- [ ] `description_html` is rendered as plain text only.
- [ ] No feature code uses `dangerouslySetInnerHTML`, an HTML parser, or a feature-local sanitizer.
- [ ] Eligibility criteria use semantic list markup when values exist and a localized empty state otherwise.
- [ ] Required documents use actual backend values, wrap safely, and show a localized empty state when needed.
- [ ] No Figma sample scholarship names, institutions, countries, dates, or requirements ship as fallback data.

## Actions

- [ ] Pending records show only supported approval and rejection controls.
- [ ] Approved, rejected, and unknown-status records are read-only and have no invalid review actions.
- [ ] Direct backend-returned approved/rejected detail URLs remain readable with their historical source/application information.
- [ ] Approval opens an explicit confirmation before any mutation is sent.
- [ ] The confirmation has dialog semantics, a labelled title, clear publication consequence, Confirm, and Cancel controls.
- [ ] Confirmation is keyboard accessible, has sensible initial focus, supports escape when consistent with project convention, and restores trigger focus after cancellation.
- [ ] Approval and rejection controls prevent duplicate submissions while pending.
- [ ] Mutation errors stay on the detail page and are exposed through accessible alert feedback.
- [ ] Approval has no optimistic fake published-status presentation.
- [ ] Rejection reason has an accessible label, validation feedback, and preserves entered text after failed requests where useful.

## Navigation

- [ ] Back-to-list is a locale-aware link to `/admin/scholarships/review`, never `router.back()`.
- [ ] Successful approval navigates only after backend success to `/admin/scholarships/review?notice=approved`.
- [ ] Successful rejection navigates only after backend success to `/admin/scholarships/review?notice=rejected`.
- [ ] The listing consumes approved/rejected notices with localized `role="status"` and `aria-live="polite"` feedback.
- [ ] Consumed notices are cleaned without losing valid `page` or other review-list URL state.
- [ ] Desktop Review links use only `item.id` and locale-aware navigation.
- [ ] Mobile Review links use only `item.id` and locale-aware navigation.
- [ ] Review-link integration does not alter pending filtering, page size, previous/next behavior, or current-page state.
- [ ] Dynamic detail routing resolves generic Admin header metadata while scholarship-specific titles remain page content.

## Safety

- [ ] Source and application links remain distinct; neither substitutes for the other.
- [ ] Only valid HTTP/HTTPS source URLs are clickable.
- [ ] Only valid HTTP/HTTPS application URLs are clickable.
- [ ] Missing or malformed URLs are truthful non-links with no broken destination.
- [ ] External links use `target="_blank"` and `rel="noopener noreferrer"`.
- [ ] External-link accessible names identify their purpose and destination where available.
- [ ] Long URLs cannot cause horizontal overflow.

## Internationalization and directionality

- [ ] Every detail, action, confirmation, validation, success, error, fallback, and read-only string is present in Arabic and English.
- [ ] No reusable feature component contains hard-coded Arabic or English UI copy.
- [ ] Arabic layout is RTL-safe, including action ordering, URL readability, and wrapping chips.
- [ ] English layout is LTR-safe without RTL-only spacing or icon direction errors.

## Responsive and visual implementation

- [ ] Desktop has back link, full-width summary, narrow information/actions column, and wider content column.
- [ ] Mobile stacks content into one reachable column with no clipped cards or controls.
- [ ] Buttons are touch-friendly and confirmation remains usable at narrow widths.
- [ ] White surfaces, borders, rounded corners, orange primary action, typography, and spacing follow the supported Figma intent.
- [ ] Unsupported Figma archive/edit controls and scraper-only wording are not restored for visual similarity.
- [ ] New icons reuse a matching existing project asset/component or exact exported Figma bytes; no temporary Figma asset URLs or hand-authored SVG substitutes ship.

## Accessibility

- [ ] Heading and section hierarchy is semantic and logical.
- [ ] Detail and list controls use real links/buttons with visible keyboard focus.
- [ ] Status includes localized text and does not rely on color alone.
- [ ] Query, mutation, not-found, and success feedback use appropriate alert/status semantics.
- [ ] Action pending states are announced and disabled appropriately.
- [ ] Reject reason validation/error state is programmatically associated with its control.

## Tests

- [ ] Focused tests cover actual-ID detail querying and listing Review destinations.
- [ ] Focused tests cover safe and distinct source/application URLs plus invalid URL behavior.
- [ ] Focused tests cover nullable values, no deadline, majors, eligibility, documents, and plain-text HTML behavior.
- [ ] Focused tests cover unknown status fallback and approved/rejected read-only views.
- [ ] Focused tests cover approval confirmation, correct mutation ID, invalidation, success navigation, and mutation error retention.
- [ ] Focused tests cover rejection validation, mutation, invalidation, success navigation, and request-error retention.
- [ ] Focused tests cover 404 and generic detail API errors.
- [ ] Existing review-list tests continue passing.

## Documentation and verification

- [ ] `spec.md`, `plan.md`, `tasks.md`, `contract-notes.md`, and `verification.md` agree on listing/detail ownership and review behavior.
- [ ] Documentation records the shared queue, detail/approve/reject contracts, no archive action, edit/duplicate scope boundaries, plain-text HTML decision, reviewed-record direct access, and post-action navigation.
- [ ] `git diff --check` passes.
- [ ] `pnpm lint` passes.
- [ ] `pnpm exec tsc --noEmit` passes.
- [ ] Feature tests pass.
- [ ] `pnpm build` passes, or records only the exact external Google Almarai font-fetch blocker.

## Edit extension

- [x] Edit is available only for authoritative `pending` detail records and uses the backend ID in a locale-aware Link.
- [x] Save uses `PATCH /admin/scholarships/{id}` with changed, supported content fields only; workflow and provenance fields are excluded.
- [x] Success returns to the same detail with an accessible one-time notice; cancel deterministically returns to detail.

## Recorded evidence (2026-09-19)

- `pnpm test:scholarship-review`, `pnpm test:admin-dashboard`, and `pnpm test:manual-scholarship` passed.
- `pnpm lint`, `pnpm exec tsc --noEmit`, and `git diff --check` passed after the confirmation, rejection-validation, notice-cleanup, and neutral-copy updates.
- The aggregate `node --test tests/*.test.mjs` is not a feature-004 failure: existing `google-auth.test.mjs` cannot find `src/lib/auth-storage.ts`, and existing `profile-personal-information.test.mjs` fails independently.
- Authenticated RTL/LTR, responsive, keyboard, and navigation checks remain intentionally unchecked until a review-record fixture is available for manual verification.
- `pnpm build` reached Next/Turbopack compilation but failed only while requesting `https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&display=swap`: `next/font: error: Failed to fetch \`Almarai\` from Google Fonts.`
