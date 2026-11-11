# Feature Specification: Student Settings (Change password)

**Feature Branch**: `feat/student-settings`

**Created**: 2026-11-11

**Status**: Approved. The product owner answered every clarification in the task brief on 2026-11-11; they are recorded below.

**Input**: User description: "Build the student Settings page with 'Change password' (the last P1 item of the launch plan). Route `/[locale]/student/settings` behind a server-only flag `SETTINGS_ENABLED`. A 'Settings' item in the student user menu. Form: current password, new password, confirm new password, and a 'Sign out of other devices' checkbox, each password field with a show/hide toggle. Backend: `POST /auth/change-password`."

**Design source**: none (no Figma frame for Settings). The page reuses the student card styling used on Home and Profile (white `rounded-2xl` card, `border-gray-300`, navy/orange tokens) and the auth form controls.

## Clarifications

### Session 2026-11-11

Status: **resolved** by the product owner in the task brief. No question was left open; the assumptions the implementation had to make beyond the brief are in **Assumptions**.

- Q1: Which route and flag? → A: `/[locale]/student/settings`, behind the new server-only `SETTINGS_ENABLED` (default off, the literal `"true"` is the only enabling value). Flag off: the localized 404 and no data fetched. (FR-001, FR-002)
- Q2: Where does the entry point live? → A: A "Settings" item in `StudentUserMenu`, shown only when the flag is on. Not in the sidebar, not in the mobile tab bar (it already has five items). (FR-003)
- Q3: Which fields? → A: current password, new password, confirm new password, and an unchecked-by-default "Sign out of other devices" checkbox that maps to `invalidate_other_sessions`. Each password field has a show/hide toggle. Existing auth form components are reused. (FR-010 to FR-013)
- Q4: What is validated before any request? → A: every field required; new password meets the shared rules; confirmation matches; new password differs from the current one. Errors show next to the field. Nothing is sent while the form is invalid or a request is in flight. (FR-020 to FR-024)
- Q5: How are server errors shown? → A: 400 form-level alert with the backend `detail`; 422 field errors on fields where possible, otherwise a form-level alert; 401 existing session-expired handling; network or 5xx a generic translated error. Typed values are kept except on 400, where the password fields are cleared. (FR-030 to FR-035)
- Q6: What happens on success? → A: translated success message, form cleared, stay on the page, then confirm the session with `GET /auth/me` through the existing hook and send the user to login with the existing return path if it is gone. (FR-040 to FR-042)
- Q7: Accounts created with Google may have no password. → A: Do not guess and do not hide the form. The 400 path covers it. Raised as an open question for the backend team. (FR-036)
- Q8: Copy and layout? → A: a new `Settings` namespace in `en.json` and `ar.json`, Arabic plurals with every category, no hardcoded strings, logical CSS properties, checked at 390px. (FR-050 to FR-053)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Change my password (Priority: P1)

A signed-in student opens Settings from the account menu, enters the current password, a new password and its confirmation, optionally ticks "Sign out of other devices", and submits. The password changes, the form empties, and a success message appears. The next sign-in works with the new password.

**Why this priority**: This is the whole feature, and the last P1 item of the launch plan.

**Independent Test**: Seed a student, open `/en/student/settings` with the flag on, change the password, sign out, and sign in with the new password (e2e `settings.spec.ts`).

**Acceptance Scenarios**:

1. **Given** a valid current password and a valid new password typed twice, **When** the student submits, **Then** exactly one `POST /auth/change-password` is sent with only `current_password`, `new_password` and `invalidate_other_sessions`, a success message shows, and every password field is empty.
2. **Given** "Sign out of other devices" is ticked, **When** the student submits, **Then** the request carries `invalidate_other_sessions: true`; unticked (the default) it carries `false`.
3. **Given** the change succeeded, **When** the session is re-checked with `GET /auth/me` and is still valid, **Then** the student stays on Settings.
4. **Given** the change succeeded but `GET /auth/me` answers 401, **When** the check finishes, **Then** the student is sent to login with `next=/student/settings`.

---

### User Story 2 - Be told what is wrong before anything is sent (Priority: P1)

The form blocks bad input on the device, with an error beside the field, and sends nothing.

**Independent Test**: In the browser, submit empty, mismatched, weak, and unchanged passwords and confirm no `/auth/change-password` request reached the backend (e2e, via `/__e2e/requests`).

**Acceptance Scenarios**:

