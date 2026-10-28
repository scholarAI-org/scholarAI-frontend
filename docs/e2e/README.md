# End-to-end smoke tests (student flow)

Playwright tests that drive the real app in a browser, in English and Arabic, against a
**fake backend** that ships with the tests. They need no network, no account and no secrets.

## Run them

```bash
pnpm install
# One browser, once. Either Playwright's own Chromium...
pnpm exec playwright install chromium
# ...or reuse one already installed (Edge or Chrome) for every run:
export E2E_BROWSER_CHANNEL=msedge   # or: chrome   (PowerShell: $env:E2E_BROWSER_CHANNEL='msedge')

pnpm test:e2e
```

`pnpm test:e2e` builds the app once (`next build`, reused on later runs), starts everything
the tests need, runs them and shuts it all down. After changing application code run
`E2E_REBUILD=1 pnpm test:e2e`, otherwise the old build is tested.

Arguments go straight to Playwright:

```bash
pnpm test:e2e discovery.spec.ts          # one file
pnpm test:e2e -g "save from the results" # by title
pnpm test:e2e --headed --workers=1       # watch it
pnpm exec playwright show-report node_modules/.cache/e2e/report
```

| Variable              | Default | Meaning                                                     |
| --------------------- | ------- | ----------------------------------------------------------- |
| `E2E_BROWSER_CHANNEL` | _unset_ | `msedge` / `chrome` to use an installed browser             |
| `E2E_WORKERS`         | `2`     | parallel workers (tests are isolated per user, so >1 is ok) |
| `E2E_REBUILD`         | _unset_ | `1` forces `next build` before the run                      |
| `E2E_BASE_URL`        | _unset_ | remote mode, see "Pointing the tests at DEV"                |

Ports used locally: `4010` (fake backend), `3100` (app, features on), `3101` (app, features
off). Traces and screenshots of failures are kept in `node_modules/.cache/e2e/`.

## How it works

```
 Playwright ──▶ app :3100  (STUDENT_HOME / SAVED / TRACKING flags = true) ─┐
            ──▶ app :3101  (every flag unset)                               ├─ /backend/* ─▶ fake backend :4010
                           same `next build`, two `next start` processes ──┘     (BACKEND_URL)
```

- **The app is pointed at the fake through `BACKEND_URL`**, the same server-side variable the
  app uses everywhere (`src/proxy.ts` rewrites `/backend/*` to it). The browser only ever
  talks to the app, so the session cookie is first-party exactly as in production.
- **Feature flags are read at request time** (every route is dynamic), so one build serves
  both a flags-on and a flags-off server. The `flags-on` Playwright project runs every spec
  except `flags-off.spec.ts`, which is the only spec of the `flags-off` project.
- **`tests/e2e/fake-backend/server.mjs`** is a standalone, dependency-free Node server: cookie
  session, auth (register / verify / login / logout), profile, discovery, save and unsave,
  saved list, tracked list with status, note and remove. Response shapes follow
  `docs/api/openapi.json` and the live schema. Nothing under `src/` imports it.
- **Every test creates its own user** through the fake's `/__e2e/*` control API (not part of
  the real API) and asserts on what the backend received (`/__e2e/requests`) or holds
  (`/__e2e/state`). No test depends on another, so order and parallelism do not matter.
- **UI text comes from `src/messages/{en,ar}.json`** (`tests/e2e/support/messages.ts`), formatted
  like the app does, so copy edits do not break the tests and both languages share one test.
- **No network.** The profile page calls `countries.dev`, `api.openalex.org` and
  `cdn.simplelocalize.io` from the browser; the tests answer those and abort any other
  external host.
- **No sleeps.** Every wait is a Playwright auto-wait or an `expect` / `expect.poll` on a
  condition. There are no retries: a test that needs one is flaky and must be fixed.

## What is covered

All in English **and** Arabic unless noted.

