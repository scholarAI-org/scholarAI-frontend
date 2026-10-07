# Implementation Plan: Student Saved Scholarships (Feature 006)

**Branch**: `006-student-saved-scholarships` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

**Input**: [specs/006-student-saved-scholarships/spec.md](./spec.md), [contract-notes.md](./contract-notes.md), [checklists/requirements.md](./checklists/requirements.md)

**Mode**: Frontend-first / contract-first. Frontend is implemented against the approved TARGET contract for `GET /api/scholarships/saved`; live backend integration acceptance remains separately gated.

## Summary

Deliver an authenticated Saved Scholarships page at `/[locale]/student/saved` (sibling of `/student/scholarships`, not nested under it, so the 005 nav active-match rule for `/student/scholarships/*` does not highlight two items) that reuses Feature 005's Student Shell, card primitives, bookmark system and query architecture. The saved query resolves to `ScholarshipDiscoveryCard[]` through the shared `toScholarshipCard` normalization. Optimistic unsave extends the existing `bookmark-cache` to remove/restore saved-array membership while keeping discovery and affected details flags coherent. The route, its nav item ("المحفوظات" / "Saved") and its data fetch all sit behind one server-only feature flag (OFF by default) that flips ON only after live backend contract acceptance passes.

## Pre-flight — 005 artifacts present on this branch

| 005 artifact                                                    | Path                                                                                                                                                                                                                                                                                                                                                              | Present   |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `ScholarshipGridCard`                                           | [src/features/student/scholarship-discovery/components/ScholarshipGridCard.tsx](../../src/features/student/scholarship-discovery/components/ScholarshipGridCard.tsx)                                                                                                                                                                                              | yes       |
| `ScholarshipCardParts` (image/deadline/multi-level label parts) | [src/features/student/scholarship-discovery/components/ScholarshipCardParts.tsx](../../src/features/student/scholarship-discovery/components/ScholarshipCardParts.tsx)                                                                                                                                                                                            | yes       |
| `toScholarshipCard`                                             | [src/features/student/scholarship-discovery/adapters/scholarship.ts](../../src/features/student/scholarship-discovery/adapters/scholarship.ts)                                                                                                                                                                                                                    | yes       |
| `ScholarshipBookmark`                                           | [src/features/student/scholarship-discovery/components/ScholarshipBookmark.tsx](../../src/features/student/scholarship-discovery/components/ScholarshipBookmark.tsx)                                                                                                                                                                                              | yes       |
| Bookmark mutation hook with `savedLists()` invalidation         | [src/features/student/scholarship-discovery/hooks/useScholarshipBookmark.ts](../../src/features/student/scholarship-discovery/hooks/useScholarshipBookmark.ts) + [lib/bookmark-cache.ts](../../src/features/student/scholarship-discovery/lib/bookmark-cache.ts) (confirmed `invalidateQueries({ queryKey: studentScholarshipKeys.savedLists() })` on settlement) | yes       |
| `studentScholarshipKeys.saved()` / `savedLists()`               | [src/features/student/scholarship-discovery/query-keys.ts](../../src/features/student/scholarship-discovery/query-keys.ts) (`saved()` already comments the endpoint is unpaged)                                                                                                                                                                                   | yes       |
| Details route `/[locale]/student/scholarships/[id]`             | [src/app/[locale]/student/scholarships/[id]/page.tsx](../../src/app/%5Blocale%5D/student/scholarships/%5Bid%5D/page.tsx)                                                                                                                                                                                                                                          | yes       |
| Student Shell nav config                                        | [src/features/student/layout/student-navigation.ts](../../src/features/student/layout/student-navigation.ts) (array with `enabled` + `group` + `labelKey`)                                                                                                                                                                                                        | yes       |
| Spec Kit resolution                                             | `.specify/scripts/bash/check-prerequisites.sh --json` resolves `FEATURE_DIR = specs/006-student-saved-scholarships`, `BRANCH = 006-student-saved-scholarships`                                                                                                                                                                                                    | confirmed |