1. **Given** an empty form, **When** the student submits, **Then** each of the three password fields shows a "required" error and no request is sent.
2. **Given** a new password with fewer than 8 characters, no digit, or no special character, **When** the student submits, **Then** the matching rule error shows under the new password field and no request is sent.
3. **Given** a confirmation that differs from the new password, **When** the student submits, **Then** a mismatch error shows under the confirmation field and no request is sent.
4. **Given** a new password equal to the current one, **When** the student submits, **Then** an error under the new password field says it must differ and no request is sent.
5. **Given** a request is in flight, **When** the student presses the button or Enter again, **Then** no second request is sent.

---

### User Story 3 - Understand a server rejection and recover (Priority: P1)

When the backend refuses, the student sees why, in a form-level alert, and keeps what they typed where that is safe.

**Acceptance Scenarios**:

1. **Given** the current password is wrong, **When** the backend answers 400 with a `detail`, **Then** that `detail` shows in a form-level alert and the three password fields are cleared (the checkbox keeps its state).
2. **Given** the backend answers 422 with a field location, **When** the error is mapped, **Then** the message shows next to that field and the typed values stay; with an unmappable location it shows in a form-level alert.
3. **Given** the backend answers 401, **When** the error arrives, **Then** the existing session-expired handling runs (the session is re-checked and the student goes to login with a return path).
4. **Given** the network fails or the backend answers 5xx, **When** the error arrives, **Then** a generic translated error shows and the typed values stay.

---

### User Story 4 - Settings is invisible when the flag is off (Priority: P1)

**Acceptance Scenarios**:

1. **Given** `SETTINGS_ENABLED` is unset or any value other than `"true"`, **When** anyone opens `/{locale}/student/settings`, **Then** the localized 404 renders and no change-password request is made.
2. **Given** the flag is off, **When** the student opens the account menu, **Then** there is no Settings item.

### Edge Cases

- **Google-only account** (no password): the backend's answer is undocumented. The form stays visible and the 400 path shows whatever the backend says (FR-036).
- **Revalidation fails for a reason other than 401** (offline right after success): the change already succeeded, so the student is not redirected; only a 401 means the session is gone.
- **Double submit** (Enter pressed repeatedly, button double-clicked): one request.
- **Locale switch mid-form**: the page remounts with the new language; values are not preserved (same as every other student form).
- **Browser password managers**: the fields carry `autocomplete="current-password"` and `autocomplete="new-password"`, so a manager can fill and offer to save.
- **Very long values**: the inputs are `w-full` and never overflow at 390px.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The route `/[locale]/student/settings` exists and is a Server Component that reads `featureFlags.settingsEnabled` before rendering anything.
- **FR-002**: With the flag off the route calls `notFound()` (the localized 404) before any client render or request.
- **FR-003**: `StudentUserMenu` shows a "Settings" menu item linking to `/student/settings` only when the flag is on. The sidebar and the tab bar are unchanged (`studentNavigation`, `studentTabBarOrder` stay as they are).
- **FR-004**: The student header shows a "Settings" title and description on the route.
- **FR-010**: The form has current password, new password and confirm new password fields, in that order, each with a visible label.
- **FR-011**: Each password field has a show/hide toggle with an accessible, translated name that reflects the current state.
- **FR-012**: A checkbox "Sign out of other devices" is unchecked by default and maps to `invalidate_other_sessions`.
- **FR-013**: The new and confirm fields use `autocomplete="new-password"`; the current field uses `current-password`.
- **FR-020**: All three password fields are required.
- **FR-021**: The new password must satisfy the shared rules in `src/features/auth/schemas/password.schema.ts` (at least 8 characters, one digit, one of `!@#$%^&*(),.?":{}|<>`). The rules are imported, never copied.
- **FR-022**: The confirmation must equal the new password.
- **FR-023**: The new password must differ from the current password.
- **FR-024**: Errors show next to their field. No request is sent while the form is invalid or a request is in flight.
- **FR-025**: The request is `POST /auth/change-password` through `apiClient` and the `/backend` proxy, body exactly `{ current_password, new_password, invalidate_other_sessions }`. The `old_password` alias, `revoke_other_sessions`, and the confirmation are never sent.
- **FR-030**: On 400, the backend `detail` shows in a form-level `role="alert"`; the three password fields are cleared.
- **FR-031**: On 422, errors for `current_password`/`old_password` and `new_password` are shown on their fields; anything else is shown in a form-level alert. Typed values stay.
- **FR-032**: On 401 the session is re-checked through the existing current-user query; if it is gone the student goes to login with the existing return path.
- **FR-033**: On a network error, 5xx or any other failure a generic translated error shows and typed values stay.
- **FR-034**: A 400 without a usable `detail` shows a translated fallback, never the apiClient's internal default text.
- **FR-036**: The form is not hidden for accounts that may have no password (see Assumptions).
- **FR-040**: On success a translated message shows in a `role="status"` region and the form is reset (fields empty, toggles hidden, checkbox unchecked), on the same page.
- **FR-041**: After success, `GET /auth/me` is re-fetched through the existing `useCurrentUser` query.
- **FR-042**: If that check answers 401, the student is sent to `/login?next=<settings path>`, using `loginPathWithNext`. Any other outcome leaves the student on the page.
- **FR-050**: All copy is in `src/messages/en.json` and `src/messages/ar.json` (new `Settings` namespace; `StudentLayout.pages.settings` and `StudentLayout.userMenu.settings` for the shell). The two files have identical key sets.
- **FR-051**: Arabic plural messages carry every category (`zero`/`=0`, `one`, `two`, `few`, `many`, `other`) and use `{count, number, integer}` rather than `#`.
- **FR-052**: Layout uses logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `start-`, `end-`); password inputs are `dir="ltr"`.
- **FR-053**: The page works at 390px without horizontal scroll, in `en` and `ar`.
- **FR-060**: `SETTINGS_ENABLED` is documented in `.env.example` (empty) and set to `"true"` only in the e2e flags-on server. It is set nowhere else.

