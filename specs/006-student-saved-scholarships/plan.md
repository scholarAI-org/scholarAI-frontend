# Implementation Plan: Student Saved Scholarships (Feature 006)

**Branch**: `006-student-saved-scholarships` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

**Input**: [specs/006-student-saved-scholarships/spec.md](./spec.md), [contract-notes.md](./contract-notes.md), [checklists/requirements.md](./checklists/requirements.md)

**Mode**: Frontend-first / contract-first. Frontend is implemented against the approved TARGET contract for `GET /api/scholarships/saved`; live backend integration acceptance remains separately gated.

## Summary

Deliver an authenticated Saved Scholarships page at `/[locale]/student/scholarships/saved` that reuses Feature 005's Student Shell, card primitives, bookmark system and query architecture. The saved query resolves to `ScholarshipDiscoveryCard[]` through the shared `toScholarshipCard` normalization. Optimistic unsave extends the existing `bookmark-cache` to remove/restore saved-array membership while keeping discovery and affected details flags coherent. The route, its nav item ("المحفوظات" / "Saved") and its data fetch all sit behind one server-read feature flag (OFF by default) that flips ON only after live backend contract acceptance passes.

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
└── tasks.md                    # NOT created by /speckit-plan (produced later by /speckit-tasks)
```

Research/data-model/contracts/quickstart artifacts are intentionally not generated as separate files: this feature is a bounded frontend reuse of a prior feature already recorded in `contract-notes.md` and the Feature 005 verification; folding their contents back out would duplicate what the spec and contract notes already distinguish.

### Source Code (repository root)

New files:

```text
src/
├── app/
│   └── [locale]/
│       └── student/
│           └── scholarships/
│               └── saved/
│                   └── page.tsx                      # Server Component: flag gate + notFound() when OFF
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
│   ├── hooks/useScholarshipBookmark.ts               # EXTEND: integrate saved[] optimistic remove via savedCache
│   └── lib/bookmark-cache.ts                         # EXTEND: cancel/snapshot/mutate/rollback saved() entries
├── features/student/layout/
│   ├── student-navigation.ts                         # EXTEND: optional 'saved' item under 'discover', behind flag
│   └── types.ts                                      # EXTEND: 'saved' added to StudentNavigationItemId + StudentPageKey
├── lib/
│   └── feature-flags.ts                              # NEW: server-read flag constants incl. savedScholarshipsEnabled
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
```

**Structure Decision**: Single Next.js App Router project. The feature lives beside 005 under `src/features/student/`, as a sibling sub-feature (`saved-scholarships/`) rather than inside `scholarship-discovery/`, so the two features stay separable while the new sub-feature imports (never re-exports) 005's shared primitives.

## Release gating (FR-023)

- **Flag module**: [src/lib/feature-flags.ts](../../src/lib/feature-flags.ts) exports a frozen record of named flags. `savedScholarshipsEnabled` is read **synchronously** from `process.env.NEXT_PUBLIC_FLAG_SAVED_SCHOLARSHIPS` on the server at request time and from the same build-inlined value on the client. The committed default is `false`.
- **Flip semantics**: ON only when the env var is literally `"true"` at build/deploy time. Not toggleable through cookies, query params, or runtime client code. Local dev and `node --test` set the env var explicitly; CI sets it off except in the fixture-backed browser verification runs.
- **Route gate**: The `saved/page.tsx` Server Component checks the flag first and calls `notFound()` before any `apiClient` call. No data fetch, no shell mount of a saved-specific pane, no 404 roundtrip through the client.
- **Nav gate**: `student-navigation.ts` conditionally includes the `saved` item only when `savedScholarshipsEnabled` is true. `getVisibleStudentNavigation` already filters by `enabled`; the flag feeds `enabled` for this item alone and does not affect the others.
- **Guard tests** (in `tests/student-saved-scholarships.test.mjs`):
  1. Static-source assertion: scan `src/lib/feature-flags.ts` and `.env.example` to confirm `savedScholarshipsEnabled` has no `true` default in committed source and no hard-coded `|| true` fallback. The test fails if the pattern changes.
  2. Behavioral assertion with env override: with the flag OFF, `student-navigation.ts` emits no `saved` item in either locale and the saved Server Component's gate predicate returns a `notFound` sentinel.
  3. Behavioral assertion with env ON: both reverse — the item appears, and the gate predicate passes.

## Data flow

```
            (feature flag OFF)
Student navigates to /[locale]/student/scholarships/saved
    │
    ▼
app/[locale]/student/scholarships/saved/page.tsx   (Server Component)
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