No 006 application code exists yet; `src/` has no `saved` route, no `nav.saved` entry, and no feature flag.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Next.js 15 App Router.
**Primary Dependencies**: `next-intl` (ar/en, RTL/LTR), `@tanstack/react-query` v5, Tailwind CSS, existing `apiClient` through the same-origin `/backend` proxy.
**Storage**: None (in-memory React Query cache only).
**Testing**: `node --test` with the project's existing React/next-intl test harness; the suite file for this feature is `tests/student-saved-scholarships.test.mjs`.
**Target Platform**: Browsers (desktop/tablet/mobile) and the Vercel + Render deployment chain, same as 005.
**Project Type**: Next.js App Router web application (single project; same tree as 005).
**Performance Goals**: Interaction parity with 005 (first-paint + optimistic bookmark feedback). No animations or heavy rendering added here.
**Constraints**: No per-item details fetch, no browser pagination state, no second mutation system, no production fallback data. Response-validation boundary must be synchronous and pure.
**Scale/Scope**: One route, one nav item, one new query, bounded extension to `bookmark-cache.ts`, bilingual translations in `src/messages/{ar,en}.json`, and a single automated test file.

## Constitution Check — gates

Evaluated against [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md):

| Principle                                                    | Evaluation                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Figma Informs, Application Architecture Leads**         | Pass. Figma nodes `2297:3126` (populated) and `2358:7754` (empty) are visual references only; semantic React + flex/grid; no verbatim generated code; no fabricated match badges.                                                                                                                                                              |
| **II. Reuse the Established Application System**             | Pass. All card primitives, bookmark machinery, query keys and shell nav are reused. Shell stays generic — the saved page composes it. The empty-state illustration uses the exact exported Figma asset (saved under `public/images/student-scholarships/`) or a project-native shape if no exact source asset exists; no invented replacement. |
| **III. Preserve the Platform Contract**                      | Pass. App Router Server Component owns `notFound()` for the OFF flag; AuthProvider / RoleGuard already own student protection via the shared `/[locale]/student/layout.tsx`. No duplicate auth state. `apiClient` + `/backend` proxy, React Query, feature-layer patterns reused.                                                              |
| **IV. Internationalization and Bidirectionality by Default** | Pass. All visible/aria copy routed through `src/messages/{ar,en}.json` under a new `StudentSavedScholarships` namespace; RTL/LTR exercised in the test plan and manual verification.                                                                                                                                                           |
| **V. Quality Is Part of Visual Fidelity**                    | Pass. Semantic HTML, accessible names/announcements, visible focus, responsive 3/2/1 columns, strict TS types; no duplicated business logic.                                                                                                                                                                                                   |

