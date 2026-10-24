# Research: 009 Student Home

**Date**: 2026-10-24 · **Inputs**: [spec.md](./spec.md), `docs/api/openapi.json`, code on `main` @ `18c1453`, Figma `2353:5365`

The product owner resolved the spec's open questions on 2026-10-24 ([clarifications.md](./clarifications.md)); each section below states the decision it implements. This document settles the technical unknowns.

---

## R1. Which data exists in the backend? (brief: "investigate first")

**Decision**: Real data for name, profile completion, saved count, in-progress count and deadlines. Notifications and activity have no API. Personalized recommendations have no API.

**Evidence**:

| Question                                              | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (a) Profile-completion percentage?                    | **Yes, from the backend.** `GET /profile` → `UserProfile.profile_completion_percentage: number` (default 0). The frontend already normalizes it in `src/features/profile/schemas/full-profile-api.schema.ts`, and the Profile page shows it (`ProfilePageContent.tsx` → `ProfileSummaryCard` ring). The frontend has only **per-step** percentages (`useProfileProgress`), and no overall calculation. Home must not compute its own.                                                                          |
| (b) Notifications or activity endpoint?               | **None for students.** `GET /admin/notifications`, `GET /admin/notifications/unread-count` and `PATCH /admin/notifications/{id}/read` require the admin role (`403 Requires admin role`). No activity, event or timeline endpoint exists. `/admin/dashboard/audit-logs` is admin-only and a different concept.                                                                                                                                                                                                 |
| (c) Recommendations endpoint or profile-based filter? | `GET /api/scholarships/recommendations` exists, but it is documented as a "public feed of all scholarships, ordered by ID, regardless of status" with full source HTML. It is **not personalized** and **not filtered to published listings**, so it is unusable for students. `GET /api/scholarships/` says "Personalized match ranking is unavailable" and has no profile-based filter. The card schema `ScholarshipDiscoveryCard` has no `match` field, although the frontend type has an optional `match`. |
| Tracked applications                                  | `GET /api/scholarships/tracked` (array of `StudentScholarshipTrackingResponse`: `id`, `status`, `notes`, `status_changed_at`, `created_at`, `updated_at`, `scholarship: ScholarshipDiscoveryCard`), plus an optional `?status=` filter. It includes closed applications and expired scholarships. `GET /api/scholarships/tracked/statistics` returns counters.                                                                                                                                                 |
| Saved                                                 | `GET /api/scholarships/saved`: unpaged; only listings still visible (deadline ≥ today UTC or no-deadline). The Feature 006 client `getSavedScholarships` validates it.                                                                                                                                                                                                                                                                                                                                         |

**Alternatives considered**: (1) Using `tracked/statistics` for both counts: rejected for the saved count because it includes expired saved records, so it would disagree with the Saved page. It stays a fallback for the in-progress count if payload size becomes an issue. (2) Using the `recommendations` feed: rejected (unpublished/closed listings, HTML payload, not personalized).

## R2. Reusable vs page-specific concepts (constitution delivery standard)

**Reused as is**: `StudentShell`, `StudentSidebar`, `RoleGuard`, `AuthProvider`/`useAuth`, `getStudentDisplayName`, `getStudentInitial`, `getSavedScholarships` + `studentScholarshipKeys.saved()`, `getScholarships` + `studentScholarshipKeys.discovery()`, `getDeadlineStatus`/`parseCalendarDate`/`toLocalCalendarDate` (`scholarship-discovery/lib/deadlines.ts`), `getFundingLabel`/`getStudyLevelLabel`/`formatCardFieldLabel` (`card-labels.ts`), `ScholarshipGridCard`, `Button`/`buttonStyles`, `toFormattingLocale`, lucide icons already used in the app.

**Shared shell, extended generically**: `StudentHeader` (title gets a `{name}` ICU argument; adds a `headerActions` slot), `student-navigation.ts`/`types.ts` (`home` item and page key).

