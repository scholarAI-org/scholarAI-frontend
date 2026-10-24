# Verification: 009 Student Home

**Status**: **Gate 1 PASSED** on 2026-10-24 (frontend complete, verified locally against a fake backend). **Gate 2 (staging backend) is pending.** Not launched: `STUDENT_HOME_ENABLED` is off by default.

## Gates

| Gate                      | Meaning                         | Exit criteria                                                                                                                                   | Status      |
| ------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Gate 1: frontend complete | Built and tested locally        | All automated checks green except the baseline failures; production build free of demo data; browser checks in ar and en pass; mock guard green | **PASSED**  |
| Gate 2: live verification | Staging backend, Preview deploy | Quickstart S1–S9, S12–S13 pass against staging in ar and en; `/api/scholarships/tracked` confirmed deployed; completion scale confirmed 0–100   | **Pending** |
| Launch                    | Production                      | **Turn on `STUDENT_HOME_ENABLED=true` in Vercel Production**, only after Gate 2 and §4 sign-off (see the §4 launch checklist)                   | Not started |

## 1. Gate 1 results (measured 2026-10-24, Node 24.22.1, Windows)

### Automated

| Check                                               | Result                                                                                                                                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/student-home.test.mjs`                       | **88 / 88 pass**                                                                                                                                                                                         |
| Related suites                                      | `student-layout` 15/15 · `student-saved-scholarships` 29/29 · `student-scholarship-details` 9/9 · `i18n-numerals` 6/6                                                                                    |
| Full suite vs baseline                              | **Identical to the baseline**: the same 9 pre-existing failures (below), every other file passes. No regression.                                                                                         |
| `tsc --noEmit`                                      | 0 errors                                                                                                                                                                                                 |
| `eslint` (whole repo)                               | 0 errors, 3 warnings (same 3 as the baseline, none in Home)                                                                                                                                              |
| `prettier --check` on every file the branch touches | clean, except `tests/student-layout.test.mjs`, which was already unformatted before this feature (existing `.mjs` tests are not Prettier-formatted)                                                      |
| `next build`                                        | succeeds; `/[locale]/student` is in the route table                                                                                                                                                      |
| Production build contains no demo data              | `__HOME_MOCK__` marker and demo scholarship titles: **0 files** in `.next/static` and **0** in `.next/server`. The unfiltered feed path `api/scholarships/recommendations` appears nowhere in the build. |

**A real defect found and fixed by this check** (`8a188dd`): the first build contained the demo marker (1 static chunk, 2 server files). The runtime gate still blocked it, but demo code shipped. The demo `import()` closures were created before the `NODE_ENV` check, so the bundler kept them reachable. The check is now inline in front of each import, a guard test keeps it that way, and the grep above is clean.

### Browser (Microsoft Edge driven by Playwright, against a fake backend)

The fake backend served `/auth/me`, `/profile`, saved, tracked and the discovery list, with toggles for failures, empty data and completion %. It lives outside the repo.

| Scenario                                                                                    | Result                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Widths 1024 / 1280 / 1440 × en / ar, 3-card row                                             | No horizontal overflow in any of the 6 combinations. Cards evenly sized (236 / 321 / 375 px), filling the row.                                                                                                         |
| Widths 1024 / 1280 / 1440 × en / ar, 4-card row (demo notifications + activity, dev server) | No horizontal overflow. 4 evenly sized cards (173 / 237 / 277 px). "Demo data" badge on the card and on the activity section; the bell appears.                                                                        |
| Real data matches a hand calculation                                                        | saved 4 · in progress 3 (the `accepted` application excluded) · upcoming 5 (a scholarship that is saved and tracked counted once; 45-day item outside the window)                                                      |
| Direction                                                                                   | `/en` content `ltr`, `/ar` content `rtl`. "View all" chevron: no rotation in en, 180° in ar.                                                                                                                           |
| Active navigation                                                                           | "Home" is the active item on `/student`; sidebar order Home, Search scholarships, Saved, Profile.                                                                                                                      |
| `saved` request fails                                                                       | Exactly 3 alerts (saved card, upcoming card, deadlines). In-progress card still shows 3, completion 85%, 3 latest scholarships unaffected. No "0" shown for saved.                                                     |
| Retry from the saved card                                                                   | Only `/api/scholarships/saved` was requested (1 call); tracked, profile and discovery were not refetched. Everything recovered.                                                                                        |
| `tracked` request fails (ar)                                                                | 3 alerts; saved card still 4. Retry from the deadlines section requested only `/tracked`. Recovered.                                                                                                                   |
| `profile` request fails                                                                     | Welcome card shows an alert and keeps greeting and date; recommendations stay **locked**; stat cards unaffected.                                                                                                       |
| Empty account                                                                               | Deadlines empty state with a search link; saved, in progress, upcoming show real zeros; locked panel at 40% with a Complete profile link.                                                                              |
| Completion boundary                                                                         | 70 → unlocked. 69.6 → locked while displaying "70%".                                                                                                                                                                   |
| Production server, flag on, `HOME_MOCK_SECTIONS=notifications,activity,recommendations`     | No notifications card, no activity section, no bell, no "Demo data" text, in en and ar. 3 cards. The flag is ignored in production as designed.                                                                        |
| Production server, `STUDENT_HOME_ENABLED` unset                                             | `/student` shows "404 This page could not be found." with `noindex` and no Home content; the backend received only `/auth/me` (no profile, saved, tracked or discovery request). Sidebar has no Home item in en or ar. |

### Not verified (be explicit)

- **Staging backend with real accounts** (Gate 2): in particular that `GET /api/scholarships/tracked` is deployed and that `profile_completion_percentage` is 0–100. Everything above used a fake backend that follows `docs/api/openapi.json`.
- Real screen reader, manual keyboard-focus walk-through, and visual comparison against Figma beyond a screenshot review. Accessible names, `role="progressbar"` values and `role="alert"` are covered by markup assertions only.
- Mobile and tablet layouts (out of scope).
- Tests run on one machine and one timezone setting; the timezone tests switch `TZ` explicitly (UTC, Asia/Riyadh, America/New_York).

## 2. Observations (not fixed here)

1. **Existing bug, outside this feature**: Tailwind's `rtl:` variant also matches `[dir=rtl] *`, and the root `<html>` is always `dir="rtl"`, so `rtl:` classes fire on English pages. Measured: the sidebar's logout icon (`rtl:rotate-180`) is rotated 180° in `/en`. Home avoids the variant (it uses `:dir(rtl)`, with a guard test), but the sidebar was left alone. Suggested follow-up: switch it to `[&:dir(rtl)]:rotate-180`, or set the real direction on `<html>`.
2. **HTTP status of a flag-off `/student` is 200, not 404.** The student layout streams its session-check shell before the page runs `notFound()`, so the status line is already sent. The visible result is the not-found page with `noindex`, and no Home data is fetched. This is how the existing flag-gated pages (Saved, Details) behave too. If a true 404 status matters, it needs a change in the shared layout or the proxy, which are out of bounds here.
3. **Locked-panel copy (resolved 2026-10-24)**: the Figma text promised "smart/personalized recommendations and match scores" while the unlocked panel shows the newest published scholarships. The product owner approved honest copy: the section heading is always "Latest scholarships"; the locked panel says "This section is locked" / "Complete at least 70% of your profile to see the latest scholarships here." (ar: "هذا القسم مقفل" / "أكمل 70% من ملفك الشخصي على الأقل لعرض أحدث المنح هنا."). A test forbids recommendation/personalization wording in the locked state in both languages.
4. `/favicon.ico` returns 404 app-wide (unrelated to Home).
5. The sidebar bell is a non-interactive indicator (`role="img"`) because no notifications page exists; it becomes a link when one does.

## 3. Automated test matrix (`tests/student-home.test.mjs`)

| Area                                 | Cases                                                                                                                                                                                                                                                                                                          | Spec                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Counts                               | in progress counts only `preparing_documents` / `ready_to_apply` / `applied`; empty → 0; unknown status → contract error                                                                                                                                                                                       | FR-015                 |
| Deadline window                      | 0, 1, 30 included; 31 and past excluded; `no_deadline`, null and invalid dates excluded; a date-time normalized                                                                                                                                                                                                | FR-021, FR-022         |
| Urgency, order, duplicates           | 0–7 / 8–14 / 15–30; ascending by days then id; top 3 of 5 with the true count; saved+tracked counted once; terminal tracked excluded                                                                                                                                                                           | FR-020, FR-024, FR-025 |
| Timezone and midnight                | same instant evaluated in `Asia/Riyadh` and `UTC` (a deadline is never shifted); next local midnight across month end and the New York DST change                                                                                                                                                              | Edge cases             |
| Relative time, identity, unlock      | buckets, future skew, Latin digits in ar; first name rules; 69.6 locked / 70 unlocked / unknown locked; display clamped                                                                                                                                                                                        | FR-009, FR-028, FR-031 |
| Mock guard (FR-040)                  | resolver `[]` for production, Vercel production, Vercel preview, unset, blank; drops unknown names; factory yields no demo source under `NODE_ENV=production`; real beats demo; the page ignores a demo list in production                                                                                     | FR-038, FR-040         |
| Static guards                        | only the factory references the demo folder, only via `import()` inside an inline production check; resolver imported only by server files; **no reference to the unfiltered recommendations feed**; demo marker confined to the demo folder; no `tests/`/`scripts/` imports; shared layout never imports Home | FR-040                 |
| Schemas                              | each contract accepts valid and rejects invalid shapes; every demo payload parses with the real schema                                                                                                                                                                                                         | FR-037, FR-038         |
| Stat-card row                        | 3 cards → 3-column grid, 4 cards → 4-column grid, no empty `<li>`, static class map, links only with a destination, loading/error per card                                                                                                                                                                     | FR-013                 |
| Deadlines, recommendations, activity | badges and plurals (en/ar), meta line, title language, clamp, links with the flag, empty/loading/error; locked vs unlocked panel, "Latest scholarships", no match score; activity sentences per type, relative time, no server text, cap of 4                                                                  | FR-024–FR-034          |
| Independence                         | one failing source affects only its sections; contract error is an error, never 0; 401 stays loading; retry refetches only failed queries                                                                                                                                                                      | FR-034–FR-037          |
| Hidden / demo                        | no source → no card, section, bell or "Demo data"; listed section → badge on that section only                                                                                                                                                                                                                 | FR-017, FR-039         |
| Shell                                | Home first in Discover, exact match, exactly one active item per route; flag shows or hides it; header unchanged and free of placeholder controls without actions; bell renders nothing without a source                                                                                                       | FR-004, FR-008         |
| i18n and RTL                         | key parity; ICU validity; no `#`; every plural category in ar; Arabic forms for 0/1/2/3/11/100; every literal key resolves; no physical-direction classes, no bare `rtl:` variant, directional icons use `:dir(rtl)`; no wide fixed widths; Latin digits across the page                                       | FR-041, FR-042         |