**Result**: no violations; Complexity Tracking section stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/006-student-saved-scholarships/
├── spec.md                     # Behavior + requirements (incl. FR-023 release gating)
├── contract-notes.md           # Verified contract, target boundary, frontend-first decision
├── plan.md                     # This file
├── checklists/
│   └── requirements.md         # Spec Quality Checklist
└── tasks.md                    # Phase 3 output — produced by /speckit-tasks (committed)
```

Research/data-model/contracts/quickstart artifacts are intentionally not generated as separate files: this feature is a bounded frontend reuse of a prior feature already recorded in `contract-notes.md` and the Feature 005 verification; folding their contents back out would duplicate what the spec and contract notes already distinguish.

### Source Code (repository root)

New files:

```text
src/
├── app/
│   └── [locale]/
│       └── student/
│           └── saved/
│               └── page.tsx                          # Server Component: flag gate + notFound() when OFF
│                                                     # Route is /student/saved (sibling of /student/scholarships)
├── features/
│   └── student/
│       └── saved-scholarships/                       # New bounded sub-feature; depends on 005
│           ├── api/
│           │   └── saved-scholarships.ts             # getSavedScholarships(signal) → ScholarshipDiscoveryCard[]
│           ├── components/
│           │   ├── SavedScholarshipsPage.tsx         # Client composition: header, count, grid, empty, states
│           │   ├── SavedScholarshipsHeader.tsx       # Localized title + plural-aware count from array length
│           │   ├── SavedScholarshipsEmpty.tsx        # 2358:7754 — illustration, heading, copy, Explore CTA
│           │   └── SavedScholarshipsErrorState.tsx   # Localized retryable error (incl. contract error)
│           ├── hooks/
│           │   └── useSavedScholarshipsQuery.ts      # React Query over studentScholarshipKeys.saved()
│           ├── lib/
│           │   ├── validateSavedResponse.ts          # Pure validator: target contract or SavedContractError
│           │   └── savedCache.ts                     # Bounded extensions used by bookmark-cache for saved[]
│           └── index.ts                              # Public exports for the page + hook
├── features/student/scholarship-discovery/
│   ├── hooks/useScholarshipBookmark.ts               # no change — reused as-is
│   └── lib/bookmark-cache.ts                         # EXTEND: cancel/snapshot/mutate/rollback saved() entries
├── app/[locale]/student/layout.tsx                   # EXTEND: receive savedEnabled prop (reads flag server-only)
├── features/student/layout/
│   ├── StudentShell.tsx                              # EXTEND: receive savedEnabled prop; applies withSavedEnabled
│   ├── StudentSidebar.tsx                            # EXTEND: receive savedEnabled prop (via items list); icon map adds saved
│   ├── StudentMobileNavigation.tsx                   # EXTEND: receive savedEnabled prop (via items list)
│   ├── student-navigation.ts                         # EXTEND: optional 'saved' item under 'discover', behind flag
│   └── types.ts                                      # EXTEND: 'saved' added to StudentNavigationItemId + StudentPageKey
├── lib/
│   └── feature-flags.ts                              # NEW: server-only flag constants incl. savedScholarshipsEnabled
├── messages/
│   ├── ar.json                                       # EXTEND: StudentSavedScholarships + nav.saved
│   └── en.json                                       # EXTEND: StudentSavedScholarships + nav.saved
└── public/
    └── images/
        └── student-scholarships/
            └── saved-empty.svg                       # NEW: exact 2358:7754 export, local asset only

tests/
└── student-saved-scholarships.test.mjs               # NEW: single suite file for this feature

tests/fixtures/
└── saved-scholarships/                               # NEW: TEST-ONLY target-contract fixtures
    ├── populated.json
    ├── empty.json
    ├── one-item.json
    ├── nullable-fields.json
    └── malformed.json

scripts/
├── dev-mock-backend.mjs                              # NEW: dev-only Node HTTP mock backend (saved + discovery + save/unsave + details)
└── dev-mock-backend.README.md                        # NEW: how to run; scenarios; BACKEND_URL + SAVED_SCHOLARSHIPS_ENABLED wiring
```

Both `tests/` and `scripts/` are covered by the production-import guard (see Fixtures section); `src/` must never import from either.

**Structure Decision**: Single Next.js App Router project. The feature lives beside 005 under `src/features/student/`, as a sibling sub-feature (`saved-scholarships/`) rather than inside `scholarship-discovery/`, so the two features stay separable while the new sub-feature imports (never re-exports) 005's shared primitives.

## Release gating (FR-023)

- **Flag module**: [src/lib/feature-flags.ts](../../src/lib/feature-flags.ts) exports a frozen record of named flags. `savedScholarshipsEnabled` is read from **`process.env.SAVED_SCHOLARSHIPS_ENABLED`** (server-only — **not** `NEXT_PUBLIC_`), returning `true` only when the value equals the literal string `"true"`; any other value or an unset variable returns `false`. Because the var is server-only, it is never inlined into the client bundle and cannot be toggled from the browser.
- **Shell plumbing**: the student layout — [src/app/[locale]/student/layout.tsx](../../src/app/%5Blocale%5D/student/layout.tsx), already a Server Component owning `RoleGuard` and the single `StudentShell` mount — reads the flag server-side and passes it to `StudentShell` as a prop (e.g. `savedEnabled: boolean`). `StudentShell` propagates it to `StudentSidebar` and `StudentMobileNavigation`, which drive the saved nav item's `enabled` field. The flag never crosses into pure navigation data by itself — it enters through the layout only.
- **Flip semantics**: ON only when `SAVED_SCHOLARSHIPS_ENABLED=true` is set in the environment (local `.env.local` or deploy env). Not toggleable through cookies, query params, `NEXT_PUBLIC_` client code, or runtime browser flags. Local dev and `node --test` set the variable explicitly.
- **Route gate**: [src/app/[locale]/student/saved/page.tsx](../../src/app/%5Blocale%5D/student/saved/page.tsx) (Server Component) checks the flag first and calls `notFound()` before any `apiClient` call. No data fetch, no shell mount of a saved-specific pane, no 404 roundtrip through the client.
- **Env docs**: `.env.example` documents `SAVED_SCHOLARSHIPS_ENABLED` with a leading comment stating it defaults to off (unset) and must be flipped only after live backend contract acceptance (gate 2).
- **Guard tests** (in `tests/student-saved-scholarships.test.mjs`):
  1. **Default stays false**: with `SAVED_SCHOLARSHIPS_ENABLED` unset, `featureFlags.savedScholarshipsEnabled === false`. With it set to `"false"`, `"1"`, `"yes"`, `"TRUE"`, `""`, or any other non-`"true"` value, the flag remains `false`. Only the literal `"true"` turns it on.
  2. **No `NEXT_PUBLIC_` leak**: static scan of `src/lib/feature-flags.ts` and `.env.example` fails if the saved-scholarships variable name is prefixed with `NEXT_PUBLIC_` or if a hard-coded `|| true` / default-`true` pattern is present.
  3. **Nav emits nothing with flag OFF**: `getVisibleStudentNavigation([...studentNavigation, { id: 'saved', ..., enabled: false }])` yields no `saved` entry in either locale; the saved Server Component's gate predicate returns the `notFound` sentinel.
  4. **Nav + route with flag ON**: the item appears in ar ("المحفوظات") and en ("Saved") under the `discover` group; the gate predicate passes.
- **Single-active-nav guarantee**: a dedicated test (see Test plan) asserts that for each of `profile`, `scholarships`, `scholarships/[id]`, and `saved`, exactly one nav item in `studentNavigation` reports `isStudentNavigationItemActive === true`. The chosen route split (`/student/saved` as a sibling of `/student/scholarships`) is what makes this true; a nested `/student/scholarships/saved` would double-activate under the current `pathname.startsWith(item.href + '/')` rule.

## Data flow

```
            (feature flag OFF)
