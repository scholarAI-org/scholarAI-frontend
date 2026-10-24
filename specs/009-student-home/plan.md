# Implementation Plan: Student Home

**Branch**: `feat/009-student-home` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-student-home/spec.md`

> **Status: PROVISIONAL. Waiting for product-owner review.** Five questions are open ([clarifications.md](./clarifications.md)). This plan is written against the **recommended option** for each one. The table in §Open Decisions lists what changes if a different option is chosen. `/speckit.tasks` must not run until the questions are answered and you say "approved".

## Summary

Add an authenticated, student-only Home page at `/student` that summarizes the student's situation: greeting, today's date, profile completion, four stat cards, the three nearest deadlines, recent activity and a recommendations panel that stays locked below 70% completion.

**Real data** (no mocks): name (existing current-user source), profile completion (`GET /profile`), saved count (`GET /api/scholarships/saved` via the Feature 006 data access), in-progress count and deadlines (`GET /api/scholarships/tracked` plus saved, derived on the client by pure, tested functions).

**No backend API yet**: unread notifications and recent activity (BE-09), personalized recommendations (BL-04). Each section reads from a per-section **source adapter** that is `real`, `mock` or `unavailable`. Today the real adapters are `unavailable`, so the section is hidden. A `mock` adapter is allowed only in local development when the section is listed in `HOME_MOCK_SECTIONS`. Mock payloads go through the same zod schemas as the future real responses. Connecting a backend later is a one-line availability switch per section.

## Open Decisions (provisional defaults)

| Q                                      | Provisional default (recommended)                                                                                                                                                                                                                                                                | If the product owner picks differently                                                                                                                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 Unlocked recommendations            | **A**: 3 newest published scholarships from the existing discovery list in `ScholarshipGridCard`, titled "Latest scholarships" with no match score.                                                                                                                                              | **B**: the unlocked state uses the `recommendations` source adapter (mock in dev, otherwise hidden). Drop the discovery query from Home and add a mock payload plus a schema test. **C**: replace the card grid with a static empty-state component; no data query. |
| Q2 Route and nav                       | **A**: `src/app/[locale]/student/page.tsx` at `/student`. Add a `home` nav item first in the `discover` group, active only on an exact `/student` match.                                                                                                                                         | **B**: move the page to `student/home/page.tsx` and change the nav href. Activation logic does not change. **C**: skip the nav item and the related layout-test update.                                                                                             |
| Q3 Release flag                        | **A**: `featureFlags.studentHomeEnabled` reads `STUDENT_HOME_ENABLED === 'true'`. The page calls `notFound()` when off, and the nav item is hidden when off.                                                                                                                                     | **B**: drop the flag, its tests and the `.env.example` entry. The nav item is always on.                                                                                                                                                                            |
| Q4 Bell and theme                      | **B**: a generic `headerActions` slot on `StudentShell`/`StudentHeader`. The student route layout fills it with `HomeNotificationBell` (from the home feature) (rendered only when the notifications source is not `unavailable`) and a disabled theme button. It appears on every student page. | **A**: no slot and no bell/theme components. **C**: Home renders the controls itself; the shell does not change. **D**: out of scope for this plan; it needs its own spec.                                                                                          |
| Q5 Terminal tracked items in deadlines | **A**: exclude tracked items with status `accepted`, `rejected` or `closed` from the deadline candidates.                                                                                                                                                                                        | **B**: delete the status filter in `collectDeadlineCandidates` and one test. **C**: also exclude `applied`, which changes one constant and one test.                                                                                                                |

Every alternative stays inside the same module boundaries, so no option needs a restructure.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.2, Next.js 16.2 App Router

**Primary Dependencies**: next-intl 4.13 (ar/en, RTL), @tanstack/react-query 5.101, zod 4.4 (already a dependency; used by auth/admin/profile), lucide-react (icons), Tailwind CSS v4 tokens in `src/app/globals.css`

**Storage**: none. Server state lives in the React Query cache; nothing is persisted on the client.

**Testing**: `node --test` on `.mjs` files with the repo's on-the-fly `ts.transpileModule` loader (same harness as `tests/student-saved-scholarships.test.mjs`). Rendering tests use `react-dom/server` `renderToStaticMarkup` with `NextIntlClientProvider`, as discovery, saved and details already do.

**Target Platform**: modern evergreen browsers, desktop ≥1024px (mobile is a later feature)

**Project Type**: web frontend (Next.js) behind the same-origin `/backend/*` proxy

**Performance Goals**: first meaningful content (greeting, skeletons) on first paint; all real sections settled in ≤3 s on a typical connection (SC-001). At most 4 parallel Home requests (`/profile`, `/saved`, `/tracked`, discovery page 1), and these share cache keys with the Saved and Discovery pages where they exist.

**Constraints**: do not modify auth (`src/features/auth/**` except read-only imports), `src/proxy.ts`, `src/lib/api-client.ts`, or any Tracking-feature file. Server-only flags (never `NEXT_PUBLIC_`). Latin digits in all locales. No horizontal scroll in ar/en.

**Scale/Scope**: 1 route, about 20 new files in one feature folder, 6 small edits in the shared student layout and nav, 2 message catalogs, 1 new test file.

## Constitution Check

_GATE: must pass before Phase 0. Re-checked after Phase 1._

| Principle                                                   | Check                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Status |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Figma informs, architecture leads                        | Sections map to semantic components (`section`/`h2`/`ol`/`progress`); flex/grid only. The stray "90%" ring and the placeholder names are not copied. Figma code is not pasted.                                                                                                                                                                                                                                                                              | ✅     |
| II. Reuse the established system                            | Reuses `StudentShell`/`StudentHeader`/`StudentSidebar`, `RoleGuard`, `useAuth`, `getStudentDisplayName`/`getStudentInitial`, `getSavedScholarships` + `studentScholarshipKeys.saved()`, `getDeadlineStatus`/`parseCalendarDate`, `getFundingLabel`/`getStudyLevelLabel`, `ScholarshipGridCard`, `Button`, existing icons and tokens. The shell gains only a **generic** `headerActions` slot and a `home` page key; no Home business data enters the shell. | ✅     |
| III. Platform contract                                      | Auth state comes only from `AuthProvider`/`useAuth`. 401 handling invalidates the existing `currentUserQueryKey` (read-only import), so `RoleGuard` redirects to login with `next`. No parallel session store. Admin routes are untouched.                                                                                                                                                                                                                  | ✅     |
| IV. i18n and bidi by default                                | All copy lives in a new `StudentHome` namespace plus a few `StudentLayout` keys, in ar and en. ICU plurals cover every Arabic category and use `{count, number, integer}`. Logical properties (`ms-`/`ps-`/`text-start`); the "View all" chevron mirrors. A parity test is added.                                                                                                                                                                           | ✅     |
| V. Quality is part of fidelity                              | The progress bar exposes `role="progressbar"` with values. Stat cards are links only when the destination exists. Errors use `role="alert"` with a retry button. Each section has a heading. Visible focus rings follow the existing pattern.                                                                                                                                                                                                               | ✅     |
| Delivery: document reusable vs page-specific concepts first | Done in research.md §R2 before any code.                                                                                                                                                                                                                                                                                                                                                                                                                    | ✅     |

**Result: PASS. No violations.** The Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/009-student-home/
├── spec.md               # /speckit.specify
├── clarifications.md     # /speckit.clarify (open questions Q1–Q5)
├── plan.md               # this file
├── research.md           # Phase 0
├── data-model.md         # Phase 1
├── contracts/
│   ├── README.md
│   ├── home-section-sources.md        # adapter interface every section uses
│   └── requested-backend.openapi.yaml # BE-09 / BL-04 request shapes
├── contract-notes.md     # consumed endpoints + backend asks (ClickUp BE-09, BL-04)
├── quickstart.md         # how to run and validate locally
├── verification.md       # gates, test matrix, pre-launch mock checklist, baseline
└── checklists/requirements.md
```

### Source Code (repository root)

```text
src/app/[locale]/student/
├── layout.tsx                         # EDIT: pass homeEnabled + headerActions (Q2/Q4)
└── page.tsx                           # NEW: Server Component; flag gate (Q3), resolves
                                       #      mock sections server-side, renders <StudentHomePage>

src/lib/feature-flags.ts               # EDIT: + studentHomeEnabled (Q3)

src/features/student/layout/           # shared shell; small generic edits only
├── types.ts                           # EDIT: + 'home' nav id and page key
├── student-navigation.ts              # EDIT: + home item; exact-match activation; page key
├── StudentShell.tsx                   # EDIT: + homeEnabled, headerActions props
├── StudentHeader.tsx                  # EDIT: title accepts {name}; renders headerActions
└── HeaderThemeToggle.tsx              # NEW (Q4-B): disabled, "unavailable" tooltip

src/features/student/home/
├── index.ts                           # public entry: StudentHomePage
├── query-keys.ts                      # studentHomeKeys (home-local keys)
├── constants.ts                       # window 30, thresholds 7/14, lock 70, limits 3/4
├── config/
│   ├── home-sections.ts               # HomeSectionId, HOME_API_AVAILABILITY (all false today)
│   └── resolve-mock-sections.ts       # SERVER-ONLY pure resolver (env → allowed mock ids)
├── schemas/                           # zod: one schema per contract (real == mock)
│   ├── profile-completion.schema.ts
│   ├── tracked-application.schema.ts  # minimal local type (Tracking types not on main)
│   ├── notifications.schema.ts        # BE-09 requested contract
│   ├── activity.schema.ts             # BE-09 requested contract
│   └── recommendations.schema.ts      # BL-04 requested contract
├── api/                               # real clients (apiClient + schema.parse)
│   ├── profile-completion.ts
│   ├── tracked-applications.ts
│   ├── notifications.ts               # written now, unreachable until availability=true
│   ├── activity.ts                    # idem
│   └── recommendations.ts             # idem
├── sources/
│   ├── types.ts                       # HomeSource<T> = real | mock | unavailable
│   └── create-home-sources.ts         # picks the adapter per section; dynamic-imports mocks
├── mocks/                             # ONLY place demo data lives
│   ├── index.ts                       # mock adapters (validated by the same schemas)
│   ├── notifications.mock.ts
│   ├── activity.mock.ts
│   └── recommendations.mock.ts
├── lib/                               # pure, unit-tested
│   ├── derive-home-summary.ts         # in-progress count, deadline candidates/window/top-3
│   ├── urgency.ts
│   ├── identity.ts                    # firstName(); reuses layout identity helpers
│   ├── today.ts                       # local calendar day + next-midnight delay
│   ├── relative-time.ts               # pinned-locale Intl.RelativeTimeFormat buckets
│   └── section-state.ts               # loading|error|empty|ready|hidden per section
├── hooks/
│   ├── useHomeQueries.ts              # profile, saved, tracked (+ latest scholarships, Q1-A)
│   ├── useHomeSourceQuery.ts          # notifications/activity/recommendations via adapters
│   ├── useToday.ts                    # client-only date, refresh on midnight and focus
│   └── useUnauthorizedRedirect.ts     # 401 → invalidate currentUserQueryKey
└── components/
    ├── StudentHomePage.tsx            # client; composes sections in the Figma grid
    ├── WelcomeCard.tsx                # greeting, date, avatar, ProfileCompletionBar
    ├── ProfileCompletionBar.tsx
    ├── StatCards.tsx / StatCard.tsx
    ├── UpcomingDeadlines.tsx / DeadlineRow.tsx / DeadlineBadge.tsx
    ├── RecentActivity.tsx / ActivityRow.tsx
    ├── LatestRecommendations.tsx / RecommendationsLocked.tsx
    ├── HomeSectionCard.tsx            # heading + icon + body frame shared by sections
    ├── SectionError.tsx / SectionEmpty.tsx / SectionSkeleton.tsx
    ├── DemoDataBadge.tsx
    └── HomeNotificationBell.tsx       # NEW (Q4-B): injected into the shell slot by layout.tsx;
                                       #      renders nothing while notifications are unavailable

src/messages/{ar,en}.json              # EDIT: + StudentHome namespace; StudentLayout.nav.home,
                                       #       pages.home, header.notifications, theme.unavailable
.env.example                           # EDIT: + STUDENT_HOME_ENABLED, HOME_MOCK_SECTIONS (documented)
package.json                           # EDIT: + "test:student-home" script
tests/student-home.test.mjs            # NEW
tests/student-layout.test.mjs          # EDIT: nav config assertion gains 'home' (Q2-A)
```

**Structure Decision**: one feature folder `src/features/student/home/`, following the sub-feature pattern of `saved-scholarships/` and `scholarship-details/`. Shared-shell edits are limited to a page key, one nav item, two props and two small header controls. That keeps the overlap with the parallel Tracking worktree to a few lines in `types.ts`, `student-navigation.ts`, `StudentShell.tsx`, `layout.tsx`, `feature-flags.ts`, `.env.example` and the message catalogs, all additive.

## Key Design Decisions (details in research.md)

1. **Server decides what may be mocked** (R5). `page.tsx` calls `resolveHomeMockSections(process.env)` and passes the resulting array to the client. The resolver returns `[]` unless all of these hold: `NODE_ENV !== 'production'`, `VERCEL_ENV` is not `production` or `preview`, and `HOME_MOCK_SECTIONS` is set. Only known ids survive. `create-home-sources.ts` re-checks `process.env.NODE_ENV` on the client, which Next inlines at build time so the mock branch is removed from production bundles, and loads `mocks/` only through `import()`. No other file may import `mocks/`, and a static-scan test enforces it.
2. **One schema per contract** (R6). zod schemas in `schemas/` are used by the real client (`schema.parse(await apiClient(...))`) and by a test that parses every mock payload. A shape mismatch throws `HomeContractError`, which renders as the section's error state and never as empty (FR-037).
3. **Derivations are pure functions over validated data** (R3). They take `now: Date` as a parameter, so window, urgency, today and timezone cases are unit-tested without mocking clocks. Deadline math reuses `getDeadlineStatus` from discovery, which works on local calendar days.
4. **Per-section independence** (R7). Each section reads only its own queries, and `section-state.ts` maps query states to `loading | error | empty | ready | hidden`. Retry calls `refetch()` only on the failed queries of that section; for example, a deadlines retry refetches `saved` and/or `tracked`, whichever failed.
5. **Cache sharing**. Saved uses `studentScholarshipKeys.saved()`, so the bookmark mutations of Features 005–007 keep Home fresh. Latest scholarships (Q1-A) use `studentScholarshipKeys.discovery(defaultNewestQuery)`, the same key as the Discovery page's default view. Profile completion and tracked use home-local keys (`studentHomeKeys.*`), and the plan records a consolidation step for when Tracking merges.
6. **Today's date is client-only** (R8). The server render shows a date skeleton to avoid hydration mismatches across timezones. `useToday` refreshes at the next local midnight and on `visibilitychange`.

## Risks

| Risk                                                                                         | Mitigation                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/scholarships/tracked` is in the OpenAPI doc but may not be deployed on staging yet | quickstart.md step 3 probes it first. If it returns 404, the in-progress card and deadlines show the error state (not 0), and Gate 2 waits.                                 |
| Merge conflicts with the Tracking worktree in the nav, shell, flags and messages             | All edits are additive and small. Rebase on `main` before review; the Tracking types replace `tracked-application.schema.ts` in a follow-up.                                |
| `profile_completion_percentage` scale (0–1 vs 0–100)                                         | The Profile page already shows it as a percentage. The schema range is 0–100, and values above 1 confirm the scale in Gate 2. A value outside 0–100 is clamped for display. |
| The demo flag leaking into deployments                                                       | Three layers: server resolver, client `NODE_ENV` branch, `import()` isolation. Plus tests and the pre-launch checklist in verification.md.                                  |
| Header controls (Q4-B) change every student page                                             | They are hidden or disabled by default, so the visual change on other pages is one disabled icon. A layout-test update covers it.                                           |

## Post-Design Constitution Re-check

Re-checked after research.md, data-model.md and the contracts were written. **Still PASS.** Two items to watch during implementation: (1) `StudentHeader` must keep rendering titles from `pages.{key}` and receive `name` only as an ICU argument, so no Home data enters the shell; (2) nothing under `features/student/layout/**` may import from `features/student/home/**`. The bell lives in the home feature and reaches the header only as a `ReactNode` that `app/[locale]/student/layout.tsx` passes to the generic `headerActions` slot.

## Phase 2 Preview (not generated)

`/speckit.tasks` will produce phases roughly as follows: Setup (flag, env docs, test file skeleton) → Foundational (schemas, sources, mock guard and its tests, derivations and their tests) → US1 welcome → US2 stats and deadlines → US3 recommendations lock → US4 notifications and activity (mock/hidden) → Shell (nav, header slot) → i18n and RTL audit → verification. This is blocked on "approved".