### Key Entities

- **ChangePasswordRequest** `{ current_password: string; new_password: string; invalidate_other_sessions: boolean }`.
- **ChangePasswordFormValues** `{ currentPassword; newPassword; confirmPassword; signOutOtherDevices }`. Maps to the request; `confirmPassword` never leaves the device.
- **ChangePasswordFailure** a classified error: `rejected` (400), `validation` (422), `unauthorized` (401), `unavailable` (anything else).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A student changes their password in one submission and signs in with the new one (e2e, en and ar).
- **SC-002**: An invalid form produces zero `POST /auth/change-password` requests (e2e asserts the request log is empty).
- **SC-003**: With the flag off, the route returns the localized 404 and the backend receives no `/auth/change-password` request (e2e, en and ar).
- **SC-004**: `pnpm lint`, `pnpm exec tsc --noEmit`, `node --test tests/*.test.mjs` and `pnpm test:e2e` all pass.

## Assumptions

Made without asking, as the brief requires. Every one is repeated in the PR description.

- **A1 (entry point reach)**: `StudentUserMenu` is rendered only below the `sm` breakpoint (640px) today. The brief fixes the entry point to that menu, so the Settings link is visible on phones only. Tablet and desktop widths have no in-app link until a later change; the URL works at every width. Not widened here because it would add a second entry point the brief did not ask for.
- **A2 (header page key)**: Settings is not a navigation item, but the header needs a title for the route. `settings` is added to `StudentPageKey` and `getStudentPageKey`, and `StudentLayout.pages.settings` holds the copy. `studentNavigation`, `studentTabBarOrder` and the five-tab cap are untouched.
- **A3 (422 text)**: the message beside a field on 422 is the backend's own `msg` (like the 400 `detail`), falling back to a translated generic message when it is empty.
- **A4 (400 fallback)**: when a 400 has no string `detail`, `apiClient` produces the text `error happen`. That text is treated as "no detail" and replaced by a translated message.
- **A5 (session re-check)**: only a 401 from the re-check counts as "session not valid". A network failure right after a successful change does not redirect.
- **A6 (re-check redirect)**: on 401 the cache is cleared and the student is sent to login with `loginPathWithNext`, the same pair of actions `RoleGuard` and `useLogout` use. `invalidateQueries` alone does not redirect, because `AuthProvider` keeps the last good user while a refetch fails.
- **A7 (visibility toggle)**: the toggle markup exists only inline in `ResetPasswordForm`. It is re-created in a feature-local `PasswordField` on top of the shared `FormField`; `ResetPasswordForm` is not refactored.
- **A8 (success message lifetime)**: the success message stays until the next submit starts.
- **A9 (no session-refresh assumption)**: whether the backend keeps the current session after a password change is not in the contract. The client does not assume it, which is why FR-041/042 exist.
- **A10 (Google-only accounts)**: see **Open Questions**.

## Open Questions

- **Q-GOOGLE**: Accounts created through Google sign-in may have no password. The contract does not say what `POST /auth/change-password` returns for them (possibly 400 with a `detail`, possibly something else), and it does not offer a "set a password" flow. The form is shown to everyone and the 400 path displays the backend's `detail`. The backend team should confirm the status code and message, and decide whether a "set password" flow is wanted.
