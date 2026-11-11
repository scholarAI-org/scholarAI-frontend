# Verification: 010 Student Settings

**Status**: **Gate 1 PASSED** on 2026-11-11 (frontend complete, verified locally against the fake backend). **Gate 2 (staging backend) is pending.** Not launched: `SETTINGS_ENABLED` is off by default and is set nowhere except the e2e config.

## Gates

| Gate                      | Meaning                         | Exit criteria                                                                                                                                                              | Status      |
| ------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Gate 1: frontend complete | Built and tested locally        | lint, tsc, unit and e2e green; screenshots in en, ar and at 390px                                                                                                          | **PASSED**  |
| Gate 2: live verification | Staging backend, Preview deploy | `POST /auth/change-password` exercised with a real session: success, wrong current password (400 message), same password (400), 401, 422 shape, and the Google-only answer | **Pending** |
| Launch                    | Production                      | Set `SETTINGS_ENABLED=true` in Vercel Production, only after Gate 2 and a decision on the desktop/tablet entry point (see A1 in spec.md)                                   | Not started |

## 1. Gate 1 results (2026-11-11, Node 24, Windows)

| Check                                                | Result                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                                          | 0 errors, 3 warnings (the same 3 as `main`, none in Settings)                                                                |
| `pnpm exec tsc --noEmit`                             | 0 errors                                                                                                                     |
| `node --test tests/*.test.mjs`                       | **653 / 653 pass**, of which `tests/student-settings.test.mjs` is 51 / 51                                                    |
| `pnpm test:i18n` (numerals and hardcoded-copy guard) | 22 / 22 pass                                                                                                                 |
| `E2E_REBUILD=1 pnpm test:e2e`                        | **90 / 90 pass** (34 new: 30 in `settings.spec.ts`, 15 scenarios in en and ar, and 4 in `flags-off.spec.ts`, 2 in en and ar) |

### What the e2e proves

| Scenario (each in en and ar)                                             | Result                                                                                                                                                                                                   |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Change the password                                                      | One `POST /auth/change-password`, body keys exactly `current_password`, `new_password`, `invalidate_other_sessions`; success message; form empty; still on `/student/settings`; a `GET /auth/me` follows |
| Sign out, sign in with the new password                                  | New password lands on `/student/profile`; the old password gets 401                                                                                                                                      |
| Wrong current password                                                   | Form-level alert shows the backend `detail`; the three passwords are empty; the checkbox keeps its state; focus is on the first field                                                                    |
| Mismatch, same-as-current, empty, weak (no digit, no special, too short) | Error beside the field; the backend request log has **no** `/auth/change-password` entry                                                                                                                 |
| "Sign out of other devices"                                              | Off by default, sends `false`; ticked sends `true`, ends the other session (fake backend `sessionCount` 2 to 1) and keeps this one                                                                       |
| Show/hide toggles                                                        | Each field toggles on its own; `aria-pressed` follows                                                                                                                                                    |
| Enter and click while a request runs                                     | Exactly one request                                                                                                                                                                                      |
| Network failure, 503, 422 on a field, 422 on no field                    | Generic translated error (no server text) with values kept; field error beside the field; form-level alert for the unmapped 422                                                                          |
| Session ended by the change (`GET /auth/me` answers 401)                 | Redirect to `/login?next=/student/settings`; signing in returns to Settings                                                                                                                              |
| 401 on submit                                                            | Session re-checked, redirect to login with `next`; the password was not changed                                                                                                                          |
| 390px                                                                    | Account menu shows "Settings" above "Log out"; the page has no horizontal overflow; inputs and button are inside the screen and at least 44px tall; content direction is `ltr` in en and `rtl` in ar     |
| Flag off (`flags-off` server)                                            | `/student/settings` is the localized 404; the backend saw only the test's sign-in and `GET /auth/me`; the account menu has no Settings item                                                              |

### Production build

`next build` succeeds and lists `/[locale]/student/settings`.

### Screenshots

In [`docs/student-settings/`](../../docs/student-settings): `settings-{en,ar}-desktop[-rejected].png` and `settings-{en,ar}-390[-errors|-rejected|-success|-menu].png`.

## 2. Environment notes

- The build machine could not reach `fonts.googleapis.com` (or `github.com`). The local production builds used Next's own `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` hook with a throwaway mock kept outside the repo, so the screenshots use fallback fonts. Nothing in the repo changed for this; CI and Vercel fetch the real fonts.
- The e2e suite is not part of `.github/workflows/ci.yml` (that runs lint and tsc only); it was run locally.

## 3. Not verified (be explicit)

- Any real backend. The fake backend implements the contract as read from `docs/api/openapi.json`; the real 400/401/422 texts and the `loc` of a 422 are unconfirmed (Gate 2).
- What the backend answers for an account with no password (Google sign-in). See Open Questions in [spec.md](./spec.md).
- Whether the current session survives a password change on the real backend. The client handles both outcomes (tested with the fake).
- Safari/iOS and password-manager behavior. The fields carry `autocomplete="current-password"` and `autocomplete="new-password"`.

## 4. Launch checklist

1. Gate 2 against staging (the scenarios in section 1, with a real student).
2. Decide how tablet and desktop widths reach the page (A1: the account menu is phone-only today).
3. Set `SETTINGS_ENABLED=true` in Vercel Production (not before 1 and 2).
