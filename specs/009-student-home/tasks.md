---
description: 'Task list for 009 Student Home'
---

# Tasks: Student Home

**Input**: Design documents in `specs/009-student-home/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, verification.md)

**Prerequisites**: all open questions resolved (clarifications.md, 2026-10-24). Run commands as `corepack pnpm …` when `pnpm` is not on PATH.

**Tests**: REQUESTED. Test-first ordering applies in every phase: the test tasks come **before** the code they cover, and must be seen failing before the code is written. All Home tests live in one file, `tests/student-home.test.mjs`, in labelled sections (loader harness copied from `tests/student-saved-scholarships.test.mjs`).

**Commits**: one commit per phase, staging explicit paths only (never `git add -A`). Conventional Commits, scope `student-home`, ending with the attribution line from the session reminder. No push, no PR.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependency on an incomplete task)
- **[Story]**: US1 welcome and header · US2 counts and deadlines · US3 recommendations · US4 notifications and activity
- Paths are relative to the worktree root `scholarai-frontend-009/`. Home code lives in `src/features/student/home/` (shortened to `home/` below).

## Constraints that apply to every task

- Do not modify `src/features/auth/**`, `src/proxy.ts`, `src/lib/api-client.ts`, or any Tracking-feature file. Read-only imports are fine.
- No file under `src/features/student/layout/**` may import from `home/**` (plan, post-design re-check).
- `GET /api/scholarships/recommendations` must never be referenced under `src/` (guard test T008).
- Latin digits everywhere; logical CSS properties only (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `start-`, `end-`).
- Baseline failures that are **not** ours and must not be touched: `google-auth` (1), `profile-personal-information` (7), `student-scholarship-discovery` image-fallback (1).

---

## Phase 1: Setup

**Purpose**: test harness, scripts, env documentation. Commit: `chore(student-home): add test harness and env docs`.

- [ ] T001 Create `tests/student-home.test.mjs` with the TS/TSX loader harness (`ts.transpileModule`, `@/` alias resolver, `IntlMessageFormat`), shared helpers (`loadHome(relPath)`, `withEnv(vars, fn)` that restores `process.env`, `renderWithIntl(element, locale)` using `NextIntlClientProvider` + `renderToStaticMarkup` with `intlFormats` and the real `src/messages/{en,ar}.json`, a `QueryClientProvider` wrapper), and a placeholder passing test.
- [ ] T002 Add `"test:student-home": "node --test tests/student-home.test.mjs"` to `package.json` scripts, after `test:student-layout`.
- [ ] T003 [P] Document `STUDENT_HOME_ENABLED` (default OFF, only `"true"` enables, server-only, never `NEXT_PUBLIC_`) and `HOME_MOCK_SECTIONS` (default unset, comma-separated `notifications,activity,recommendations`, local development only, ignored in Production and Preview) in `.env.example`.
- [ ] T004 Run `corepack pnpm test:student-home` (placeholder passes) and commit the phase.

---

## Phase 2: Foundational (blocks every story)

**Purpose**: flag, constants, contracts (schemas), source adapters and the mock guard, pure derivations. Commit: `feat(student-home): add flag, contracts, sources and derivations`.

### Tests first (write all, run, confirm they fail)

- [ ] T005 [P] In `tests/student-home.test.mjs` section "flag": `featureFlags.studentHomeEnabled` is false when unset; false for `''`, `'false'`, `'0'`, `'1'`, `'TRUE'`, `' true '`; true only for `'true'`; static scan of `src/lib/feature-flags.ts`, `.env.example` and `src/` shows no `NEXT_PUBLIC_STUDENT_HOME` and no `|| true` fallback.
- [ ] T006 [P] Section "mock gate (FR-040)": `resolveHomeMockSections(env)` returns `[]` for `NODE_ENV='production'` with the flag set; for `VERCEL_ENV='production'`; for `VERCEL_ENV='preview'`; for unset, `''` and `'  '` flag values; it returns the known ids, trimmed, lower-cased and de-duplicated for `' Notifications , ACTIVITY ,activity'`; it drops unknown names (`'foo,activity'` → `['activity']`). `createHomeSources({ mockSections: ['notifications','activity','recommendations'] })` under `NODE_ENV='production'` yields no source with `kind === 'mock'`; under `NODE_ENV='development'` with an empty list yields all `unavailable`; with `HOME_API_AVAILABILITY[section]` forced true the kind is `real` even when the section is listed (real wins).
- [ ] T007 [P] Section "schemas": profile-completion schema accepts `{ profile_completion_percentage: 40 }`, defaults a missing field to 0, rejects `"80"` and `NaN`; the tracked schema accepts a full item, accepts extra fields, rejects an unknown `status`, and accepts a null `scholarship.deadline`; the notifications schema rejects negative or non-integer `unread_count`; the activity schema requires `days_left` for `deadline_reminder` and `new_status` for `application_status_changed`, requires `scholarship` for all four types, and an unknown `type` is skipped instead of failing the whole feed; `occurred_at` must be an ISO date-time with offset; the recommendations schema accepts `locked` + items with optional `match.score` 0–100 and rejects 101. Every payload exported by `home/mocks/**` parses with its schema (import the mocks directly in this test).
- [ ] T008 [P] Section "static guards": (a) only `home/sources/create-home-sources.ts` references `home/mocks` or `../mocks`, and only as `import(` ; (b) `home/config/resolve-mock-sections.ts` is imported only by files under `src/app/`; (c) **no file under `src/` contains the string `/api/scholarships/recommendations`**; (d) no file under `src/` imports `tests/`, `scripts/` or a `fixtures` path; (e) `src/features/student/layout/**` does not import from `features/student/home`; (f) mock payloads carry a unique marker `__HOME_MOCK__` that appears in no file outside `home/mocks/**`.
- [ ] T009 [P] Section "derivations": using `now = new Date(2026, 9, 24, 10, 0)` (local time) and helper factories for saved cards and tracked items:
  - `countInProgress`: counts `preparing_documents`, `ready_to_apply`, `applied` only; `[]` → 0.
  - `collectDeadlineCandidates`: de-duplicates by scholarship id with `origin: 'both'` and saved fields winning; excludes tracked `accepted`/`rejected`/`closed`; a terminal tracked item that is also saved stays through the saved side.
  - `deriveUpcomingDeadlines`: includes today (0), 1 and 30 days; excludes 31 days, yesterday, `no_deadline`, null and invalid dates (`'2026-02-30'`); normalizes `'2026-11-03T00:00:00Z'` to the date `2026-11-03`; sorts by days then id; `items` capped at 3 while `count` counts all; fewer than 3 gives no padding.
  - `urgencyFor`: 0 and 7 → `urgent`; 8 and 14 → `soon`; 15 and 30 → `comfortable`.
  - timezone: with `process.env.TZ` set to `Asia/Gaza` and then `UTC`, `now = new Date('2026-10-24T22:30:00Z')` gives different local days and the same deadline `'2026-10-25'` gets `daysLeft` 0 in Gaza (already the 25th) and 1 in UTC; restore `TZ` afterwards.
  - `msUntilNextLocalMidnight`: from 23:59:59 → 1000 ms; from 00:00:00 → 86 400 000 ms; across the 2026-10-25 DST change in `Asia/Gaza`, the result lands on the next local 00:00.
  - `formatRelativeTime`: 30 s → "just now" key; 5 min, 3 h, 1 day, 2 weeks, 3 months in `en` and `ar`; future timestamp → "just now"; `ar` output contains no Arabic-Indic digits.
  - `firstName`: `'Ahmad Hajjar'` → `'Ahmad'`; `'  أحمد   الحجار '` → `'أحمد'`; `''`, `'   '`, `null` → `null`.
  - `unlockState`: 69.6 → locked; 70 → unlocked; 100 → unlocked; `null`/unknown → locked; `toDisplayPercent(120)` → 100, `(-3)` → 0, `(41.6)` → 42.
  - `getSectionState`: all five states from query-status inputs per research R7; contract error → `error` (never `empty`).

### Implementation

- [ ] T010 Add `studentHomeEnabled` to `src/lib/feature-flags.ts` (`process.env.STUDENT_HOME_ENABLED === 'true'`, with the same comment style as the other flags). Makes T005 pass.
- [ ] T011 [P] Create `home/constants.ts` with the constants in data-model.md (`UPCOMING_WINDOW_DAYS = 30`, `URGENCY_URGENT_MAX = 7`, `URGENCY_SOON_MAX = 14`, `DEADLINE_LIST_LIMIT = 3`, `ACTIVITY_LIST_LIMIT = 4`, `RECOMMENDATIONS_UNLOCK_PERCENT = 70`, `RECOMMENDATIONS_LIST_LIMIT = 3`, `IN_PROGRESS_STATUSES`, `TERMINAL_TRACKING_STATUSES`) and `home/query-keys.ts` (`studentHomeKeys.{all, profileCompletion, tracked, notifications(kind), activity(kind), recommendations(kind)}` per data-model.md §Query keys).
- [ ] T012 [P] Create zod schemas in `home/schemas/`: `profile-completion.schema.ts` (`profile_completion_percentage: z.number().finite()` with a default of 0 when missing), `tracked-application.schema.ts` (fields and enum exactly as data-model.md, passthrough), `notifications.schema.ts` (`unread_count: int ≥ 0`), `activity.schema.ts` (type enum, per-type `data` refinements, unknown types filtered out by a preprocess step), `recommendations.schema.ts` (`locked: boolean`, items = discovery card + `match?: { score: int 0..100 } | null`). Export a `HomeContractError` class (section id + zod issues). Makes T007 pass for the schemas.
- [ ] T013 [P] Create real API clients in `home/api/`: `profile-completion.ts` (`GET /profile` via `apiClient`, 404 → 0, parse with the schema, throw `HomeContractError`), `tracked-applications.ts` (`GET /api/scholarships/tracked`), and `notifications.ts`, `activity.ts`, `recommendations.ts` (written now against `contracts/requested-backend.openapi.yaml`, unreachable until `HOME_API_AVAILABILITY` flips). Return validated data; never return raw payloads.
- [ ] T014 Create `home/config/home-sections.ts` (`HomeSectionId`, `HOME_SECTION_IDS`, `HOME_API_AVAILABILITY = { notifications: false, activity: false, recommendations: false }` with a comment pointing at contract-notes.md), `home/config/resolve-mock-sections.ts` (pure, takes an env-like object; `import 'server-only'` is **not** available as a dependency, so keep it plain and rely on T008(b)), and `home/sources/types.ts` (`HomeSource<T>` union per contracts/home-section-sources.md).
- [ ] T015 Create the mocks in `home/mocks/`: `notifications.mock.ts` (raw `{ unread_count: 10 }`, noting nothing about the Figma value), `activity.mock.ts` (four raw items covering all four types, with `occurred_at` computed relative to now), `recommendations.mock.ts` (three raw items with `match`), each containing the marker string `__HOME_MOCK__` in a const, plus `home/mocks/index.ts` exporting `mockAdapters` whose `load()` returns the raw payload **through the same schema parse** as the real client. Then create `home/sources/create-home-sources.ts` implementing the selection order from contracts/home-section-sources.md (`real` → `mock` only if `process.env.NODE_ENV !== 'production'` and listed → `unavailable`), loading mocks only through `import('../mocks')`. Makes T006 and T008 pass.
- [ ] T016 [P] Create `home/lib/`: `derive-home-summary.ts` (`countInProgress`, `collectDeadlineCandidates`, `deriveUpcomingDeadlines`), `urgency.ts` (`urgencyFor`), `identity.ts` (`firstName`), `today.ts` (`toLocalToday`, `msUntilNextLocalMidnight`, `formatTodayLabel(date, locale)` using `toFormattingLocale`), `relative-time.ts`, `unlock.ts` (`isRecommendationsUnlocked`, `toDisplayPercent`), `section-state.ts` (`getSectionState`, `retryFailed(queries)` that refetches only queries in error). Reuse `getDeadlineStatus`/`parseCalendarDate` from `scholarship-discovery/lib/deadlines.ts`. Makes T009 pass.
- [ ] T017 Run `corepack pnpm test:student-home`, `node node_modules/typescript/bin/tsc --noEmit` and `corepack pnpm lint` (0 errors); commit the phase.

**Checkpoint**: contracts, gate and derivations are green. No UI yet.

---

## Phase 3: User Story 1 — Personal overview (Priority: P1) 🎯 MVP

**Goal**: signed-in student sees a greeting with their real name, today's date, avatar initial and real profile completion, at `/student`, behind the flag.

**Independent Test**: flag on, open `/en/student` and `/ar/student` as a student: name, date, completion match the account; failing completion shows an error in that area only.

Commit: `feat(student-home): add welcome card and header greeting (us1)`.

### Tests first

- [ ] T018 [P] [US1] Section "US1 welcome": rendering `WelcomeCard` in `en` with name `'Ahmad Hajjar'`, completion 40 and a fixed `today` shows "Welcome back, Ahmad", the formatted date with Latin digits, one-letter avatar `A`, a `role="progressbar"` with `aria-valuenow="40"`, `aria-valuemin="0"`, `aria-valuemax="100"` and a fill width of 40%; in `ar` shows Arabic copy and a Latin-digit date; with an empty name shows "Welcome back 👋" without a stray comma; with `today = null` (before mount) shows a date skeleton and no date text; completion error renders a `role="alert"` with a Retry button while the greeting and date remain; completion 120 displays 100%.
- [ ] T019 [P] [US1] Section "US1 header + route": `getStudentPageKey('/student')` is `'home'` and `/student/profile` etc. are unchanged; `StudentHeader` renders `pages.home.title` with the full display name as the `{name}` argument ("Hello, Ahmad Hajjar") and the subtitle; titles for other pages are unchanged; a source-scan test asserts `src/app/[locale]/student/page.tsx` imports `featureFlags`, calls `notFound()` when `studentHomeEnabled` is false **before** rendering `StudentHomePage`, and is a Server Component (no `'use client'`).
- [ ] T020 [P] [US1] Section "US1 unauthorized": `useUnauthorizedRedirect` (tested as a pure helper `shouldInvalidateSession(queries)`) returns true when any query's error is an `ApiError` with status 401 and false for 403, 500 and non-`ApiError`s; a 401 section renders its loading skeleton, not an error message.
- [ ] T021 [P] [US1] Section "i18n parity (start)": `StudentHome` namespace and the new `StudentLayout.pages.home` keys exist with identical key sets in `en.json` and `ar.json`; every message in them is non-empty and valid ICU (reuse the approach in `tests/student-layout.test.mjs`).

### Implementation

- [ ] T022 [US1] Add `'home'` to `StudentPageKey` in `src/features/student/layout/types.ts` and to `getStudentPageKey` in `src/features/student/layout/student-navigation.ts` (exact `/student` match only), and make `StudentHeader.tsx` pass `{ name }` to `t(\`pages.${pageKey}.title\`)`(extra arguments are ignored by other titles). Update`tests/student-layout.test.mjs`"page titles resolve per route" to include`/student`.
- [ ] T023 [P] [US1] Add messages to `src/messages/en.json` and `src/messages/ar.json`: `StudentLayout.pages.home.{title: "Hello, {name}", titleNoName, description}` and a `StudentHome` namespace with `welcome.{title, titleNoName, today, completion, completionAria}`, `states.{retry, loading, errorTitle}`. Arabic copy follows the Figma ("أهلًا بعودتك", "نسبة اكتمال الملف", "اليوم: {date}").
- [ ] T024 [P] [US1] Create `home/hooks/useToday.ts` (null on server and first render, then local `Date`; reschedules with `msUntilNextLocalMidnight` and on `visibilitychange`), `home/hooks/useUnauthorizedRedirect.ts` (invalidates `currentUserQueryKey` once when `shouldInvalidateSession` is true), and `home/hooks/useHomeQueries.ts` with `useProfileCompletionQuery` (key `studentHomeKeys.profileCompletion()`, retry via `shouldRetryScholarshipQuery`).
- [ ] T025 [P] [US1] Create shared section pieces in `home/components/`: `HomeSectionCard.tsx` (semantic `<section aria-labelledby>` frame with heading and icon), `SectionSkeleton.tsx`, `SectionError.tsx` (`role="alert"`, message, Retry button, uses `AlertCircle` like `DiscoveryErrorState`), `SectionEmpty.tsx`.
- [ ] T026 [US1] Create `home/components/ProfileCompletionBar.tsx` and `home/components/WelcomeCard.tsx` per Figma `2353:5389` (avatar via `getStudentInitial`, "Welcome back, {firstName} 👋", clock icon + date, completion label + percentage + bar; logical properties only, `min-w-0`, no fixed widths). Reuse the profile `ProgressMeter` only if it matches visually; otherwise keep the new bar.
- [ ] T027 [US1] Create `home/components/StudentHomePage.tsx` (`'use client'`; reads `useAuth`, composes `WelcomeCard` and calls `useUnauthorizedRedirect`; later phases add sections), `home/index.ts` (exports `StudentHomePage`), and `src/app/[locale]/student/page.tsx` (Server Component: `notFound()` when `!featureFlags.studentHomeEnabled`, then renders `<StudentHomePage />`). Makes T018–T021 pass.
- [ ] T028 [US1] Run `test:student-home`, `test:student-layout`, `tsc`, `lint`; manually load `/en/student` and `/ar/student` against staging if credentials are available (otherwise record "not run" in verification.md); commit the phase.

**Checkpoint**: Home is a working, flag-gated page showing identity and real completion. **Report to the product owner here.**

---

## Phase 4: User Story 2 — Counts and upcoming deadlines (Priority: P1)

**Goal**: saved, in-progress and upcoming counts plus the three nearest deadlines, with urgency badges, all real data, each failing independently.

**Independent Test**: seed saved/tracked data per spec US2; counts, order and colors match; one failing source affects only its sections and retry refetches only that source.

Commit: `feat(student-home): add stat cards and upcoming deadlines (us2)`.

### Tests first

- [ ] T029 [P] [US2] Section "US2 stat row layout (FR-013)": `StatCards` with `unreadNotifications` absent renders exactly 3 cards in the order saved, in progress, upcoming, with the 3-column grid class and no empty element; with a notifications value renders 4 cards, notifications first, with the 4-column grid class; the grid class is chosen from a static map (no dynamic Tailwind class names); a card shows `0` (not a dash) for a zero count; counts of 100+ render in full; a card is a link only when `href` is provided (saved card gets `/student/saved` only when the saved page is enabled); each card has an accessible name combining label and value.
- [ ] T030 [P] [US2] Section "US2 deadlines render": `UpcomingDeadlines` with items at 2, 9 and 20 days renders 3 rows in order with badge classes red/amber/green, texts "2 days left"/"9 days left"/"20 days left" (en) and correct Arabic plural forms (`ar`: 1, 2, 3–10, 11+); 0 days renders "Due today" and the red class; the secondary line joins funding and level labels with " • ", omits a missing part, and is hidden when both are missing; long titles carry the `line-clamp-2` class and `min-w-0`; rows link to `/student/scholarships/{id}` only when details are enabled; the list is an `<ol>`; empty state shows "No deadlines in the next 30 days" with a link to `/student/scholarships`; loading shows 3 skeleton rows; fewer than 3 items renders no placeholder rows.
- [ ] T031 [P] [US2] Section "US2 independence": with `saved` failed and `tracked` ok, the section-state map gives saved card `error`, in-progress card `ready`, upcoming card `error`, deadlines `error`; with `tracked` failed it gives in-progress `error`, saved `ready`, upcoming `error`, deadlines `error`; a contract error is `error`, not `empty`/`0`; `retryFailed` calls `refetch` only on queries whose status is `error` (spy objects) and never on a healthy one; with both loading, all dependent cards show skeletons.

### Implementation

- [ ] T032 [P] [US2] Extend messages (en + ar) with `StudentHome.stats.{saved, inProgress, upcoming, notifications}`, `StudentHome.deadlines.{title, viewAll?, empty.{title, action}, daysLeft (ICU plural with every Arabic category, `{count, number, integer}`), dueToday, funding/level separator}`. No `#` in any message.
- [ ] T033 [US2] Extend `home/hooks/useHomeQueries.ts` with `useSavedQuery` (reuse `getSavedScholarships` and `studentScholarshipKeys.saved()`; same retry policy as `useSavedScholarshipsQuery` — or reuse that hook directly), `useTrackedQuery` (`studentHomeKeys.tracked()`), and `useHomeSummary(now)` returning `{ counts, deadlines, states }` built from the pure functions and `getSectionState`.
- [ ] T034 [P] [US2] Create `home/components/StatCard.tsx` and `home/components/StatCards.tsx` per Figma `2353:5411` (number, label, icon chip colors from the design; grid class map `{ 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' }` plus a base `grid-cols-1 sm:grid-cols-2`, so the row fills evenly; per-card skeleton and error-with-retry).
- [ ] T035 [P] [US2] Create `home/components/DeadlineBadge.tsx` (urgency → token classes: red `bg-red-50 text-red-600`, amber `bg-amber-50 text-amber-600`, green `bg-green-50 text-green-600`, matching the Figma pills), `DeadlineRow.tsx` and `UpcomingDeadlines.tsx` per Figma `2358:7663`, using `getFundingLabel`/`getStudyLevelLabel`/`formatCardFieldLabel` and `useCardTitle`-style locale title selection.
- [ ] T036 [US2] Update `StudentHomePage.tsx` to lay out the Figma grid (welcome row, stats row, then a two-column area: deadlines on the start side and the placeholder for the recommendations/activity column), passing `detailsEnabled` and `savedEnabled` from `page.tsx` (read server-side from `featureFlags`). Makes T029–T031 pass.
- [ ] T037 [US2] Run tests, `tsc`, `lint`; commit the phase.

**Checkpoint**: Home shows real counts and deadlines. **Report to the product owner here.**

---

## Phase 5: User Story 3 — Recommendations (Priority: P2)

**Goal**: locked panel below 70% (or unknown), "Latest scholarships" (3 newest published, existing card) at 70% or more.

**Independent Test**: at 10% the locked panel and CTA; at 70% three cards titled "Latest scholarships"; 69.6% stays locked.

Commit: `feat(student-home): add recommendations panel (us3)`.

### Tests first

- [ ] T038 [P] [US3] Section "US3 locked": `LatestRecommendations` with completion 10 renders the lock icon, "Smart recommendations are locked", the 70% text, and a "Complete profile" link to `/student/profile`; no "View all" link; completion unknown (`null`) and completion in error also render locked (never unlocked); an unlocked-only query is **not enabled** while locked (assert `isRecommendationsUnlocked` drives `enabled`).
- [ ] T039 [P] [US3] Section "US3 unlocked": completion 70 with 3 scholarship cards renders heading "Latest scholarships" (not "recommendations"), exactly 3 `ScholarshipGridCard`s, no match badge even if the card has `match`, a "View all" link to `/student/scholarships`; more than 3 results render 3; 0 results renders the empty state; discovery error renders `SectionError` with Retry that refetches only the discovery query; loading renders skeleton cards.
- [ ] T040 [P] [US3] Section "US3 data source": the Latest scholarships query uses `discoveryQueryOptions(defaultDiscoveryQuery)` (same key as `studentScholarshipKeys.discovery(defaultDiscoveryQuery)`), and the static guard from T008(c) still passes (no recommendations path).

### Implementation

- [ ] T041 [P] [US3] Extend messages (en + ar): `StudentHome.recommendations.{latestTitle: "Latest scholarships", viewAll, locked.{title, text: "…at least 70%…", cta}, empty.{title}}`.
- [ ] T042 [P] [US3] Create `home/components/RecommendationsLocked.tsx` per Figma `2354:6598` (icon chip, title, text, primary `Button`/`buttonStyles` link to `/student/profile`) and `home/components/LatestRecommendations.tsx` (heading + "View all" with a mirrored chevron via `rtl:rotate-180`, state switch locked/loading/error/empty/ready, `ScholarshipGridCard` + `ScholarshipBookmark` + `toScholarshipCard` + `ScholarshipDeadline`, 3 items; omit match badge).
- [ ] T043 [US3] Add `useLatestScholarshipsQuery(unlocked)` to `home/hooks/useHomeQueries.ts` (`useQuery({ ...discoveryQueryOptions(defaultDiscoveryQuery), enabled: unlocked, select: (r) => r.items.slice(0, 3) })`), and mount `LatestRecommendations` in `StudentHomePage.tsx` in the Figma position (end-side column). Makes T038–T040 pass.
- [ ] T044 [US3] Run tests, `tsc`, `lint`; commit the phase.

---

## Phase 6: User Story 4 — Notifications and activity (Priority: P3)

**Goal**: both sections render only with an active source (demo in local dev), labeled "Demo data"; otherwise hidden. The stat row handles 3 and 4 cards.

**Independent Test**: no flag → nothing from this story is visible; `HOME_MOCK_SECTIONS=notifications,activity` in dev → card, bell source, activity with badges; production build ignores the flag.

Commit: `feat(student-home): add notifications and activity sections with gated demo data (us4)`.

### Tests first

- [ ] T045 [P] [US4] Section "US4 hidden": with sources `unavailable`, `StudentHomePage`-level composition renders no notifications card, no "Recent activity" heading, no "Demo data" text, and no placeholder numbers; the stat row has exactly 3 cards.
- [ ] T046 [P] [US4] Section "US4 demo": with a `mock` notifications source the row has 4 cards (notifications first) and the card carries a "Demo data" badge; with a `mock` activity source the section renders 4 rows with a "Demo data" badge and nothing else on the page carries one; with `real` kind there is no badge.
- [ ] T047 [P] [US4] Section "US4 activity rows": each of the four types renders its icon, a localized sentence built from type and data (`new_recommendation`, `deadline_reminder` with `days` plural, `scholarship_saved`, `application_status_changed` with a translated status), the scholarship title in the active language, and a relative time with Latin digits; no server-provided sentence is displayed; empty list renders "No activity yet"; a contract error renders `SectionError`, never the empty state; rows are an `<ol>` newest first, capped at 4.
- [ ] T048 [P] [US4] Section "US4 source query": `useHomeSourceQuery` keys end with the source kind (a cached mock result can never serve `real`); an `unavailable` source never runs a query (`enabled: false`) and returns state `hidden`.

### Implementation

- [ ] T049 [P] [US4] Extend messages (en + ar): `StudentHome.stats.notifications`, `StudentHome.activity.{title, empty, relative.*, types.{new_recommendation, deadline_reminder, scholarship_saved, application_status_changed} (ICU plurals for days), status.{preparing_documents, ready_to_apply, applied, accepted, rejected, closed}}`, `StudentHome.demoBadge`.
- [ ] T050 [P] [US4] Create `home/components/DemoDataBadge.tsx`, `ActivityRow.tsx`, `RecentActivity.tsx` per Figma `2358:7688` (icon chips by type, `<ol>`, relative time via `formatRelativeTime`).
- [ ] T051 [US4] Create `home/hooks/useHomeSourceQuery.ts` (takes a `HomeSource<T>`, key from `studentHomeKeys.*(kind)`, `enabled: kind !== 'unavailable'`, `retry` per policy) and `home/hooks/useHomeSources.ts` (memoizes `createHomeSources({ mockSections })`). Pass `mockSections` from `src/app/[locale]/student/page.tsx` (server: `resolveHomeMockSections(process.env)`) into `StudentHomePage` as a prop.
- [ ] T052 [US4] Wire the notifications card into `StatCards` (fourth card, first in order, with `DemoDataBadge` when `kind === 'mock'`) and `RecentActivity` into `StudentHomePage.tsx` (below deadlines on the start side, as in Figma). Makes T045–T048 pass.
- [ ] T053 [US4] Run tests, `tsc`, `lint`; commit the phase.

---

## Phase 7: Shell — Home nav item, header slot and bell

**Purpose**: the sidebar Home item (flag-gated) and the optional bell. Commit: `feat(student-home): add Home navigation item and header bell`.

### Tests first

- [ ] T054 [P] Section "shell navigation": `studentNavigation` contains `home` (`/student`, group `discover`, first in the group); `home` is active only for `/student` exactly and **no** other student route activates it; every student route (`/student`, `/student/profile`, `/student/scholarships`, `/student/scholarships/12`, `/student/saved`) activates exactly one item; `withHomeEnabled(items, false)` removes Home from the visible items and from the sections; with `true` the Discover section lists Home first; the nav label `nav.home` exists in both locales.
- [ ] T055 [P] Section "shell header": `StudentHeader` rendered with no `headerActions` produces the same markup as before the change (compare against a snapshot taken from `main` before T057 and stored inline as a normalized string); with a `headerActions` node it renders it before the language button; **no theme toggle or disabled control** appears in either case (assert no `aria-disabled` button and no "theme" text in the header).
- [ ] T056 [P] Section "bell": `HomeNotificationBell` with an `unavailable` source renders nothing (`''`); with a `real`/`mock` source and `unreadCount 2` renders a button with an accessible name and a dot; with `0` renders no dot; the bell and the notifications stat card read the same query key (assert key equality), so the same number shows in both places.

### Implementation

- [ ] T057 Extend `src/features/student/layout/types.ts` (`StudentNavigationItemId` gains `'home'`; `StudentNavigationItem` gains optional `match?: 'prefix' | 'exact'`), `student-navigation.ts` (Home item first in `discover`, `enabled: false` by default, `match: 'exact'`; `withHomeEnabled`; `isStudentNavigationItemActive` honours `match`), `StudentShell.tsx` (props `homeEnabled?: boolean`, `headerActions?: ReactNode`; passes `headerActions` to `StudentHeader`) and `StudentHeader.tsx` (renders `headerActions` before the language button in the desktop group only when provided). Update `tests/student-layout.test.mjs` assertions that list the nav items. Add `StudentLayout.nav.home` in both locales.
- [ ] T058 [P] Create `home/components/HomeNotificationBell.tsx` (`'use client'`; uses `useHomeSources` + `useHomeSourceQuery`; renders `null` when `unavailable`; 32px circle button with the bell icon and an orange dot, `aria-label` from `StudentLayout`/`StudentHome` messages including the count).
- [ ] T059 Update `src/app/[locale]/student/layout.tsx` (Server Component): read `featureFlags.studentHomeEnabled` and pass `homeEnabled`; compute `mockSections` with `resolveHomeMockSections(process.env)` and pass `<HomeNotificationBell mockSections={mockSections} />` as `headerActions` (rendered inside `AuthProvider`/`QueryProvider` context). Makes T054–T056 pass.
- [ ] T060 Run `test:student-layout`, `test:student-home`, `tsc`, `lint`; verify the flag-off path (`/en/student` → 404, no Home item) and flag-on path locally; commit the phase.

---

## Phase 8: i18n and RTL

**Purpose**: prove parity, ICU correctness and direction safety across all Home copy and components. Commit: `test(student-home): add i18n parity and RTL guards`.

### Tests first

- [ ] T061 [P] Section "i18n full": `StudentHome` and every new `StudentLayout` key (`nav.home`, `pages.home.*`, bell label) have identical key sets in `en.json`/`ar.json`; every message is non-empty, valid ICU and formats in its locale; every plural message defines the categories its locale needs (`en`: `one`, `other`; `ar`: `zero`/`=0`, `one`, `two`, `few`, `many`, `other`) and renders the expected Arabic forms for 0, 1, 2, 3, 11, 100; no message uses `#`; every literal `t('…')` key used under `src/features/student/home/**` and the bell exists in `en.json`.
- [ ] T062 [P] Section "RTL/overflow static audit": no Home component or the bell contains physical-direction classes (`\b(ml|mr|pl|pr|left|right)-`, `text-left`, `text-right`, `rounded-(l|r)`, `border-(l|r)`, `float-(left|right)`); directional icons (chevrons/arrows) carry `rtl:rotate-180` or use logical icons; every flex child that holds user text has `min-w-0` or `truncate`/`line-clamp`; no fixed pixel widths above 360px on Home components (guard against horizontal scroll); the page root has no `w-screen`.
- [ ] T063 [P] Section "numerals": rendering the deadlines, stats, activity and welcome date in `ar` produces no characters in `[٠-٩۰-۹]`.

### Implementation

- [ ] T064 Fix every finding from T061–T063 (missing keys, plural categories, physical classes, missing `min-w-0`, `rtl:` mirrors).
- [ ] T065 Run the dev server and check `/ar/student` and `/en/student` at 1024, 1280 and 1440 px for horizontal scroll and mirroring using the available browser tooling; record the results (or "not run: no browser/credentials") in verification.md. Commit the phase.

---

## Phase 9: Verification

**Purpose**: full-suite proof against the baseline and the launch checklist. Commit: `docs(student-home): record verification results`.

- [ ] T066 Run every test file individually and compare with the baseline in verification.md: only the 9 known failures may remain; record per-file counts. Run `node node_modules/typescript/bin/tsc --noEmit` (0 errors), `corepack pnpm lint` (0 errors, ≤3 warnings), `corepack pnpm format:check` on touched files.
- [ ] T067 Run `corepack pnpm build`; grep `.next/static` for `__HOME_MOCK__` (must be absent in a production build) and confirm `/[locale]/student` appears in the route list; start the production server with `HOME_MOCK_SECTIONS=notifications,activity` and `STUDENT_HOME_ENABLED=true` and confirm via an unauthenticated request that the page is served (redirect to login for guests) and that no "Demo data" string is in the HTML.
- [ ] T068 Update `specs/009-student-home/verification.md` with measured results, the Gate 1 status, the launch checklist (including "turn on `STUDENT_HOME_ENABLED`"), the list of manual checks not run, and `specs/009-student-home/plan.md`/`data-model.md` corrections discovered during implementation (e.g. `defaultDiscoveryQuery` instead of `NEWEST_DEFAULT_QUERY`). Update `PROJECT_CONTEXT.md` features table with a 009 row. Commit the phase.

---

## Dependencies and Order

- Phase 1 → Phase 2 → everything else. Phase 2 blocks all stories.
- **US1** (Phase 3) needs Phase 2 only. **US2** (Phase 4) needs US1's page shell and shared section components (T025, T027). **US3** (Phase 5) needs US1 (completion query) and US2's page layout (T036). **US4** (Phase 6) needs US2's `StatCards` (T034) and the page layout. **Shell** (Phase 7) needs US4 (the bell uses the notifications source). Phase 8 needs all component phases. Phase 9 is last.
- Within a phase: tests (written and failing) → implementation tasks in the listed order. `[P]` tasks touch different files and can be done in any order within their group.

## Parallel Examples

- Phase 2 tests: T005, T006, T007, T008, T009 together; implementation T011, T012, T013, T016 together after T010.
- Phase 4: T029, T030, T031 together; T034 and T035 together after T033.
- Phase 7: T054, T055, T056 together.

## Implementation Strategy

- **MVP = Phase 1 + 2 + 3** (US1): a flag-gated page with identity and real completion. Each later phase is an independently verifiable increment and its own commit.
- Stop and report to the product owner after US1 and US2 (the two P1 stories), and at the end.
- Never enable demo data in any committed file; never push or open a PR without explicit approval.
