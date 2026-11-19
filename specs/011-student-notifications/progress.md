# Progress: 011 Student Notifications (implementation run)

Unattended run started 2026-11-19 20:54 (local). Resume from the first unchecked phase below; the tasks themselves are ticked in `tasks.md`. Rules, decisions and stop conditions are in the run brief and are reflected in the spec (A4, A6, A7, A18, A19, FR-030, FR-031, FR-037).

## Plan (S small, M medium, L large)

| Phase | Scope                                                                 | Size | Status |
| ----- | --------------------------------------------------------------------- | ---- | ------ |
| Setup | Decisions into the spec, this file                                    | S    | done   |
| 1     | Flag, env, e2e config, script, flag tests                             | S    | done   |
| 2     | Adapter, model, registry, copy, messages, Home source, fake backend   | L    | done   |
| 3     | US1 the list page (+ full build and e2e)                              | M    | done   |
| 4     | US2 mark as read, mark all                                            | M    | done   |
| 5     | US3 badge, bells, poller, Home stat                                   | L    | done   |
| 6     | US4 flag off (+ full build and e2e)                                   | S    | done   |
| 7     | US5 load more and states                                              | M    | todo   |
| 8     | US6 phone layout                                                      | M    | todo   |
| 9     | Guards, docs, verification (+ full build and e2e, 390px in ar and en) | M    | todo   |

## Decisions made during the run

- (none yet)

## Failures and blocks

- (none yet)

## Log

- Setup: branch was not behind `origin/main` (0 behind, 7 ahead); no rebase. The owner's decisions are recorded in `spec.md` (Clarifications, A4, A6, A7, A18, A19, FR-030, FR-031, FR-037) and in plan, data model, contract notes, OpenAPI, research and tasks; analysis finding I1 is resolved.
- Phase 1 done: flag getter, .env.example, e2e config, script, flag tests and a shared test harness (tests/helpers/notifications-harness.mjs). Baseline before the run: 671 unit tests passing, tsc clean, lint 0 errors (3 old warnings). Now 676 tests.
- Phase 2 done: model, adapter (wire, params, parse-page, api), registry, actions, copy, lib helpers, messages (en/ar), Home availability override + unread-source, fake backend endpoints and control API, e2e support helpers. 41 notification unit tests. Decisions: English dates follow Intl (September 15, not 15 September); known document codes are the 8 in the Profile messages (adds motivation_letter to the 7 in the plan).
- Phase 3 done: the notification center page (route gate, card, icon, loading/empty/error states, list hook, minute clock), page key in the shell, 13 UI unit tests, e2e list spec. First e2e run: 5 of 6 passed; the failure was a test bug (the Arabic body contains the word for 'new'), fixed with a data-testid on the pill; the re-run is part of Phase 4's e2e. Build OK.
- Phase 4 done: optimistic mark-read and mark-all (lib/mark-options.ts as plain option builders so they are unit-tested with a QueryClient), hooks, MarkAllReadButton, page wiring with status/alert regions, passive useUnreadCount. 11 mark unit tests + 3 UI tests; e2e notifications.spec.ts 22 passed (list + marking, en and ar; this also re-verified the Phase 3 list tests). Decision: a 404 on a single mark drops the card and keeps the optimistic count (reconciled by the refetch), per the owner's BE-13 decision. useMarkRead/useMarkAllRead take callbacks bound at mutate time (no refs: the React Compiler lint forbids reading refs in render).
- Phase 5 done: the Notifications sidebar item (Personal group, before Profile) with the count pill, the bell as a link (Home's NotificationBell extended with href/size/current), one headless poller (lib/driver-options.ts: 60 s, paused while hidden, refetch on return and on window focus, stop on 401/403/404, wait while marking), passive readers for everything else, layout wiring, Home page flag prop and the card link. Tests: 9 poller tests with a controlled clock (separate file, needs a fake window before TanStack loads), 11 UI tests, the five navigation tests updated (student-layout x3, student-mobile-shell, student-settings). e2e: notifications.spec.ts + notifications-count.spec.ts = 44 tests; the first run had a test bug (synthetic visibilitychange must bubble), fixed. Deviation: the poller needs the tab-visibility event to bubble to window, which a real browser does. Decision: the driver is mounted as a sibling of the shell inside RoleGuard, so tests/student-layout.test.mjs regex was relaxed to allow it.
- Phase 6 done: flags-off e2e (404 with zero /api/notifications requests, no item/bell/dot/badge at desktop, tablet drawer and 390px incl. the account menu) and a unit test that the layout and route read the flag on every call. Full build OK. Full e2e (E2E_REBUILD=1): 142 passed, 2 failed, 2 skipped; the 2 failures were the existing navigation.spec.ts order test (it now lists Notifications before Profile, updated); the 2 skips are the existing start-tracking tests. After the fix navigation.spec.ts + flags-off.spec.ts: 20 passed. A second full-suite run was not repeated because nothing in src changed after it.