**Page-specific, new in `features/student/home`**: welcome card, completion bar, stat card, deadline row and urgency badge, activity row, locked panel, section frame, demo badge, section-state mapping, derivations.

**Not a new shared component yet**: `ProfileCompletionBar`. The profile `ProgressMeter` looks different (label layout). If it turns out to match, reuse it instead; this is decided during implementation by visual comparison.

## R3. Deadline derivation, window, urgency and timezone

**Decision**:

- Candidates = saved cards ∪ tracked-item scholarships (Q5: tracked items with status `accepted`/`rejected`/`closed` are excluded), de-duplicated by `scholarship.id`. An item present in both keeps `origin: 'both'`.
- Days remaining come from `getDeadlineStatus(deadline, no_deadline, now)`, which compares **calendar dates** against the student's **local** calendar day (it never parses `YYYY-MM-DD` as UTC midnight). `kind: 'today'` → 0, `upcoming` → n, while `past`/`none`/`unspecified` are excluded.
- Window: `0 ≤ daysLeft ≤ 30` (`UPCOMING_WINDOW_DAYS = 30`).
- Urgency: `urgent` 0–7, `soon` 8–14, `comfortable` 15–30 (`URGENCY_URGENT_MAX = 7`, `URGENCY_SOON_MAX = 14`).
- Sort ascending by `daysLeft`, then by `id` ascending. Count = all in-window items; list = the first 3.
- Deadlines may arrive as `YYYY-MM-DD` or as a date-time. `parseCalendarDate` accepts only date-only strings, so a date-time is **normalized by taking its first 10 characters only if they form a valid date** (the backend's OpenAPI types `deadline` as `date`). This is a test case.

**Rationale**: it reuses the exact rule the discovery cards show, so Home and the card never disagree by a day. Pure functions with an injected `now` make timezone cases testable (`TZ=Asia/Gaza` vs `TZ=UTC` runs in the test).

**Alternatives**: computing in UTC (rejected: off by one for UTC+2/+3 students around midnight); server-side windowing via `deadline_from`/`deadline_to` (only exists on the discovery list, not on saved/tracked).

## R4. In-progress count

**Decision**: `tracked.filter(t => !['accepted','rejected','closed'].includes(t.status)).length`. Counting is by tracking record. If the backend ever allowed two records for the same scholarship, each counts, which matches "applications".

**Alternatives**: `tracked/statistics` (`preparing_documents + ready_to_apply + applied`): equivalent and lighter, but Home already needs the tracked list for deadlines, so it would only add a request.

## R5. Mock gating: where and how

**Decision**: three independent layers, any one of which blocks mocks.

1. **Server resolver** `resolveHomeMockSections(env)` (pure, server-only, called in `page.tsx` and `layout.tsx`): returns `[]` if `env.NODE_ENV === 'production'`, or `env.VERCEL_ENV` is `'production'` or `'preview'`, or `HOME_MOCK_SECTIONS` is unset or blank. Otherwise it splits on commas, trims, lowercases and keeps only `notifications | activity | recommendations`. Unknown names are dropped.
2. **Client factory** `createHomeSources({ mockSections })`: if `process.env.NODE_ENV === 'production'`, it ignores `mockSections` entirely. Next inlines this at build time, so the branch is dead code in production bundles. Otherwise, for each section, it uses `real` if `HOME_API_AVAILABILITY[section]`, else `mock` if listed, else `unavailable`. **Real always wins over mock** when the API is available.
3. **Module isolation**: only `sources/create-home-sources.ts` references `mocks/`, and only through `import('../mocks')`. That puts mocks in a separate chunk that is requested only when a mock adapter is chosen.

`HOME_MOCK_SECTIONS` is server-only (no `NEXT_PUBLIC_`), the same rule as the existing flags.

**Tests (FR-040)**: env matrix on the resolver; the factory under `NODE_ENV=production` returns no `mock` kind even when `mockSections` lists all three; a static scan asserts that no file under `src/` other than `create-home-sources.ts` contains `home/mocks` or `'../mocks'`; the resolver file is imported only by server files (`app/**/page.tsx`, `app/**/layout.tsx`).

**Alternatives**: a `NEXT_PUBLIC_` flag (rejected: client-tamperable, and against the project rule); MSW/service worker (rejected: new dependency and global interception; overkill); `scripts/dev-mock-backend.mjs` (it mocks the whole backend, not one section, and the brief asks for in-app adapters behind the real interface).

## R6. Contract validation

**Decision**: zod 4 schemas, one per contract, in `home/schemas/`. Real clients do `schema.safeParse(raw)` and throw `HomeContractError(section, issues)` on failure. Mock adapters return the **raw** payload object, and the same client-side parse runs on it. The adapter boundary is "unknown in, validated out", so mock and real follow exactly the same path after fetching.

- Saved keeps its existing hand-written validator (`validateSavedResponse`) and is not rewritten.
- `tracked-application.schema.ts` validates only the fields Home reads (`id`, `status` enum, `scholarship.{id,title,title_ar,title_en,deadline,no_deadline,funding_type,study_level}`) and lets the rest through, so additive backend fields never break Home.
- `profile-completion.schema.ts`: `{ profile_completion_percentage: z.number().finite() }` with passthrough; a missing field → 0 (the OpenAPI default is 0); a non-number → contract error; `404` → 0 (no profile yet, the same as `getProfile`).

**Alternatives**: reuse `normalizeFullProfile`. Rejected: it turns a non-number into `null`, which hides contract errors, and it parses the whole profile.

## R7. Per-section state, retry and 401

**Decision**: `section-state.ts` maps the queries a section needs to one state:

| State     | Rule                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------- |
| `hidden`  | source `unavailable` (notifications, activity, a recommendations source, if one is ever wired) |
| `loading` | any required query pending with no data                                                        |
| `error`   | any required query errored (contract or HTTP non-401)                                          |
| `empty`   | all succeeded and the derived list/count is empty (lists only; counts show `0`)                |
| `ready`   | otherwise                                                                                      |

Retry = `Promise.all(failedQueries.map(q => q.refetch()))`, so healthy queries are untouched. For **401**, `useUnauthorizedRedirect` watches the Home queries and calls `queryClient.invalidateQueries({ queryKey: currentUserQueryKey })` once. `AuthProvider` then sees 401, and `RoleGuard` replaces the route with `/login?next=/student`. The same pattern is used in `ScholarshipResults.tsx` and `useScholarshipBookmark.ts`. While this happens, the section shows its loading skeleton, not an error. Retry policy reuses `shouldRetryScholarshipQuery` (no retry on 401/403/404/422).

## R8. Today's date and hydration

**Decision**: `useToday()` returns `null` during SSR and the first client render, then the local `Date` after mount. It schedules a refresh at the next local midnight (`msUntilNextLocalMidnight(now)`, a pure function that is tested) and on `visibilitychange`→visible. The date is formatted with `Intl.DateTimeFormat(toFormattingLocale(locale), { day: 'numeric', month: 'long', year: 'numeric' })`, which gives Latin digits in Arabic. The deadline derivations use the same `now`.

**Alternatives**: rendering the date on the server (rejected: the server's timezone ≠ the student's, which causes hydration mismatch and a wrong day near midnight).

## R9. Relative time for activity

**Decision**: a pure `formatRelativeTime(occurredAt, now, locale)` using `Intl.RelativeTimeFormat(toFormattingLocale(locale), { numeric: 'always' })` with buckets: <1 min → "just now" (message key), <60 min → minutes, <24 h → hours, <7 d → days, <30 d → weeks, otherwise months. A future timestamp (clock skew) → "just now". This matches the Figma copy ("منذ 3 ساعة", "منذ 1 يوم") with pinned Latin digits.

## R10. Identity: first name and initial

**Decision**: `firstName(name)` = the first whitespace-separated token of `user.name.trim()`, or `null`. The greeting in the header uses `getStudentDisplayName` (full name, falling back to email and then "Student"). The welcome card uses `firstName`; when it is `null`, the copy is "Welcome back 👋". The avatar uses `getStudentInitial(displayName)` (one character, the same as the sidebar and chip). Recorded as an intentional deviation from the two-letter Figma avatar.

## R11. Route, nav activation and post-login (Q2: A)

**Decision**: `src/app/[locale]/student/page.tsx`. `isStudentNavigationItemActive` uses a prefix match (`href + '/'`), so `/student` would match every student page. The `home` item therefore gets **exact** matching: a per-item `match: 'exact'` field (default `'prefix'`), which keeps exactly one active item per route (an invariant in PROJECT_CONTEXT). `getStudentPageKey('/student')` → `'home'`. `post-login-path.ts` (auth) is **not** touched, so students still land on `/student/profile` (follow-up).

## R12. Release flag (Q3: A)

**Decision**: `featureFlags.studentHomeEnabled` → `process.env.STUDENT_HOME_ENABLED === 'true'`, with the same tests as 006/007 (default off, only the literal `"true"`, no `NEXT_PUBLIC_`). `page.tsx` calls `notFound()` before rendering when it is off; `layout.tsx` passes `homeEnabled` to the shell to hide the nav item.

## R13. Header controls (Q4: hide both)

**Decision**: there is no theme toggle and no disabled placeholder. `StudentShell` gets an optional `headerActions?: ReactNode`, and `StudentHeader` renders it before the language button in the desktop control group when it is not empty. `app/[locale]/student/layout.tsx` passes `<HomeNotificationBell mockSections={…} />`. The bell uses the notifications source: with `unavailable` it renders `null` and the header is identical to today's; with a source it renders a 32px bell with a dot when `unreadCount > 0`, sharing the query (and cache key) with the stat card, so both show the same number (this resolves the Figma 10-vs-2 inconsistency by construction). It is a plain button with an accessible name and the count, since no notifications page exists yet.

## R14. Recommendations unlocked (Q1: A)

**Decision**: `useQuery({ queryKey: studentScholarshipKeys.discovery(NEWEST_DEFAULT_QUERY), queryFn: getScholarships })` with the Discovery page's default query (`sort: 'newest'`, page 1, no filters), which shares the cache. Home takes `items.slice(0, 3)`, maps them with the existing `toScholarshipCard` adapter and renders `ScholarshipGridCard` (bookmark slot reused via `ScholarshipBookmark`, `detailsEnabled` from the server flag). The heading switches to "Latest scholarships" in the unlocked state. The query runs **only** when unlocked (`enabled: unlocked`).

## R15. Tracking-type consolidation

The Tracking feature is not on `main`, so a minimal local schema is used. Follow-up after Tracking merges: replace `home/schemas/tracked-application.schema.ts` with the Tracking feature's schema/type and its query key, so Home and Tracking share one cache entry. Recorded in verification.md.

## R16. Pre-existing test baseline (before any change)

Run on `feat/009-student-home` at `a069268` (spec docs only; same code as `main` `18c1453`), Node 24.22.1:

| File                                     | Result   | Failing tests (not fixed here)                                                                                                                                    |
| ---------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `google-auth.test.mjs`                   | 0/1      | Whole file: `Cannot find module src/lib/auth-storage.ts` (module removed by the first-party-cookie auth work)                                                     |
| `profile-personal-information.test.mjs`  | 1/8      | 7 tests fail with ZodError/assertion: live null fields, gender/financial enums, calling code + phone, completion rule, normalization, blank optionals, round-trip |
| `student-scholarship-discovery.test.mjs` | 91/92    | "the image fallback is a local asset and the img exception exists exactly once"                                                                                   |
| All other 17 files                       | all pass | none                                                                                                                                                              |

`tsc --noEmit`: 0 errors. `eslint`: 0 errors, 3 warnings.
