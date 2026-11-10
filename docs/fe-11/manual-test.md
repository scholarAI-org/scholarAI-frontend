# Manual test on a real session (FE-11 / FE-12)

Everything in `docs/fe-11/README.md` was verified against a fake backend. This
is the checklist for the first run against a real backend with a real login.
Placeholders only: never commit real values or paste secrets into a PR.

## Before you start

- **Which backend.** `.env.example` points local runs at the _staging_ backend and
  labels `https://scholarai-tpxy.onrender.com` as _production_. Use the backend you
  call DEV; if that is `tpxy`, treat it as shared data.
- **Steps 3 and 4 write data** (a tracking row, a report). Use a test student
  account, and ask an admin to dismiss the test report afterwards.
- You need a **student** account that can log in (email verified) and a
  scholarship that is visible to students. The steps use id `564`; any visible id works.
- Tools: Node and `corepack` (pnpm is run as `corepack pnpm ...`), a Chromium
  browser with DevTools open on the **Network** tab (filter: `backend`).

## 1. Run the app locally against the backend

Create `.env.local` in the repo root (it is git-ignored). Placeholders:

```env
# Origin of the backend you test against, no trailing slash.
BACKEND_URL=<BACKEND_ORIGIN>

# Optional locally. Leave empty unless you were given the matching value.
PROXY_SHARED_SECRET=

# Page under test.
SCHOLARSHIP_DETAILS_ENABLED=true
# Start tracking control on the details page (and the tracking page).
TRACKING_ENABLED=true
# FE-12. Default OFF; turn on only for steps 5 and 6, then remove again.
SCHOLARSHIP_REPORTS_ENABLED=true
SCHOLARSHIP_ELIGIBILITY_ENABLED=true
```

```sh
corepack pnpm install
corepack pnpm dev            # http://localhost:3000
```

How it connects: the browser only calls this app at `/backend/...`;
`src/proxy.ts` rewrites that to `BACKEND_URL`. So the login cookie the backend sets
is first-party, and you do not configure CORS or a rewrite yourself. In DevTools a
request to `/backend/api/scholarships/564` is the call to
`<BACKEND_ORIGIN>/api/scholarships/564`.

Flags are read on the server at startup: **restart `pnpm dev` after changing
`.env.local`.**

## 2. Log in

Open `http://localhost:3000/en/login`, sign in as the student.
Expected: you land on a student page (profile or home) with the sidebar, and
`GET /backend/auth/me` returns 200. If you are bounced back to login, the cookie was
not stored: check that `BACKEND_URL` is correct and that the cookie appears under
DevTools → Application → Cookies for `localhost`.

## 3. Checks

Run each on `http://localhost:3000/en/student/scholarships/564`, then repeat step A
once on `/ar/...`. "Expected" is what you should see; anything else is a bug.

