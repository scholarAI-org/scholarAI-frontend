---
description: 'Task list for 010 Student Settings'
---

# Tasks: Student Settings (Change password)

**Input**: `specs/010-student-settings/` (spec.md, plan.md, contract-notes.md)

**Prerequisites**: none open; clarifications were answered in the brief (spec.md, Clarifications).

**Tests**: REQUESTED. Unit tests live in `tests/student-settings.test.mjs`; e2e in `tests/e2e/specs/settings.spec.ts` and `flags-off.spec.ts`. Tests are written before the code they cover where practical.

**Commits**: Conventional Commits, scope `settings`; explicit paths only (never `git add -A`).

Run commands as `corepack pnpm …` when `pnpm` is not on PATH.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files)
- **[Story]**: US1 change the password · US2 client validation · US3 server errors · US4 flag off

## Constraints that apply to every task

- Do not modify `src/lib/api-client.ts`, `src/proxy.ts`, `AuthProvider.tsx`, `RoleGuard.tsx`.
- No second copy of the password rules: import `src/features/auth/schemas/password.schema.ts`.
- Latin digits, logical CSS properties only, no hardcoded copy.
- `SETTINGS_ENABLED` is set to `true` only in `playwright.config.ts` (flags-on server).

---

## Phase 1: Specification

- [x] T001 Write `spec.md`, `plan.md`, `contract-notes.md`, `tasks.md` under `specs/010-student-settings/`. Commit: `docs(settings): specify student settings and change password`.

## Phase 2: Flag, copy, schema, request, failures (foundation)

- [x] T010 [P] `src/lib/feature-flags.ts`: add `settingsEnabled` (`process.env.SETTINGS_ENABLED === 'true'`). `.env.example`: document `SETTINGS_ENABLED` (empty).
- [x] T011 [P] `src/messages/en.json`, `ar.json`: add the `Settings` namespace (with the min-length plural), `StudentLayout.pages.settings`, `StudentLayout.userMenu.settings`.
- [x] T012 [US2] `schemas/change-password.schema.ts`: required fields, shared new-password rules, confirmation match, new differs from current.
- [x] T013 [US1] `api/change-password.ts` and `lib/build-request.ts`: the exact three-field body.
- [x] T014 [US3] `lib/failure.ts`: classify `ApiError` (400/422/401/other), map to feedback (form message, field errors, clear-passwords, expire-session).
- [x] T015 Unit tests for T010 to T014 in `tests/student-settings.test.mjs`; add `test:student-settings` to `package.json`. Commit: `feat(settings): add flag, copy, schema and error mapping`.

## Phase 3: UI

- [x] T020 [US1] `components/PasswordField.tsx`: `FormField` plus a show/hide toggle (translated, `aria-pressed`).
- [x] T021 [US1] `hooks/useChangePassword.ts`, `hooks/useSessionCheck.ts`.
- [x] T022 [US1 US2 US3] `components/ChangePasswordForm.tsx`: form, alerts, success status, reset rules.
- [x] T023 `components/SettingsPage.tsx`, `index.ts`, route `src/app/[locale]/student/settings/page.tsx` (flag gate).
- [x] T024 [US4] Shell: `settingsEnabled` through `layout.tsx` → `StudentShell` → `StudentHeader` → `StudentUserMenu`; `settings` page key. Commit: `feat(settings): add the change password page and account menu entry`.

## Phase 4: Unit tests for UI wiring

- [x] T030 Flag gating (`notFound()` before render, source check), menu item visibility (rendered markup with the flag on and off), en/ar key parity, plural categories, no hardcoded copy.

## Phase 5: e2e

- [x] T040 `tests/e2e/fake-backend/server.mjs`: `POST /auth/change-password` (checks current password, enforces the rules, 400 wrong-current and same-password, 401 without a session, 422 on bad body, updates the stored password, optionally revokes other sessions and, for tests, the current one).
- [x] T041 `playwright.config.ts`: `SETTINGS_ENABLED` on in flags-on, off in flags-off.
- [x] T042 `tests/e2e/specs/settings.spec.ts` (en, ar): success then sign out and sign in with the new password; wrong current password shows the alert; mismatch blocked on the client with no request; same-password blocked; 401-after-success goes to login.
- [x] T043 `tests/e2e/specs/flags-off.spec.ts`: `/student/settings` is 404 and the menu item is absent. Commit: `test(settings): cover change password end to end`.

## Phase 6: Verify and ship

- [x] T050 `pnpm lint`, `pnpm exec tsc --noEmit`, `node --test tests/*.test.mjs`, `E2E_REBUILD=1 pnpm test:e2e`.
- [x] T051 Screenshots in en, ar and at 390px; `verification.md`. Commit: `docs(settings): record verification`.
- [x] T052 Push, open the PR to `main`, wait for CI and the Vercel preview. Do not merge.

## Phase 7: Review changes (2026-11-11)

- [x] T060 Remove the screenshots from the repo (`git rm -r docs/student-settings`); they are attached to the PR by hand.
- [x] T061 [US1 US4] `StudentSidebar`: a "Settings" link in the footer directly above "Log out", behind `settingsEnabled`, with the logout row's look and an active state on `/student/settings`; not in the navigation list or the tab bar. Thread the flag through `StudentShell` and `StudentMobileNavigation` (the tablet drawer renders the same sidebar). Add `StudentLayout.settings` in en and ar. The mobile account-menu item stays.
- [x] T062 Unit tests: visible only with the flag, hidden without it, active state, above Log out and outside the list, drawer parity, logical CSS, key parity.
- [x] T063 e2e: at desktop the sidebar link opens Settings and is active (en, ar); the tablet drawer carries it; flags-off has no link in the sidebar or the drawer.
- [x] T064 Re-run lint, tsc, unit and `E2E_REBUILD=1 pnpm test:e2e`; push; wait for CI. Do not merge.