## 4. Pre-launch checklist: mocked sections (must be complete before Production)

Each section on demo data must be either **wired to its real API** or **confirmed hidden** in the build being launched.

| Section                                                                          | Real API wired? (`HOME_API_AVAILABILITY` = true, contract verified live) | Or confirmed hidden in Production build | Verified by / date |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------- | ------------------ |
| Unread notifications (stat card + header bell)                                   | ☐ "Student notifications unread count" shipped                           | ☐ hidden                                |                    |
| Recent activity                                                                  | ☐ "Student activity feed" shipped                                        | ☐ hidden                                |                    |
| Recommendations (not mocked; "Latest scholarships" uses the real discovery list) | ☐ "Personalized scholarship recommendations" shipped and Home switched   | ☐ n/a: shows "Latest scholarships"      |                    |

Also confirm, for the Production deployment:

- ☐ **Turn on `STUDENT_HOME_ENABLED=true`** in Vercel Production (it is off by default; until then `/student` shows "not found" and the sidebar has no Home item).
- ☐ `HOME_MOCK_SECTIONS` is **not set** in Vercel Production **and** Preview (Project → Settings → Environment Variables).
- ☐ No committed `.env*` file sets `HOME_MOCK_SECTIONS`.
- ☐ Re-run on the release build: `next build`, then `grep -r __HOME_MOCK__ .next` finds nothing. (Gate 1 evidence above is for the 2026-10-24 build.)
- ☐ The production build, opened with the demo list set, shows no "Demo data" badge (quickstart S11).
- ☐ `node --test tests/student-home.test.mjs` passes, including the mock guard tests.
- ☐ Gate 2 done: `/api/scholarships/tracked` is deployed on the target backend; completion is on a 0–100 scale.
- ☐ Backend security ask handled or accepted as a known risk: the public recommendations feed (`contract-notes.md` §2).