Student navigates to /[locale]/student/saved
    │
    ▼
app/[locale]/student/saved/page.tsx                (Server Component)
    │
    ├──  savedScholarshipsEnabled === false  ──▶  notFound()
    │
    └──  savedScholarshipsEnabled === true
         │
         ▼
         SavedScholarshipsPage           (Client Component, inside existing StudentShell)
             │
             ▼
         useSavedScholarshipsQuery       (@tanstack/react-query)
             │
             │  queryKey   = studentScholarshipKeys.saved()
             │  queryFn    = getSavedScholarships(signal)
             │
             ▼
         api/saved-scholarships.ts
             │
             │  apiClient.get('/api/scholarships/saved', { signal })  →  /backend proxy  →  BACKEND_URL
             ▼
         validateSavedResponse(raw)       (pure, synchronous)
             │
             ├──  { ok: true, cards: ScholarshipDiscoveryCard[] }
             │        │
             │        ▼
             │    QueryCache stores ScholarshipDiscoveryCard[] under studentScholarshipKeys.saved()
             │        │
             │        ▼
             │    SavedScholarshipsPage renders:
             │        - header count   = cards.length
             │        - cards.length === 0 → SavedScholarshipsEmpty (2358:7754)
             │        - cards.length  > 0 → <ScholarshipGridCard /> per item (3/2/1 columns)
             │
             └──  { ok: false, error: SavedContractError }
                      │
                      ▼
                  Query reports error (NOT empty).
                  SavedScholarshipsErrorState shows localized retryable copy
                  with keyboard-accessible Retry (no backend-contract wording).
