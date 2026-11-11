# Contract notes: 010 Student Settings

Source: `docs/api/openapi.json` (operation `change_password_auth_change_password_post`), read 2026-11-11.

## `POST /auth/change-password`

Authenticated (session cookie, forwarded by the `/backend` proxy). Called with `apiClient('/auth/change-password', …)`, like `/auth/logout` and `/auth/reset-password`.

### Request body (what the frontend sends)

```json
{ "current_password": "…", "new_password": "…", "invalidate_other_sessions": false }
```

Exactly these three keys, always all three. The schema also declares `old_password` (alias of `current_password`) and `revoke_other_sessions` (alias of `invalidate_other_sessions`). **Neither alias is sent.** The confirmation field never leaves the device.

`new_password`: at least 8 characters, one digit, one special character from `!@#$%^&*(),.?":{}|<>`. The frontend rules come from `src/features/auth/schemas/password.schema.ts` (`RESET_PASSWORD_MIN_LENGTH`, `createResetPasswordValueSchema`).

### Responses

| Status | Meaning (contract)                                     | Frontend behavior                                                      |
| ------ | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| 200    | `{ "message": string }`                                | Translated success message; form reset; re-check `GET /auth/me`        |
| 400    | Old password incorrect, or new password identical      | Backend `detail` in a form-level alert; password fields cleared        |
| 401    | Missing or invalid authentication                      | Re-check the session through the current-user query; login with `next` |
| 422    | `HTTPValidationError` (`detail: [{ loc, msg, type }]`) | Field errors where `loc` names a field, else a form-level alert        |
| other  | not in the contract (network error, 5xx, 403, 404, …)  | Generic translated error; typed values kept                            |

`apiClient` turns a non-2xx response into `ApiError(message, details, status)`: `message` is `detail` when it is a string, `detail[0].msg` when it is an array, and the literal `error happen` when there is no usable `detail`. `details` is the `detail` array (empty otherwise).

### Not in the contract (open)

- What the backend answers for an account that has **no password** (Google sign-in). See Open Questions in [spec.md](./spec.md).
- Whether the **current** session survives a password change, with or without `invalidate_other_sessions`. The client re-checks `GET /auth/me` after success instead of assuming.
- The exact `loc` values on 422. The client accepts `current_password`, `old_password` and `new_password` as the last path element.

## `GET /auth/me`

Used through the existing `useCurrentUser` query (`['auth', 'current-user']`) to confirm the session after a successful change. Not changed.