## 5. Follow-ups (outside this feature)

- Make Home the students' post-login landing (`ROLE_HOME.student`), which needs an auth change and approval.
- Replace `home/schemas/tracked-application.schema.ts` and `studentHomeKeys.tracked()` with the Tracking feature's type and key after it merges.
- Mobile layout (separate feature).
- When "Personalized scholarship recommendations" ships, switch the unlocked panel to personalized recommendations with match scores, and revisit the section heading and the locked-panel copy together.
- Fix the sidebar's `rtl:` icon flip on English pages (Observation 1).
- Backend security ask (public recommendations feed) tracked in `contract-notes.md` §2; Home never calls that endpoint.

## Baseline (pre-existing, not fixed here)

Measured 2026-10-24 on this branch before any code change (code identical to `main` `18c1453`), Node 24.22.1:

| File                                           | Pass/Total | Failure                                                                                |
| ---------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `tests/google-auth.test.mjs`                   | 0/1        | `Cannot find module src/lib/auth-storage.ts`                                           |
| `tests/profile-personal-information.test.mjs`  | 1/8        | 7 failures (ZodError / assertion) in personal-information normalization and completion |
| `tests/student-scholarship-discovery.test.mjs` | 91/92      | "the image fallback is a local asset and the img exception exists exactly once"        |
| 17 other test files                            | all pass   | —                                                                                      |

`tsc --noEmit`: 0 errors · `eslint`: 0 errors, 3 warnings · `build`: not run at baseline (succeeds after this feature).

Any failure outside this list is a regression from this feature. After implementation the failures are exactly the same set.