| #   | Do                                                                                                                                                                | Expected                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Open `/en/student/scholarships/564`. In Network open `GET /backend/api/scholarships/564` → Response.                                                              | 200. The page shows the title, the image (or the grey fallback), the deadline line and the status chip. A card appears **only** for data the response has: About (provider, university, country, type), Funding, Eligibility requirements, Required documents, Key dates, Source and files. Fields that are `null`/missing show no card or tile. No stored HTML description is shown. No red errors in the Console.                                                                   |
| A2  | Open `/ar/student/scholarships/564`.                                                                                                                              | Same content, right-to-left. The side column (apply, save, track) is on the left, the sections on the right. Icons and arrows point the right way; numbers read normally.                                                                                                                                                                                                                                                                                                             |
| B   | Click **Save scholarship** (Arabic: حفظ المنحة).                                                                                                                  | The button flips at once to **Remove saved scholarship**. Network: `POST /backend/api/scholarships/564/save` → 200. Reload the page: it still shows Remove. If it was already saved at the start, the first state is Remove.                                                                                                                                                                                                                                                          |
| B2  | Click **Remove saved scholarship**.                                                                                                                               | Flips back to Save. `DELETE /backend/api/scholarships/564/save` → 200. Reload: still Save.                                                                                                                                                                                                                                                                                                                                                                                            |
| C   | With `TRACKING_ENABLED=true` and the scholarship **not** tracked: click **Track application** (under the Save button).                                            | It flips at once to **Tracking: Preparing documents** (a link). Network: `PUT /backend/api/scholarships/564/tracking`, request body `{"status":"preparing_documents"}`, response 200 with `status` and `updated_at`. Reload: still tracked. If it was already tracked, you see the Tracking link straight away and **no** PUT is sent.                                                                                                                                                |
| C2  | Click the **Tracking: …** link, find the card for scholarship 564 on `/en/student/tracking`, and change its status to **Applied**. Come back to the details page. | The tracking page shows the new status (`PATCH /backend/api/scholarships/tracked/{id}/status` → 200). The details page now says **Tracking: Applied**. (Status changes live on the tracking page; the details page only starts tracking.)                                                                                                                                                                                                                                             |
| C3  | Clean up: on the tracking page choose **Stop tracking** for 564.                                                                                                  | The card disappears. Back on the details page (after a reload) **Track application** is offered again.                                                                                                                                                                                                                                                                                                                                                                                |
| D   | (Reports flag on) Scroll the side column to **Have a problem with this scholarship?** and click **Report a problem**.                                             | A modal opens; keyboard focus is on the first reason; the page behind cannot be clicked or tabbed into. Six reasons are listed plus an optional **Details** box with a `0 / 2000` counter.                                                                                                                                                                                                                                                                                            |
| D2  | Press **Esc**.                                                                                                                                                    | The modal closes and focus returns to the **Report a problem** button.                                                                                                                                                                                                                                                                                                                                                                                                                |
| D3  | Reopen. Press **Send report** with nothing chosen.                                                                                                                | **Choose a reason.** appears in red and focus moves to the first reason. No request is sent.                                                                                                                                                                                                                                                                                                                                                                                          |
| D4  | Choose **Broken link**. Paste more than 2000 characters into Details. Press **Send report**.                                                                      | The counter turns red, **Keep the details to 2,000 characters or fewer.** appears and no request is sent.                                                                                                                                                                                                                                                                                                                                                                             |
| D5  | Replace the details with `Manual test - please ignore`. Press **Send report**.                                                                                    | **Report sent** replaces the form. Network: `POST /backend/api/scholarships/564/reports`, body `{"report_type":"broken_link","description":"Manual test - please ignore"}` → 201. The text of the backend's Arabic confirmation is **not** shown. Press **Close**.                                                                                                                                                                                                                    |
| D6  | Open the dialog again, choose **Broken link** once more and send.                                                                                                 | While the first report is unresolved the backend answers 409 and the dialog shows **You already have an open report of this type for this scholarship.** The form stays open. (Choosing another reason sends a new report: only do that if you want a second test report.)                                                                                                                                                                                                            |
| E   | (Eligibility flag on) Look for **Eligibility at a glance** in the side column. In Network open `GET /backend/api/scholarships/564/eligibility` → Response.        | 200. One row per field that is **not null** in the response: nationalities, degree level, gender, residency, fields of study, languages, minimum GPA, maximum age, experience, soft skills. `false` shows **Not required**, `true` shows **Required**, an empty list shows **No restriction**, and `null` fields get no row but are counted in **Not specified by the source: N**. If every field is null the whole card is absent. The note says it does **not** check your profile. |
| F   | Open `/en/student/scholarships/999999999`.                                                                                                                        | **Scholarship not found**, with the back link. (Network: `GET …/999999999` → 404.) A scholarship that exists but is not visible to students gives the identical screen.                                                                                                                                                                                                                                                                                                               |
| G   | Open `/en/student/scholarships/abc` and `/en/student/scholarships/07`.                                                                                            | The app's own 404 page (the route rejects non-canonical ids before any request).                                                                                                                                                                                                                                                                                                                                                                                                      |
| H   | Delete the login cookie in DevTools and reload the details page.                                                                                                  | `GET …/564` → 401 and you are sent to the login page; after signing in you can open the scholarship again.                                                                                                                                                                                                                                                                                                                                                                            |
| I   | Remove `SCHOLARSHIP_REPORTS_ENABLED` and `SCHOLARSHIP_ELIGIBILITY_ENABLED` from `.env.local`, restart, reload 564.                                                | Neither the **Eligibility at a glance** card nor the report card is shown; everything else is unchanged. This is the default state of a deployment.                                                                                                                                                                                                                                                                                                                                   |

## 4. Report back

Copy this list into the PR or send it back. For a failure add the step number,
what you saw, and the failing request (method, URL, status, response body without
tokens).

```text
A  [ ]   A2 [ ]   B  [ ]   B2 [ ]   C  [ ]   C2 [ ]   C3 [ ]
D  [ ]   D2 [ ]   D3 [ ]   D4 [ ]   D5 [ ]   D6 [ ]
E  [ ]   F  [ ]   G  [ ]   H  [ ]   I  [ ]
Backend used (name only, no URL secrets):
Anything unexpected in the Console:
```

## Known limits to keep in mind

- `/eligibility` returns the scholarship's **own criteria**, not a per-student
  match. The personal-match card from the Figma stays out until the backend provides
  it (BE-05); the indicator above never compares anything with the student's profile.
- The stored HTML description (`description_html`) is deliberately never rendered.
- Mobile layouts are out of scope for this branch (desktop 1024+ only).
