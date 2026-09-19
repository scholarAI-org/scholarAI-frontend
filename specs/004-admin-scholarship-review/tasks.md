# Tasks — 004 Admin scholarship review

**Purpose:** Complete and verify the shared scholarship review queue and detail workflow without expanding scope into archive, editing, duplicate detection, scraper operations, or global Admin infrastructure.

## Slice 1 — Contract and feature foundation

- [x] T001 Confirm deployed list/statistics, detail, approval, rejection, update, deletion, and duplicate-detection contracts.
- [x] T002 Record shared manual/scraped queue behavior and list-contract gaps in `contract-notes.md`.
- [x] T003 Add feature-owned review types, API functions, retry behavior, and stable query keys under `src/features/admin/scholarship-review/`.
- [x] T004 Add detail key `scholarshipReviewKeys.detail(id)` and ensure feature invalidation targets only the review key family.
- [x] T005 Keep archive, edit, and duplicate UI absent; do not map deletion to archive.

## Slice 2 — Detail route and read-only data presentation

- [x] T006 Add the thin locale route `src/app/[locale]/admin/scholarships/review/[id]/page.tsx`.
- [x] T007 Extend Admin metadata matching so dynamic detail routes use generic review header copy.
- [x] T008 Implement the detail query with real numeric ID handling and non-transient client-error retry behavior.
- [x] T009 Implement loading, not-found, generic error, retry, and success detail states without sample fallback data.
- [x] T010 Render summary, information, overview, eligibility, and required-documents sections from supported backend detail fields only.
- [x] T011 Render `description_html` as plain text and retain the shared future sanitization/rendering concern in documentation.
- [x] T012 Preserve direct backend-returned approved/rejected records as read-only detail views with historical links and data.
- [x] T013 Implement explicit locale-aware back-to-list navigation to `/admin/scholarships/review`.

## Slice 3 — Link, status, and responsive safety

- [x] T014 Reuse feature safe URL helpers for distinct HTTP(S) source and application links.
- [x] T015 Render truthfully localized null/empty handling for funding, deadline, majors, eligibility, documents, timestamp, source, and application fields.
- [x] T016 Render authoritative status and ingestion type with safe unknown fallbacks; never infer ingestion type on the list.
- [x] T017 Implement desktop two-column and mobile single-column detail layouts without screenshot-specific positioning.
- [x] T018 Add neutral shared-queue Arabic/English feature messages for detail, actions, feedback, validation, and fallbacks.
- [ ] T019 Manually verify Arabic RTL and English LTR wrapping, logical icon direction, long URLs, chips, and action ordering at narrow widths.

## Slice 4 — Review actions

- [x] T020 Implement backend approval mutation without invented corrections or optimistic status changes.
- [x] T021 Implement backend rejection mutation with its documented reason payload and minimum-length guard.
- [x] T022 Invalidate detail, list, and statistics after successful approval/rejection and keep failures on the detail page.
- [x] T023 Navigate only successful actions to `/admin/scholarships/review?notice=approved|rejected`.
- [x] T024 Render pending-only action controls and hide invalid actions for approved, rejected, and unknown statuses.
- [x] T025 Refine approval confirmation focus behavior: initial focus is Cancel, Escape closes when not pending, and cancellation restores focus to the approval trigger.
- [x] T026 Add localized, programmatically associated rejection-reason validation feedback for whitespace-only and under-three-character input.
- [x] T027 Consume and then clean the `notice` parameter while preserving `page` and other valid review-list search state, preventing stale feedback replay.

## Slice 5 — Listing integration

- [x] T028 Restore desktop table Review action using only backend `item.id` and locale-aware navigation.
- [x] T029 Restore mobile-card Review action using only backend `item.id` and locale-aware navigation.
- [ ] T030 Manually verify Review links, pagination transitions, pending filtering, keyboard focus, and direct detail navigation in both locales.

## Slice 6 — Tests and accessibility verification

- [ ] T031 Add focused tests for detail API ID/query key, safe and distinct source/application URL handling, nullable fields, no-deadline, arrays, and plain-text overview behavior.
- [ ] T032 Add focused tests for unknown status fallback and approved/rejected read-only behavior.
- [ ] T033 Add focused tests for approval confirmation, mutation ID, invalidation, success navigation, and error retention.
- [ ] T034 Add focused tests for rejection reason validation, mutation/invalidation, navigation, and request-error retention.
- [ ] T035 Add focused tests for detail 404, generic API error, and desktop/mobile listing Review destinations.
- [ ] T036 Verify semantic headings/lists, focus visibility, external link names, status text, query/mutation announcements, and dialog keyboard behavior.

## Slice 7 — Documentation and final verification

- [x] T037 Keep `spec.md`, `plan.md`, and `contract-notes.md` aligned on shared queue truth, plain-text HTML, supported mutations, read-only records, and scope exclusions.
- [x] T038 Update `verification.md` and the implementation-quality checklist with actual evidence from completed tests/manual checks.
- [x] T039 Run `git diff --check`.
- [x] T040 Run `pnpm lint`.
- [x] T041 Run `pnpm exec tsc --noEmit`.
- [ ] T042 Run all existing and new feature-004 tests.
- [x] T043 Run `pnpm build`; if blocked only by the existing Google Almarai fetch issue, record that exact external blocker.
