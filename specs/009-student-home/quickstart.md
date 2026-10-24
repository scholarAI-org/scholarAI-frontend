# Quickstart: 009 Student Home

How to run and validate Home locally once it is implemented. Behavior details are in [spec.md](./spec.md), shapes in [data-model.md](./data-model.md) and [contracts/](./contracts/). Paths assume the approved decisions (`/student`, flag `STUDENT_HOME_ENABLED`).

## Prerequisites

- Node 20+ (verified on 24.22.1). pnpm via `corepack pnpm` if `pnpm` is not on PATH.
- Worktree `../scholarai-frontend-009` on `feat/009-student-home`, then `corepack pnpm install`.
- A **student** account on the staging backend with: some saved scholarships, some tracked applications in mixed statuses, and a profile under 70% (plus a second account at or above 70%).

## 1. Environment (`.env.local`, never committed)

```env
BACKEND_URL=https://scholarai-backend-2e27.onrender.com
STUDENT_HOME_ENABLED=true
SAVED_SCHOLARSHIPS_ENABLED=true        # optional: makes the saved card a link
SCHOLARSHIP_DETAILS_ENABLED=true       # optional: makes deadline rows links
# HOME_MOCK_SECTIONS=notifications,activity   # optional demo data, dev only
```

## 2. Run

```sh
corepack pnpm dev
# open http://localhost:3000/ar/student and http://localhost:3000/en/student
```

## 3. Probe the backend first

While signed in as the student in the browser, open these same-origin URLs (they go through the proxy with your cookie):

| URL                                 | Expect                                                                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/backend/profile`                  | 200 with `profile_completion_percentage` between 0 and 100                                                                                                     |
| `/backend/api/scholarships/saved`   | 200 array                                                                                                                                                      |
| `/backend/api/scholarships/tracked` | 200 array. **If 404, the endpoint is not deployed on staging. Record it in verification.md; Home must show errors (not zeros) for in-progress and deadlines.** |

## 4. Scenarios

| #   | Do                                                                               | Expect                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Open `/en/student` as the student                                                | Header "Hello, {full name}"; welcome "Welcome back, {first name} 👋"; today's date; completion % equal to `/backend/profile`.                                                           |
| S2  | Compare counts with the probes                                                   | Saved = saved array length. In progress = tracked items with status ∉ {accepted, rejected, closed}.                                                                                     |
| S3  | Check the deadlines list                                                         | ≤3 rows, nearest first, only 0–30 days. Badge red 0–7, amber 8–14, green 15–30. A scholarship that is both saved and tracked appears once. Card count = all in-window items.            |
| S4  | Switch to `/ar/student`                                                          | RTL, Arabic copy, Latin digits, mirrored chevrons, no horizontal scroll at 1024/1280/1440 px.                                                                                           |
| S5  | Student under 70%                                                                | Locked panel; "Complete profile" opens `/student/profile`; "View all" hidden.                                                                                                           |
| S6  | Student at or above 70%                                                          | "Latest scholarships" with 3 cards; "View all" opens search.                                                                                                                            |
| S7  | DevTools → block `/backend/api/scholarships/saved` and reload                    | The saved card and deadlines show an error with Retry; in-progress and completion still render. Unblock → Retry refetches only `saved` (one request in the Network tab).                |
| S8  | Delete the session cookie and trigger a refetch (refocus the window)             | Redirect to `/login?next=/student`; after login you are back on Home.                                                                                                                   |
| S9  | Flag unset (`HOME_MOCK_SECTIONS` removed)                                        | No notifications card (the row shows 3 evenly sized cards), no bell, no theme control, no recent-activity section, and no "Demo data" badge anywhere.                                   |
| S10 | `HOME_MOCK_SECTIONS=notifications,activity` + restart                            | Card appears first (the row shows 4 evenly sized cards), the bell and its dot appear, and four activity rows appear, each section with "Demo data". Card and bell show the same number. |
| S11 | `corepack pnpm build && corepack pnpm start` with `HOME_MOCK_SECTIONS` still set | Same as S9: the production build ignores the flag.                                                                                                                                      |
| S12 | `STUDENT_HOME_ENABLED` unset                                                     | `/en/student` is a 404 and the sidebar has no Home item.                                                                                                                                |
| S13 | Sign in as an admin and open `/en/student`                                       | Redirected to `/admin/dashboard`.                                                                                                                                                       |
| S14 | Leave the page open across local midnight (or change the OS clock) and refocus   | The date and the days-left badges update.                                                                                                                                               |

## 5. Automated checks

```sh
node --test --test-isolation=none tests/student-home.test.mjs
corepack pnpm test:student-layout
corepack pnpm test:i18n
node node_modules/typescript/bin/tsc --noEmit
corepack pnpm lint
corepack pnpm build
```

Compare the full suite against the baseline in [verification.md](./verification.md) §Baseline. Only the known pre-existing failures may remain.