| Area               | Spec                                | What is checked                                                                                                                                                                                                               |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Register / sign in | `auth.spec.ts`                      | register with email, verification code, sign in, land on profile; register sends only `full_name`, `email`, `password`; sign in; wrong password message (en); guest sent to a protected page returns to it after sign-in (en) |
| Discovery          | `discovery.spec.ts`                 | first page newest first; search and clear; no-match state; funding + country filters, their empty state and "clear filters"; sort by deadline; page 2. Expected results are computed from the fake's catalog                  |
| Save / unsave      | `saved.spec.ts`                     | save from results, persists after reload, shows on the Saved page, unsave from there; seeded Saved page; empty state link to search                                                                                           |
| Home (flag on)     | `home.spec.ts`                      | welcome name, profile completion, saved / in-progress / upcoming counts (a finished application counts as neither), three soonest deadlines, latest scholarships and their lock below 70%, empty account                      |
| Tracking (flag on) | `tracking.spec.ts`                  | list with status and counters, status change (kept after reload), add and edit a note, stop tracking (saved scholarship stays), empty state                                                                                   |
| Profile            | `profile.spec.ts`                   | personal info save sends `full_name_ar` and `full_name_en`, moves to the next step, names shown after reload; a name that is not four parts sends nothing                                                                     |
| Flags off          | `flags-off.spec.ts`                 | Home, Saved and Tracking are missing from the sidebar and their routes show "This page could not be found." without requesting any of their data                                                                              |
| Navigation (on)    | `navigation.spec.ts`                | sidebar order Home, Search, Saved, Tracking, Profile                                                                                                                                                                          |
| Read-only subset   | `readonly.spec.ts`, `smoke.spec.ts` | tagged `@readonly`, data-agnostic, safe against a deployed environment (below)                                                                                                                                                |

## What is not covered

- **Starting to track a scholarship (pending).** This branch's app has no "start tracking"
  action or client call (the backend's `PUT /api/scholarships/{id}/tracking` is unused), so
  tracked applications are seeded in the fake and only status, note and remove are driven
  through the UI. The UI exists on `feat/008b-tracking-finish`; `start-tracking.spec.ts`
  holds the flow as `test.fixme` (listed as skipped) with the steps to enable it once that
  branch is merged: un-fixme, and teach the fake the start endpoint.
- Google sign-in, forgot / reset password, resend code, logout.
- The scholarship details page (`SCHOLARSHIP_DETAILS_ENABLED` stays off), the admin area.
- Profile steps other than personal information (academic, preferences, skills, experience,
  documents, avatar upload) and the date / select widgets of the personal form (the tests
  start from a complete profile and edit the two names).
- Phone and mobile layouts (desktop 1280 px only), visual regressions, screen readers.
- **Contract drift.** The fake follows the schema as of 2026-10-28. It cannot tell you
  that the real backend changed; a Gate-2 run against a real environment still has to.
- The HTTP status of a flag-off route (it is 200 with the not-found page, a known
  property of the shared layout), only the visible result is asserted.

## Pointing the tests at DEV later

Only the specs tagged `@readonly` can run against a deployed environment. They look, search
and filter; they never register, save, change or remove anything, and they make no
assumption about the data. Everything else needs the fake backend's control API and stays
local.

```bash
export E2E_BASE_URL=https://<the DEV frontend>            # no trailing path
export E2E_STUDENT_EMAIL=<a DEV student account>
export E2E_STUDENT_PASSWORD=<its password>                 # from your secret store / CI secrets
pnpm test:e2e
```

Notes:

- With `E2E_BASE_URL` set nothing is built or started and the `flags-off` project does not
  exist; only `@readonly` tests run. Credentials are read from the environment, never from
  the repo; use a dedicated test account, never a personal one.
- They expect Saved, Tracking and Home to be on in that environment. If a flag is off there,
  its `@readonly` assertion fails, which is also information.
- Signing in creates a session on the environment, which is the only side effect.
- Never point this at Production.
- To make another test DEV-safe: put `@readonly` in its title, obtain the session with
  `startReadonlySession(page)`, avoid the control API (`support/backend.ts`), and assert on
  structure rather than on seeded data.