```

### Optimistic unsave

Reuses `useScholarshipBookmark` and the shared `bookmarkMutationKey(id)` pending guard. The existing `bookmark-cache.ts` already cancels discovery/detail queries and rolls back the single scholarship's `is_saved`. For Feature 006 the same module is extended with a `savedCache` helper that:

1. **Snapshot** — capture the current `ScholarshipDiscoveryCard[]` under `studentScholarshipKeys.saved()`, including the exact position of the item being removed.
2. **Cancel** — `client.cancelQueries({ queryKey: studentScholarshipKeys.savedLists() })` added to the existing cancel bundle so stale successful fetches cannot overwrite the optimistic state.
3. **Mutate** — remove only the matching item by id; count derives from `.length`.
4. **Rollback on failure** — reinsert the exact item at its original relative position among surviving items (so concurrent independent successful removals are preserved). The restored card's `is_saved` returns to `true`; the discovery/detail flag rollback already handled by the existing code remains unchanged.
5. **Settle** — invalidate `studentScholarshipKeys.savedLists()` (already present), the discovery family (already present), and `detail(id)` (already present). **Never** invalidate `studentScholarshipKeys.all`. The invalidation of `savedLists()` is targeted; it does not affect other families.
6. **Last-item transition** — when `cards.length` drops to 0, `SavedScholarshipsPage` renders the empty state. Failure restores the card and the one count. Mutation failure feedback uses a page-level live region so it survives the removed card's unmounting.

A save initiated elsewhere (discovery/details) **does not** optimistically insert into `studentScholarshipKeys.saved()`. Insertion requires authoritative backend data, which the save response does not supply as a discovery-card-shaped record; fabricating one would violate FR-006. Instead, settlement invalidates `savedLists()` (already present) and the saved query re-fetches through the authoritative backend path and reconciles. Only **unsave** on the saved page is optimistic (remove + exact-position rollback).

### Response validation boundary (FR-006 extended by this plan)

`validateSavedResponse(raw: unknown): { ok: true, cards: ScholarshipDiscoveryCard[] } | { ok: false, error: SavedContractError }`

- Rejects anything that is not an array (not an envelope, not a wrapper, not a `RecommendationScholarshipResponse[]`).
- Requires each item to satisfy `isDiscoveryCardShape` from the existing 005 validator — positive integer `id`, string `title`, boolean `is_saved` — plus `is_saved === true`.
- Returns `SavedContractError` (typed, non-user-visible reason enum: `not-array` / `empty-item-shape` / `missing-is-saved` / `is-saved-false`) which the query transforms into a localized retryable error state. **The error is never treated as empty.** Count stays unknown until a successful response arrives.
- The validator is pure (no cache or React dependencies) and lives in `features/student/saved-scholarships/lib/validateSavedResponse.ts` so it can be unit-tested in isolation.

### Fixtures — test/dev only

Fixtures live under `tests/fixtures/saved-scholarships/` and model the target contract. A dedicated static-analysis test fails the suite if any file in `src/` imports from `tests/`, from `scripts/`, or any `*fixture*` path:

```
production-import-guard: walk src/, parse each .ts/.tsx import,
  fail if specifier matches /^(?:\.\.\/)+(tests|scripts|fixtures)\b/
  or ends with .fixture or references a path containing /tests/ or /scripts/.
```

Fixtures are referenced from `tests/student-saved-scholarships.test.mjs` and from the local dev-mock backend script (below); they do not ship.

### Local dev-mock backend

- **Location**: [scripts/dev-mock-backend.mjs](../../scripts/dev-mock-backend.mjs) — plain Node HTTP server (no `src/` imports, no production app code imports). Lives outside `src/` and is covered by the production-import guard (`src/` must never import from `scripts/`).
- **What it serves (target contract)**:
  - `GET /api/scholarships/saved` → `ScholarshipDiscoveryCard[]` with `is_saved=true`, deterministic ordering, complete unpaged, response length = authoritative saved count.
  - `GET /api/scholarships/` (discovery) → paginated discovery with a dataset of **≥ 20 published scholarships**, so T043-style multi-page UI can be exercised locally.
  - `POST /api/scholarships/{id}/save` → mimics real save semantics.
  - `DELETE /api/scholarships/{id}/save` → removes membership; respects the active scenario (success, failure, 401/403/500).
  - `GET /api/scholarships/{id}` → details, matching discovery visibility.
- **Scenario switching**: an in-process scenario register (query param, header, or `SCENARIO=` env var at boot) selects between: `populated` (default), `empty`, `one-item`, `multi-item`, `unsave-failure`, `loading-slow`, `auth-401`, `forbidden-403`, `server-500`, `malformed`, `nullable-fields`. Fixtures under `tests/fixtures/saved-scholarships/` back the responses; the script loads them at startup.
- **How to run** (documented in `scripts/dev-mock-backend.README.md` next to the script):
  1. `node scripts/dev-mock-backend.mjs` (defaults to port 4100).
  2. In `.env.local` set `BACKEND_URL=http://127.0.0.1:4100` and `SAVED_SCHOLARSHIPS_ENABLED=true`.
  3. `pnpm dev`; sign in via the existing auth flow; the student shell shows the Saved nav item and the saved route is reachable.