A save initiated elsewhere (discovery/details) continues to invalidate `savedLists()` on settlement; the saved query re-fetches through the authoritative backend path and reconciles — never a fabricated optimistic insert.

### Response validation boundary (FR-006 extended by this plan)

`validateSavedResponse(raw: unknown): { ok: true, cards: ScholarshipDiscoveryCard[] } | { ok: false, error: SavedContractError }`

- Rejects anything that is not an array (not an envelope, not a wrapper, not a `RecommendationScholarshipResponse[]`).
- Requires each item to satisfy `isDiscoveryCardShape` from the existing 005 validator — positive integer `id`, string `title`, boolean `is_saved` — plus `is_saved === true`.
- Returns `SavedContractError` (typed, non-user-visible reason enum: `not-array` / `empty-item-shape` / `missing-is-saved` / `is-saved-false`) which the query transforms into a localized retryable error state. **The error is never treated as empty.** Count stays unknown until a successful response arrives.
- The validator is pure (no cache or React dependencies) and lives in `features/student/saved-scholarships/lib/validateSavedResponse.ts` so it can be unit-tested in isolation.

### Fixtures — test/dev only

Fixtures live under `tests/fixtures/saved-scholarships/` and model the target contract. A dedicated static-analysis test fails the suite if any file in `src/` imports from `tests/` or any `*fixture*` path:

```
production-import-guard: walk src/, parse each .ts/.tsx import,
  fail if specifier matches /^(?:\.\.\/)+(tests|fixtures)/ or ends with .fixture.
```

Fixtures are referenced from `tests/student-saved-scholarships.test.mjs` and (manually) from the ephemeral local-mock browser verification scaffolding; they do not ship.

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

- Default-off static-source guard (fails if committed source enables the flag by default).
- With flag OFF: `student-navigation.ts` yields no `saved` item in ar and en; `getStudentPageKey('/student/scholarships/saved')` returns `null`; the server gate predicate returns the `notFound` sentinel.
- With flag ON: nav item appears in ar ("المحفوظات") and en ("Saved") under the `discover` group; `getStudentPageKey('/student/scholarships/saved')` returns `'saved'`; `isStudentNavigationItemActive` matches only the saved item for `/student/scholarships/saved` and never for discovery.

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

- Static test: `tests/fixtures/` and any `*fixture*` paths are not imported from any file under `src/`.
- Static test: `features/student/saved-scholarships/` does not re-export `ScholarshipDiscoveryCard` or redefine `toScholarshipCard`; it imports both from `scholarship-discovery/`.
- No new mutation hook is introduced; the saved page imports `useScholarshipBookmark` from the 005 module.

### Figma convergence

Visual convergence pass is deferred to the implementation phase under T062-equivalent manual verification; the plan references the two saved nodes only.

## Completion semantics

`tasks.md` (produced by `/speckit-tasks`, not this command) MUST end with two separate gate sections:

1. **FRONTEND IMPLEMENTATION COMPLETE** — all tasks under flag=OFF default: route, nav gating, page composition, states, response validator, optimistic unsave, i18n/RTL, accessibility, responsive, Figma convergence, fixture-based tests, production-import guard, flag guard test. Completion of this gate does NOT flip the flag or claim backend acceptance.
2. **BACKEND INTEGRATION ACCEPTANCE** — flag flip + live run against the aligned backend contract: live `GET /api/scholarships/saved` returns a complete unpaged discovery-card-compatible array with `is_saved=true` and discovery-equivalent visibility, saved count equals array length against ≥20 real published items, optimistic unsave settles against the real `DELETE /api/scholarships/{id}/save`, and no contract-error path triggers.

The flag flip belongs only to gate 2. Any task that flips the flag by default or ships fixture data as production fallback MUST appear under gate 2 (or not at all).

## Open questions

1. **Figma empty-state asset** — the SVG at node `2358:7754` has not yet been exported to `public/images/student-scholarships/saved-empty.svg`. The plan treats this as an implementation-phase action, consistent with contract-notes.md's "Inspect/export exact source assets during implementation under repository policy." Flagging here so `/speckit-tasks` includes an explicit export task.
2. **Nav label key** — proposed `nav.saved` with "المحفوظات" / "Saved". Confirm the English spelling (vs. "Saved scholarships" or "Bookmarks") during the i18n copy pass before `tasks.md`.
3. **Empty-state Explore CTA target** — spec says `/[locale]/student/scholarships`. If an in-progress change renames the discovery route, this plan assumes the current route stays canonical through Feature 006.

These are flagged for `/speckit-tasks` and visible verification; none block plan commit.

## Complexity Tracking

_No violations._ Constitution gates passed; no justification table required.
