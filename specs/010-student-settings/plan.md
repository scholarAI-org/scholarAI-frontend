# Implementation Plan: Student Settings (Change password)

**Branch**: `feat/student-settings` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md) | **Contract**: [contract-notes.md](./contract-notes.md)

## Summary

A flag-gated page at `/[locale]/student/settings` with one card, "Change password". A React Hook Form + Zod form validates on the device (shared password rules), posts the three contract fields through `apiClient`, classifies failures into 400 / 422 / 401 / unavailable, and after success re-checks the session through the existing current-user query. A "Settings" item appears in the mobile account menu when `SETTINGS_ENABLED=true`.

## Technical Context

- **Stack**: Next.js 16 App Router, TypeScript, Tailwind v4, `next-intl`, React Query v5, React Hook Form + Zod 4 (same as the auth forms).
- **Testing**: `node --test` with the `ts.transpileModule` loader (`tests/helpers/load-src.mjs`), Playwright e2e against `tests/e2e/fake-backend/server.mjs`.
- **Constraints**: do not modify `src/lib/api-client.ts`, `src/proxy.ts`, `AuthProvider.tsx`, `RoleGuard.tsx`. Flags are server-only and never default to `true`. Code under `src/` must not import `tests/`, `scripts/` or `fixtures/`.

## Constitution Check

| Principle                                    | How this plan complies                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| II. Reuse the established application system | `FormField`, `Button`, `Checkbox`, `apiClient`, `useCurrentUser`, `loginPathWithNext`, `password.schema.ts`, card tokens |
| III. Preserve the platform contract          | Session state only from `useCurrentUser`/`AuthProvider`; no new auth store; `RoleGuard` still wraps the route            |
| IV. i18n and bidirectionality                | `Settings` namespace in both locales, logical properties, `dir="ltr"` on password inputs, checked in en/ar and at 390px  |
| V. Quality                                   | Labelled inputs, `aria-invalid`/`aria-describedby` (via `FormField`), `role="alert"` and `role="status"`, 44px targets   |
| Shared shell stays generic                   | The shell receives `settingsEnabled` as a prop from the server layout; no Settings strings live in shared shell code     |

## Project Structure

### Documentation

```text
specs/010-student-settings/
├── spec.md            # requirements, clarifications, assumptions, open question
├── plan.md            # this file
├── contract-notes.md  # POST /auth/change-password
├── tasks.md
└── verification.md    # results, filled when the work is verified
```

### Source code

```text
src/lib/feature-flags.ts                         # + settingsEnabled (SETTINGS_ENABLED === 'true')
src/app/[locale]/student/settings/page.tsx       # Server Component gate -> notFound() | <SettingsPage />
src/app/[locale]/student/layout.tsx              # + settingsEnabled -> StudentShell
src/features/student/layout/StudentShell.tsx     # + settingsEnabled prop -> StudentHeader, StudentSidebar, StudentMobileNavigation
src/features/student/layout/StudentHeader.tsx    # + settingsEnabled prop -> StudentUserMenu
src/features/student/layout/StudentUserMenu.tsx  # + Settings menuitem (flag on), + defaultOpen (lets a server render show the items)
src/features/student/layout/StudentSidebar.tsx   # + Settings link in the footer above Log out (flag on), active on /student/settings
src/features/student/layout/StudentMobileNavigation.tsx # + settingsEnabled -> the drawer's StudentSidebar
src/features/student/layout/types.ts             # + 'settings' in StudentPageKey
src/features/student/layout/student-navigation.ts# + /student/settings -> 'settings' (page key only)
src/features/student/settings/
├── api/change-password.ts            # POST /auth/change-password
├── components/SettingsPage.tsx       # page frame + card
├── components/ChangePasswordForm.tsx # the form
├── components/PasswordField.tsx      # FormField + show/hide toggle
├── hooks/useChangePassword.ts        # useMutation
├── hooks/useSessionCheck.ts          # re-check GET /auth/me, expire -> login
├── lib/session-check.ts              # pure: only a 401 means "expired"
├── lib/build-request.ts              # form values -> the exact body
├── lib/failure.ts                    # ApiError -> ChangePasswordFailure -> feedback
├── schemas/change-password.schema.ts # composes the shared password rules
└── index.ts
src/messages/{en,ar}.json                        # + Settings, StudentLayout.pages.settings, StudentLayout.userMenu.settings
.env.example                                     # + SETTINGS_ENABLED
tests/student-settings.test.mjs                  # unit tests
tests/e2e/fake-backend/server.mjs                # + POST /auth/change-password
tests/e2e/specs/settings.spec.ts                 # en + ar
tests/e2e/specs/flags-off.spec.ts                # + settings route and menu item
playwright.config.ts                             # + SETTINGS_ENABLED
package.json                                     # + test:student-settings
```

## Key Design Decisions

1. **Flag**: `featureFlags.settingsEnabled`, a getter like the others, so tests can flip `process.env` between reads.
2. **Gate before render**: `page.tsx` is a Server Component; `notFound()` runs before `<SettingsPage />` (a client tree) is returned, so nothing is fetched.
3. **Shared rules**: the schema calls `createResetPasswordValueSchema` with an adapter for `t` that passes the minimum length as a number, so the "at least {count} characters" plural lives in the `Settings` namespace and the rules are not duplicated. A `min(1)` "required" check runs first (`pipe`) so an empty field says "required" rather than "too short".
4. **Request shape**: one function, `buildChangePasswordRequest(values)`, builds the body from named fields, so an extra form field can never leak into the request. A test pins the exact key set.
5. **Failure handling is pure**: `classifyChangePasswordError(error)` and `describeFailure(failure)` are plain functions with unit tests; the component maps the result onto React Hook Form (`setError`, `reset`).
6. **Session re-check**: `useSessionCheck` refetches through `useCurrentUser().refetch` and hands the result to the pure `confirmSession`. On 401 it clears the query cache and replaces the route with `loginPathWithNext(...)` (same pair as `useLogout` and `RoleGuard`). `invalidateQueries` alone would not redirect because `AuthProvider` keeps the last good user while a refetch fails (A6).
7. **Entry points**: a `role="menuitem"` link in `StudentUserMenu` (below `sm`) and a footer link in `StudentSidebar` (desktop, and the tablet drawer, which renders the same sidebar), both rendered only when the shell was given `settingsEnabled`. The flag crosses the server/client boundary as a prop, as `homeEnabled` does. The sidebar link is not a navigation item: it sits below the navigation list, with the logout row's styling and its own active state.

## Risks

| Risk                                                             | Mitigation                                                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Menu is phone-only (A1)                                          | Resolved in review: the sidebar footer link covers tablet and desktop                    |
| Backend answers for Google-only accounts are unknown             | Form stays; 400 path shows `detail`; open question in the PR                             |
| Backend 422 `loc` shape differs from the guess                   | Unknown locations fall to the form-level alert, so a wrong guess still shows the message |
| `error happen` default text from `apiClient` leaking to students | Detected and replaced by a translated fallback; unit-tested                              |
| CI cannot reach GitHub from the build machine                    | Reported in the PR and the final reply if the push cannot be made                        |