- **Not shipped**: the dev-mock script, its README and the fixtures are ignored by Next's build (outside `src/` and `app/`); the production-import guard enforces that no code under `src/` references them.

### Figma node map

| View                               | Figma node (file `snMA3CewSOTzniE7qsGCaZ`) | Role in this plan                                                                                                                      |
| ---------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Saved populated — desktop          | `2297:3126`                                | Spacing, three ≈369 px cards with 24 px gaps, 236 px sidebar, header + count placement. Visual reference only; counts/content ignored. |
| Saved empty — desktop              | `2358:7754`                                | 200×200 illustration (group `2358:7956`), heading, explanatory copy, Explore CTA. Local asset export only; no runtime Figma URL.       |
| Discovery (reused)                 | `2262:3331`                                | Grid primitive and nav alignment baseline (same shell).                                                                                |
| Mobile nav / mobile shell (reused) | `3606:11257`, `3606:11255`                 | Nav item placement and mobile 1-column grid behavior.                                                                                  |
| Tablet (reused)                    | `3610:8118`                                | 2-column grid behavior.                                                                                                                |

Both saved-specific nodes have already been inspected (see spec and contract notes). Tablet/mobile for saved follow the Feature 005 adaptations as recorded in [contract-notes.md](./contract-notes.md).

## Test plan

Single new suite file: [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs).

### Flag + release gating

- Default-off: with `SAVED_SCHOLARSHIPS_ENABLED` unset, `featureFlags.savedScholarshipsEnabled === false`. Non-`"true"` values (`"false"`, `"1"`, `"yes"`, `"TRUE"`, `""`) all return `false`.
- Static-source guard: scan `src/lib/feature-flags.ts` and `.env.example` to fail if the variable name becomes `NEXT_PUBLIC_`-prefixed, or if any `|| true` / default-`true` pattern appears.
- With flag OFF: `getVisibleStudentNavigation` yields no `saved` item in ar or en; `getStudentPageKey('/student/saved')` returns `null`; the saved Server Component's gate predicate returns the `notFound` sentinel.
- With flag ON: nav item appears in ar ("المحفوظات") and en ("Saved") under the `discover` group; `getStudentPageKey('/student/saved')` returns `'saved'`; the gate predicate passes.

### Single-active-nav guarantee

For each of `/student/profile`, `/student/scholarships`, `/student/scholarships/123`, and `/student/saved`, exactly one entry in `studentNavigation` (with saved enabled) satisfies `isStudentNavigationItemActive`. Specifically:

- `/student/scholarships` activates only `scholarships` (never `saved`).
- `/student/scholarships/123` activates only `scholarships` (details path, nav continues to point back to discovery).
- `/student/saved` activates only `saved` (never `scholarships`).
- `/student/profile` activates only `profile`.

### Response validator (pure)

- Accepts: array of discovery-card-compatible items each with `is_saved === true` (populated / one-item / multi-item / nullable-field fixtures).
- Rejects: non-array; array with any item failing `isDiscoveryCardShape`; array with any item where `is_saved !== true`; empty-object envelope. Each rejection reports a distinct typed error reason.
- Fast-path: the empty array `[]` is `ok: true` with zero cards — confirmed empty, never a contract error.

### Query + cache behavior

- `getSavedScholarships` calls `apiClient.get('/api/scholarships/saved', { signal })` with no query parameters (no `page`, `page_size`, `skip`, `limit`).
- The query stores `ScholarshipDiscoveryCard[]` under `studentScholarshipKeys.saved()`.
- A validator error maps to the query's error state, NOT to an empty array in the cache.
- Save/unsave invalidation targets `savedLists()`, `discoveries()`, and `detail(id)` only; `studentScholarshipKeys.all` is never invalidated.

