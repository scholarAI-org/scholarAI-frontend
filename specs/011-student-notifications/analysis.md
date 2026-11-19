# Specification Analysis Report: Student Notifications

**Command**: `/speckit.analyze` on `spec.md`, `plan.md`, `tasks.md` (plus research, data model, contract notes, contracts, quickstart)

**Date**: 2026-11-19 · **Branch**: `feat/011-student-notifications` · **Analyzed commit**: `f6657b6`

The analysis itself changed nothing. The brief asks for this report to be committed, so it is written here; the small fixes it led to are in a separate commit and are marked in the **Status** column.

## Findings

| ID  | Category       | Severity | Location(s)                                  | Summary                                                                                                                                                                                                                                                                                                                                                                                   | Recommendation                                                                                                                                                                    | Status                       |
| --- | -------------- | -------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| I1  | Inconsistency  | HIGH     | brief vs spec "Reuse of the Existing System" | The brief says to reuse the Home notifications abstraction "(bell, unread count, activity rows)". The spec reuses the bell and the unread-count source, but **not** the activity rows or the `activity` source (`GET /api/activity`): that is a different, student-produced event feed and BE-13 has no activity endpoint.                                                                | Keep, but this is a deviation from the literal brief and needs the owner's confirmation. If Home's "Recent activity" should show notifications, that is a separate small feature. | Open: decision for the owner |
| U1  | Underspecified | MEDIUM   | spec FR-014, FR-061; tasks T110, T112        | At 390px the spec says the end column moves under the text, while T112 puts the "New" pill beside the title. Two different places for the pill.                                                                                                                                                                                                                                           | One rule: at 390px the pill stays on the title row at the inline end and only the action moves under the text, full width. Align FR-061, T110 and T112.                           | Resolved                     |
| U2  | Underspecified | MEDIUM   | tasks T070, T079, T081                       | T070 names two test files, but seven test files reference the navigation (`student-application-tracking-ui`, `student-home`, `student-layout`, `student-mobile-shell`, `student-saved-scholarships`, `student-scholarship-details`, `student-settings`). A Home test also asserts text in the route layout (`<HomeNotificationBell`, `headerActions:`, `<StudentShell {...shellProps}>`). | T070 and T081: update every test that enumerates the navigation. T079: keep those three tokens in the layout (keep the `shellProps` object).                                      | Resolved                     |
| A1  | Ambiguity      | MEDIUM   | spec FR-037; tasks T061, T065                | The "could not mark as read" alert has no stated lifetime.                                                                                                                                                                                                                                                                                                                                | It stays until the next mark attempt on the page; add to FR-037 and T061.                                                                                                         | Resolved                     |
| D1  | Duplication    | LOW      | spec FR-046, FR-060                          | Both describe the account-menu link. FR-046 sits under the badge and bell requirements while the work is in US6 (T111).                                                                                                                                                                                                                                                                   | Keep it in FR-060 only; FR-046 points to it.                                                                                                                                      | Resolved                     |
| U3  | Underspecified | LOW      | spec FR-052; tasks T101                      | FR-052 (a 401 from the list re-checks the session) has no test task.                                                                                                                                                                                                                                                                                                                      | Add the assertion to T101.                                                                                                                                                        | Resolved                     |
| U4  | Underspecified | LOW      | spec A14; tasks T042, T062, T103             | The e2e flags-on server keeps `SCHOLARSHIP_DETAILS_ENABLED` empty (A14), but the e2e tasks do not say that "View" is asserted absent and "Complete profile" present.                                                                                                                                                                                                                      | State it in T042.                                                                                                                                                                 | Resolved                     |
| E1  | Coverage gap   | LOW      | spec FR-011, FR-074                          | FR-011 (semantic list with an accessible name) and FR-074 (visible focus, accessible names) are only implied by implementation tasks; no assertion names them.                                                                                                                                                                                                                            | Add `<ol aria-label>` and a `focus-visible` class check to T040, and an accessible-name check to T110.                                                                            | Resolved                     |
| I2  | Inconsistency  | LOW      | plan Technical Context                       | The plan says "about 3 unit test files"; the tasks create two.                                                                                                                                                                                                                                                                                                                            | Say "2".                                                                                                                                                                          | Resolved                     |
| I3  | Inconsistency  | LOW      | tasks (IDs)                                  | Task IDs have gaps (T001 to T005, T010 to T033, …). The template asks for sequential IDs.                                                                                                                                                                                                                                                                                                 | Kept: it is the repo's precedent (`specs/010-student-settings/tasks.md`) and keeps room per phase.                                                                                | Accepted                     |

No finding is CRITICAL. Nothing in the spec, plan or tasks conflicts with the constitution.

## Coverage Summary

63 functional requirements and 8 success criteria, grouped by the task that builds them. "Weak" means covered by a task but without a named assertion (fixed by E1, U3).

| Requirement keys                                   | Has task? | Task IDs                                       | Notes                  |
| -------------------------------------------------- | --------- | ---------------------------------------------- | ---------------------- |
| FR-001 to FR-005 flag, route, access               | Yes       | T001 to T005, T041, T050, T090, T091           |                        |
| FR-010, FR-012 to FR-014, FR-017 list and card     | Yes       | T031, T040 to T042, T045 to T049               |                        |
| FR-011 semantic list                               | Weak      | T049                                           | E1                     |
| FR-015, FR-033 to FR-039 mark and mark all         | Yes       | T060 to T067                                   | A1 for FR-037          |
| FR-016 time line                                   | Yes       | T018, T026, T040, T044                         |                        |
| FR-020 to FR-029 types, copy, skipping             | Yes       | T010 to T015, T024 to T026, T040               |                        |
| FR-030 to FR-032 actions                           | Yes       | T016, T026, T040, T047, T066                   | A14 in T042 (U4)       |
| FR-040 to FR-045 count, badge, bell, polling       | Yes       | T028 to T030, T070 to T081                     |                        |
| FR-046, FR-060, FR-061 mobile and account menu     | Yes       | T110 to T113                                   | D1, U1                 |
| FR-050 to FR-054 list data, pagination, states     | Yes       | T014, T045, T048, T100 to T103                 | FR-052 test added (U3) |
| FR-070 to FR-073 i18n, RTL, no hard-coded copy     | Yes       | T024, T026, T120                               |                        |
| FR-074 accessibility                               | Weak      | T040, T110                                     | E1                     |
| FR-080 to FR-082 privacy, imports, admin endpoints | Yes       | T014, T031, T120                               |                        |
| FR-090, FR-091 adapter isolation                   | Yes       | T011 to T013, T026, T120                       |                        |
| FR-100 to FR-105 tests, fake backend, docs         | Yes       | T005, T031, T032, T120 to T125                 |                        |
| SC-001 to SC-008                                   | Yes       | T040, T062, T073, T080, T091, T113, T120, T123 |                        |

## Constitution Alignment

| Principle                                     | Result                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Figma informs, architecture leads          | Pass. Node 2481:4980 was inspected; the design's absolute positioning is replaced by flex; no generated code is copied.                                                                                       |
| II. Reuse the established application system  | Pass with one recorded exception. Five icons are lucide glyphs because the design's are font characters with no SVG asset; the one real asset is reused (plan, Complexity Tracking). The shell stays generic. |
| III. Preserve the platform contract           | Pass. `RoleGuard` and `AuthProvider` are untouched; the route is under the student layout; the poller sits inside `RoleGuard` (verified: it renders children only for an authenticated student).              |
| IV. Internationalization and bidirectionality | Pass. ar and en e2e, 390px, tablet drawer, logical properties and the `rtl:` guard are all in the tasks (T113, T120, T124).                                                                                   |
| V. Quality is part of visual fidelity         | Pass. Semantic list, real button and real link, alerts and status regions, 44px targets (T110, T113). Weak assertions fixed by E1.                                                                            |

## Unmapped Tasks

None. T004 (package script) serves FR-100; T121 and T122 serve FR-105; T123 to T125 serve FR-104 and SC-008.

## Metrics

- Total requirements: 63 FR, 8 SC
- Total tasks: 80
- Coverage (requirements with at least one task): 100% (2 weak, fixed)
- Ambiguity count: 2 (A1, E1/FR-074)
- Duplication count: 1 (D1)
- Critical issues: 0 · High: 1 (a decision, not a defect) · Medium: 3 · Low: 6

## Risks that depend on the backend contract (BE-13)

None of these blocks the work, because everything is built against the fake backend and the flag stays off. Each is contained in the adapter or the registry.

1. **Field names and envelope** (`items`, `total`, `page`, `page_size`, `total_pages`, item fields): a rename changes only `adapter/`.
2. **`action` values**: `action.type` is not interpreted (assumption A4), so a different set of strings does not hide actions; if the backend sends `action: null` for a type that should have one, the action is hidden by design.
3. **Closed lists of `change` and `missing_documents` codes**: unknown codes fall back to a generic sentence; known ones are one table entry plus two messages.
4. **`id` type**: accepted as a positive integer or a non-empty string and path-encoded.
5. **Order**: newest first is assumed and not re-sorted; a different order would show wrongly.
6. **Unread count vs skipped items**: the badge can exceed the visible unread cards when the backend counts types this version skips.
7. **Status codes** for unknown and already-read ids on `PATCH`, and for disabled accounts: the frontend treats every failure the same way (rollback and message).
8. **Page size limit**: 20 is assumed.

## Next Actions

- No CRITICAL issue: implementation can start (`/speckit.implement`) once the owner has seen **I1**.
- Edit `spec.md`/`tasks.md` only for I1 if the owner wants Home's activity fed from notifications.
- Suggested order for implementation: Phases 1 to 3 (MVP), then 4 to 6 (P1 complete), then 7 and 8, then 9. Each phase is one commit.

Would you like concrete remediation edits for I1 if the answer is to feed Home's activity from notifications? (Nothing else is pending.)