### Optimistic unsave + rollback

- Successful unsave removes the exact item; count decrements by one; discovery/detail `is_saved` becomes false coherently.
- Failed unsave restores the exact item at its original relative position among surviving items; prior `is_saved` flags are restored; concurrent independent successful removals remain applied.
- Last-item successful unsave: the empty state renders with zero count and the Explore CTA.
- Last-item failed unsave: the single card and one count return, and the failure feedback remains announced after temporary card unmounting.
- Overlapping removals: one succeeds, one fails — only the failed item returns.

### Rendering + states

- Loading: skeleton grid; count is unknown (never zero).
- Populated: 3/2/1 column grid at 1440 / 768 / 375 px; cards omit missing nullable fields per shared rules; no match badge/score anywhere.
- Confirmed empty: `2358:7754` composition in ar and en, Explore CTA keyboard-operable, zero count.
- Error (generic): localized retryable error with accessible Retry.
- Contract error from validator: same error state, no backend-contract leak in user copy, retry re-runs the query.
- 401: existing auth recheck pathway (no empty substitution).
- 403: localized access-unavailable copy, no automatic retry loops.

### i18n / RTL / LTR

- Namespace parity test extended to cover `StudentSavedScholarships` and `nav.saved` keys.
- Pluralization resolves for `savedCount` at zero/one/two/few/many/other.
- RTL layout audit: title, count, nav item, grid, and empty-state CTA are logical-ordered under ar.

### Reuse checks

- Static test: no file under `src/` imports from `tests/`, `scripts/`, or any `*fixture*` path. (Guard for both fixtures and the dev-mock backend.)
- Static test: `features/student/saved-scholarships/` does not re-export `ScholarshipDiscoveryCard` or redefine `toScholarshipCard`; it imports both from `scholarship-discovery/`.
- No new mutation hook is introduced; the saved page imports `useScholarshipBookmark` from the 005 module.

### Saving from discovery or details (reconciliation only, no optimistic insert into saved())

- Save success from discovery/details flips the local `is_saved` optimistically via the existing bookmark cache (unchanged), **does not** write into `studentScholarshipKeys.saved()`, and invalidates `savedLists()` on settlement. The saved query refetches through the authoritative backend path on next visit. A test asserts that during a save-from-discovery flow with a Saved page not currently mounted, the `saved()` cache entry is **not** populated by the optimistic path (only by the authoritative refetch).

### Figma convergence

Visual convergence pass is deferred to the implementation phase under T062-equivalent manual verification; the plan references the two saved nodes only.

## Completion semantics

`tasks.md` (produced by `/speckit-tasks`, not this command) MUST end with two separate gate sections:

1. **FRONTEND IMPLEMENTATION COMPLETE** — all tasks under flag=OFF default: route, nav gating, page composition, states, response validator, optimistic unsave, i18n/RTL, accessibility, responsive, Figma convergence, fixture-based tests, production-import guard, flag guard test. Completion of this gate does NOT flip the flag or claim backend acceptance.
2. **BACKEND INTEGRATION ACCEPTANCE** — flag flip + live run against the aligned backend contract: live `GET /api/scholarships/saved` returns a complete unpaged discovery-card-compatible array with `is_saved=true` and discovery-equivalent visibility, saved count equals array length against ≥20 real published items, optimistic unsave settles against the real `DELETE /api/scholarships/{id}/save`, and no contract-error path triggers.

The flag flip belongs only to gate 2. Any task that flips the flag by default or ships fixture data as production fallback MUST appear under gate 2 (or not at all).

## Decisions resolved (closes prior open questions)

1. **Figma empty-state asset** — a dedicated task will export `2358:7754` as `public/images/student-scholarships/saved-empty.svg`; the SVG is a committed local asset, not a runtime Figma URL.
2. **Nav label** — `nav.saved` → "المحفوظات" (ar) / "Saved" (en). Final.
3. **Discovery route** — stays `/[locale]/student/scholarships`. The Empty-state Explore CTA and any details back-link that returns to discovery both target that path. The saved route itself is the new sibling `/[locale]/student/saved`.

## Complexity Tracking

_No violations._ Constitution gates passed; no justification table required.
