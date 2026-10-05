# Tasks: Student Saved Scholarships (Feature 006)

**Input**: Design documents from `/specs/006-student-saved-scholarships/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required), [contract-notes.md](./contract-notes.md)

**Mode**: Frontend-first / contract-first. All work in gate 1 runs under `SAVED_SCHOLARSHIPS_ENABLED=false` by default. The flag flip and the live backend run belong only to gate 2.

**Format**: `- [ ] TNNN [P?] Description with file path`

- **[P]**: Different file, no dependency on an incomplete task — can run in parallel.
- All paths are repository-relative. The current branch is `006-student-saved-scholarships`.

---

## Phase 1 — Setup & Feature Flag

**Purpose**: land the server-only flag, env docs, and dev-mock backend scaffolding before any application code depends on them.

- [x] T001 Add `SAVED_SCHOLARSHIPS_ENABLED` section to [.env.example](../../.env.example) with a leading comment that it defaults to off (unset or any non-`"true"` value), is **server-only** (never `NEXT_PUBLIC_`), and must only be flipped to `"true"` after live backend contract acceptance (gate 2).
- [x] T002 Create [src/lib/feature-flags.ts](../../src/lib/feature-flags.ts) exporting a frozen `featureFlags` object whose `savedScholarshipsEnabled` getter returns `process.env.SAVED_SCHOLARSHIPS_ENABLED === 'true'` and `false` for every other value (unset, `""`, `"false"`, `"1"`, `"yes"`, `"TRUE"`). No `NEXT_PUBLIC_` reads; no `|| true` fallback.
- [x] T003 Add flag guard tests to [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): (a) `savedScholarshipsEnabled` is `false` when the var is unset; (b) `false` for every tested non-`"true"` value; (c) `true` only for the literal `"true"`; (d) static scan of [src/lib/feature-flags.ts](../../src/lib/feature-flags.ts) and [.env.example](../../.env.example) fails on `NEXT_PUBLIC_` prefix or default-`true` patterns.
- [x] T004 [P] Add [scripts/dev-mock-backend.mjs](../../scripts/dev-mock-backend.mjs) — a plain Node HTTP mock server that serves the target contract for `GET /api/scholarships/saved`, `GET /api/scholarships/` (dataset ≥ 20 published items), `POST /api/scholarships/{id}/save`, `DELETE /api/scholarships/{id}/save`, and `GET /api/scholarships/{id}`. Loads fixtures from `tests/fixtures/saved-scholarships/`. Supports scenario switch via `SCENARIO` env var or `?scenario=` query: `populated`, `empty`, `one-item`, `multi-item`, `unsave-failure`, `loading-slow`, `auth-401`, `forbidden-403`, `server-500`, `malformed`, `nullable-fields`.
- [x] T005 [P] Add [scripts/dev-mock-backend.README.md](../../scripts/dev-mock-backend.README.md) documenting how to run the mock, which env vars to set in `.env.local` (`BACKEND_URL=http://127.0.0.1:4100`, `SAVED_SCHOLARSHIPS_ENABLED=true`), and the scenario list. Explicitly state the script is dev-only and never imported by application code.
- [x] T006 [P] Add production-import guard test to [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): walks every `.ts` / `.tsx` file under [src/](../../src), parses imports, fails if any specifier resolves into [tests/](../../tests), [scripts/](../../scripts), or any path containing `fixture`. Also fails if any component references a `figma.com` host or a temporary CDN URL (plan FR-021), and fails if the saved-empty asset referenced from [SavedScholarshipsEmpty.tsx](../../src/features/student/saved-scholarships/components/SavedScholarshipsEmpty.tsx) does not resolve to a local path under [public/images/](../../public/images/).
- [x] T006a [P] Add reuse-boundary static tests to [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): (a) no file under [src/features/student/saved-scholarships/](../../src/features/student/saved-scholarships/) re-exports `ScholarshipDiscoveryCard` or redefines `toScholarshipCard` (both must be imported from `scholarship-discovery/`); (b) `src/features/student/saved-scholarships/` introduces no new mutation hook — only the existing [useScholarshipBookmark](../../src/features/student/scholarship-discovery/hooks/useScholarshipBookmark.ts) is imported. The suite fails if a parallel hook or redefined card type appears in the saved sub-feature.
- [x] T034 [P] Seed the `StudentSavedScholarships` namespace skeleton and the `nav.saved` key in [src/messages/en.json](../../src/messages/en.json) and [src/messages/ar.json](../../src/messages/ar.json) — "Saved" (en) / "المحفوظات" (ar) for `nav.saved`, plus placeholder keys for the saved-page copy — so Phase 5 nav/flag tests resolve `nav.saved`. Final copy audit and plural rules land in Phase 6 (T035–T037).

---

## Phase 2 — Response Validator & API

**Purpose**: pure validator and the single new API call. Keep both independent of React.

- [x] T007 Create [src/features/student/saved-scholarships/lib/validateSavedResponse.ts](../../src/features/student/saved-scholarships/lib/validateSavedResponse.ts): pure synchronous function `validateSavedResponse(raw: unknown): { ok: true; cards: ScholarshipDiscoveryCard[] } | { ok: false; error: SavedContractError }`. Rejects non-arrays, items failing [isDiscoveryCardShape](../../src/features/student/scholarship-discovery/adapters/scholarship.ts), and items with `is_saved !== true`. Returns a typed enum reason (`not-array` / `empty-item-shape` / `missing-is-saved` / `is-saved-false`). Empty `[]` is `ok: true` with zero cards.
- [x] T008 Add validator unit tests in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs) covering: accepts populated / one-item / multi-item / nullable-fields arrays; empty `[]` is `ok: true`; rejects non-array, envelope-wrapped, discovery-shape-missing, and `is_saved=false` cases with distinct error reasons.
- [x] T009 [P] Create fixtures `populated.json`, `empty.json`, `one-item.json`, `multi-item.json`, `nullable-fields.json`, `malformed.json` under [tests/fixtures/saved-scholarships/](../../tests/fixtures/saved-scholarships/). Each models the TARGET contract (discovery-card-compatible items with `is_saved: true`); `malformed.json` deliberately violates it. No production imports.
- [x] T010 Create [src/features/student/saved-scholarships/api/saved-scholarships.ts](../../src/features/student/saved-scholarships/api/saved-scholarships.ts) exporting `getSavedScholarships(signal: AbortSignal): Promise<ScholarshipDiscoveryCard[]>`. Calls `apiClient.get('/api/scholarships/saved', { signal })` with **no** query parameters, runs the raw response through `validateSavedResponse`, and throws a `SavedContractError` on `ok: false` so the React Query layer sees it as an error, not an empty array.
- [x] T011 Add API-call tests in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): asserts the URL path, absence of `page`/`page_size`/`skip`/`limit` query args, the abort signal plumbing, and that a malformed response throws `SavedContractError` without populating a cache entry.

---

## Phase 3 — Route, Page & States

**Purpose**: build the server-gated route and the client composition for populated/empty/loading/error, under the existing Student Shell.

- [x] T012 Create [src/app/[locale]/student/saved/page.tsx](../../src/app/%5Blocale%5D/student/saved/page.tsx) as an async Server Component. Reads `featureFlags.savedScholarshipsEnabled` server-side and calls `notFound()` immediately when `false`. On `true`, renders `<SavedScholarshipsPage />` with the current locale. No `apiClient` call in this file.
- [x] T013 Create [src/features/student/saved-scholarships/hooks/useSavedScholarshipsQuery.ts](../../src/features/student/saved-scholarships/hooks/useSavedScholarshipsQuery.ts): `useQuery` over `studentScholarshipKeys.saved()` with `queryFn = ({ signal }) => getSavedScholarships(signal)`. Standard retry policy consistent with 005; a `SavedContractError` surfaces as an error state, never an empty success.
- [x] T014 Create [src/features/student/saved-scholarships/components/SavedScholarshipsPage.tsx](../../src/features/student/saved-scholarships/components/SavedScholarshipsPage.tsx) ('use client'). Composes header + grid (via `ScholarshipGridCard`) + empty + error + loading skeleton. `cards.length` is the single source of truth for both the count and the empty-vs-populated branch; a loading or error state is never rendered as "zero".
- [x] T015 Create [src/features/student/saved-scholarships/components/SavedScholarshipsHeader.tsx](../../src/features/student/saved-scholarships/components/SavedScholarshipsHeader.tsx) rendering the localized title and the plural-aware saved count derived from the array length only (no separate `total` field, no Figma sample copy). During optimistic unsave, the header count reflects the mutated array length.
- [x] T016 Create [src/features/student/saved-scholarships/components/SavedScholarshipsEmpty.tsx](../../src/features/student/saved-scholarships/components/SavedScholarshipsEmpty.tsx) rendering the Figma `2358:7754` composition: central 200×200 illustration, localized heading and explanatory copy, and the Explore CTA linking to `/[locale]/student/scholarships` (discovery route — unchanged by Feature 006). Only renders on `ok` + `cards.length === 0`.
- [x] T017 Create [src/features/student/saved-scholarships/components/SavedScholarshipsErrorState.tsx](../../src/features/student/saved-scholarships/components/SavedScholarshipsErrorState.tsx): localized retryable error for both generic failures and `SavedContractError`. Copy MUST NOT reveal backend-contract details. Retry is a keyboard-accessible button that re-runs the saved query. **Note**: the saved endpoint does not document a 403 response ([contract-notes.md](./contract-notes.md)); the 403 branch MUST render the generic localized "access unavailable" copy and MUST NOT say "account disabled" or imply that meaning until the backend contract establishes it.
- [x] T018 Create [src/features/student/saved-scholarships/components/SavedScholarshipsLoading.tsx](../../src/features/student/saved-scholarships/components/SavedScholarshipsLoading.tsx) reusing the existing 005 grid skeleton primitive; count is announced as unknown, never zero.
- [x] T019 Create [src/features/student/saved-scholarships/index.ts](../../src/features/student/saved-scholarships/index.ts) with the public exports used by [page.tsx](../../src/app/%5Blocale%5D/student/saved/page.tsx). Must NOT re-export `ScholarshipDiscoveryCard` or redefine `toScholarshipCard` — these are imported from `scholarship-discovery/`.
- [x] T020 Add state-rendering tests in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): loading (count unknown), confirmed populated (grid renders cards from the fixture, count equals `.length`), confirmed empty (illustration + CTA), contract error (error state, not empty), generic error with Retry, 401 passthrough to existing auth recheck, 403 access-unavailable copy with no auto-retry **and no "account disabled" phrasing**, **the Details link on each saved card resolves to `/[locale]/student/scholarships/{id}` with the real scholarship `id` in the current locale (FR-011)**, and **no match badge, score, compatibility label or inferred ranking is rendered on any saved card (FR-019)**.

---

## Phase 4 — Cache Integration (Optimistic Unsave + Reconciliation)

**Purpose**: extend the 005 bookmark-cache to cover the saved array without forking it, without inserting optimistically on save-from-elsewhere, and without ever invalidating `studentScholarshipKeys.all`.

- [x] T021 Create [src/features/student/saved-scholarships/lib/savedCache.ts](../../src/features/student/saved-scholarships/lib/savedCache.ts) with pure helpers used by the bookmark cache: `snapshotSaved(client)`, `removeFromSaved(client, id)` returning `{ item, originalIndex }`, and `restoreToSaved(client, { item, originalIndex })` that reinserts the item at its original relative position among the current survivors (preserving concurrent independent successful removals).
- [x] T022 Extend [src/features/student/scholarship-discovery/lib/bookmark-cache.ts](../../src/features/student/scholarship-discovery/lib/bookmark-cache.ts): add `cancelQueries({ queryKey: studentScholarshipKeys.savedLists() })` to the existing cancel bundle, and apply `removeFromSaved` **only when `save === false`** (i.e. optimistic unsave). The save direction (`save === true`) MUST NOT write into `studentScholarshipKeys.saved()` — reconciliation on save-from-elsewhere happens solely via settlement invalidation (FR-010 + T025). The function returns a composite snapshot `{ discovery: BookmarkSnapshot; saved?: { item; originalIndex } }`: `onMutate` builds it (`discovery` from the existing `applyOptimisticBookmark`; `saved` from `removeFromSaved` only on the unsave direction) and threads it through to `onError`, which calls `rollbackBookmark(client, id, snapshot.discovery)` and, when `snapshot.saved` is defined, `restoreToSaved(client, snapshot.saved)`. Keep the existing `invalidateQueries({ queryKey: studentScholarshipKeys.savedLists() })` on settlement. `studentScholarshipKeys.all` MUST NOT be invalidated.
- [x] T023 Confirm (no code change required) that [src/features/student/scholarship-discovery/hooks/useScholarshipBookmark.ts](../../src/features/student/scholarship-discovery/hooks/useScholarshipBookmark.ts) continues to use `bookmarkMutationKey(id)` and the shared per-ID pending guard. The saved page re-uses this hook unchanged; no second mutation system.
- [x] T024 Add optimistic-unsave tests in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): successful unsave removes the exact item (count −1); failed unsave restores the exact item at its original relative position when other independent removals have shifted positions; concurrent removal where one succeeds and one fails preserves the success; last-item successful unsave transitions to the empty state; last-item failed unsave restores the one card and one count, with announced failure feedback surviving the card's temporary unmount.
- [x] T025 Add save-from-elsewhere test in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): a save success triggered from a discovery card does NOT optimistically insert into `studentScholarshipKeys.saved()`. The saved query entry stays untouched by the optimistic path; `savedLists()` is invalidated on settlement and the next query refetches authoritatively.
- [x] T026 Add targeted-invalidation test in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): on settlement of a saved-page unsave, exactly `savedLists()`, `discoveries()`, and `detail(id)` are invalidated; `studentScholarshipKeys.all`, `filterOptions`, and unrelated families are not.

---

## Phase 5 — Student Shell Navigation Plumbing

**Purpose**: add the `saved` nav entry under the `discover` group, driven by the server-read flag through the student layout, with the single-active-nav guarantee enforced by test.

- [x] T027 Extend [src/features/student/layout/types.ts](../../src/features/student/layout/types.ts) to add `'saved'` to `StudentNavigationItemId` and `StudentPageKey`.
- [x] T028 Extend [src/features/student/layout/student-navigation.ts](../../src/features/student/layout/student-navigation.ts): add the `saved` item under the `discover` group with `labelKey: 'nav.saved'`, `href: '/student/saved'`, and `enabled: false` as the default. Add a `withSavedEnabled(items, enabled)` helper that returns the items with the saved entry's `enabled` set accordingly. Extend `getStudentPageKey` so `/student/saved` returns `'saved'` and `/student/scholarships*` continues to return `scholarships` or `scholarshipDetails` — never `saved`.
- [x] T029 Update [src/app/[locale]/student/layout.tsx](../../src/app/%5Blocale%5D/student/layout.tsx) to read `featureFlags.savedScholarshipsEnabled` server-side and pass it to `StudentShell` as a `savedEnabled` prop. No new auth state introduced; `RoleGuard` ownership unchanged.
- [x] T030 Update [src/features/student/layout/StudentShell.tsx](../../src/features/student/layout/StudentShell.tsx) to accept `savedEnabled: boolean`, apply `withSavedEnabled` once, and pass the resulting items down to `StudentSidebar` and `StudentMobileNavigation`. Neither leaf component reads env vars directly.
- [x] T031 Update [src/features/student/layout/StudentSidebar.tsx](../../src/features/student/layout/StudentSidebar.tsx) and [src/features/student/layout/StudentMobileNavigation.tsx](../../src/features/student/layout/StudentMobileNavigation.tsx) to accept the plumbed `items` list unchanged. Icon map in the sidebar gets a `saved: Bookmark` (or equivalent existing icon) entry; no other logic change.
- [x] T032 Add nav + flag tests in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): with `savedEnabled=false`, `getVisibleStudentNavigation` emits no `saved` item in either locale and the saved Server Component's gate predicate returns the `notFound` sentinel; with `savedEnabled=true`, the item appears under `discover` and the gate predicate passes.
- [x] T033 Add single-active-nav test in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): with saved enabled, exactly one entry in `studentNavigation` satisfies `isStudentNavigationItemActive` for each of `/student/profile`, `/student/scholarships`, `/student/scholarships/123`, and `/student/saved`. Specifically asserts `/student/scholarships*` never activates `saved`, and `/student/saved` never activates `scholarships`.

---

## Phase 6 — Internationalization (copy audit)

**Purpose**: fill out the bilingual copy against final wording and plural rules, on top of the Phase 1 skeleton (T034). Keep the namespace parity invariant.

**Note**: `T034` landed in Phase 1 — it already seeded the `nav.saved` key and the `StudentSavedScholarships` namespace skeleton so Phase 5 nav/flag tests can resolve `nav.saved`. Phase 6 completes the copy and plural rules on top of that skeleton.

- [x] T034b [P] Finalize the English `StudentSavedScholarships` copy in [src/messages/en.json](../../src/messages/en.json): page title, empty-state heading/body/CTA (empty-state uses "Saved Scholarships" title, Explore CTA), loading announcement, retryable error, 403 access-unavailable copy (**no "account disabled" phrasing**), optimistic unsave failure feedback, plural `savedCount` rules, visible/aria names. Replaces the Phase 1 placeholder copy for `en`.
- [x] T035 [P] Finalize the Arabic `StudentSavedScholarships` copy in [src/messages/ar.json](../../src/messages/ar.json) with matching Arabic copy and plural rules (zero/one/two/few/many/other). The `nav.saved` label "المحفوظات" already landed in Phase 1 (T034); Phase 6 completes the surrounding namespace.
- [x] T036 Extend the existing namespace-parity test (the 005 translation audit in [tests/student-scholarship-discovery.test.mjs](../../tests/student-scholarship-discovery.test.mjs) scope or an equivalent assertion in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs)) to cover every new key in both locales; a missing key or spurious key fails the suite.
- [x] T037 Add plural-formatting test in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs) for `savedCount` at 0, 1, 2, 3, 11, and 100 in ar and en.

---

## Phase 7 — Responsive & Figma Convergence

**Purpose**: match the 005 responsive adaptations and land the exact Figma empty-state asset.

- [x] T038 Export the illustration from Figma node `2358:7754` (file `snMA3CewSOTzniE7qsGCaZ`, inner group `2358:7956`) as [public/images/student-scholarships/saved-empty.svg](../../public/images/student-scholarships/saved-empty.svg). Commit the local asset; no runtime Figma URL. If the exact source asset is unavailable, use project-native shapes/icons per the repository asset policy (contract-notes.md). Reference the asset from [SavedScholarshipsEmpty.tsx](../../src/features/student/saved-scholarships/components/SavedScholarshipsEmpty.tsx) at its native 200×200 size.
- [x] T039 Apply the 005 responsive grid in [SavedScholarshipsPage.tsx](../../src/features/student/saved-scholarships/components/SavedScholarshipsPage.tsx): three columns ≥ `lg`, two columns at tablet, one column at mobile; approximately 24 px desktop gap. Empty-state and CTA scale within existing shell content space.
- [x] T040 Add responsive-structure test in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): page composition emits the 3/2/1-column Tailwind classes consistently with 005, and both saved-page states (populated and empty) stay within shell content space with no horizontal overflow signals in the component tree.

---

## Phase 8 — Accessibility

**Purpose**: visible focus, polite live regions, keyboard operability, logical reading order in RTL and LTR.

- [x] T041 Give [SavedScholarshipsPage.tsx](../../src/features/student/saved-scholarships/components/SavedScholarshipsPage.tsx) a page-level `aria-live="polite"` region that announces loading, confirmed empty, and the saved count on change, plus a separate assertive-only region for optimistic unsave failure so feedback survives the removed card's unmount.
- [x] T042 Ensure Explore CTA ([SavedScholarshipsEmpty.tsx](../../src/features/student/saved-scholarships/components/SavedScholarshipsEmpty.tsx)) and Retry ([SavedScholarshipsErrorState.tsx](../../src/features/student/saved-scholarships/components/SavedScholarshipsErrorState.tsx)) are reachable by Tab, have visible focus rings matching 005 conventions, and expose meaningful accessible names. The empty-state illustration gets `role="presentation"` / `aria-hidden="true"`; it does not add redundant spoken descriptions.
- [x] T043 Add RTL / LTR layout + a11y test in [tests/student-saved-scholarships.test.mjs](../../tests/student-saved-scholarships.test.mjs): under ar, title/count/grid/empty-state CTA follow logical ordering; focus-order test confirms Details link and ScholarshipBookmark button are distinct focusable elements per card.
- [x] T044 Confirm bookmark-button focus is preserved after optimistic unsave: focus moves to the next surviving card's bookmark button, or (last-item case) to the Explore CTA in the empty state, with the transition announced by the live region (T041).

---

## Phase 9 — Full-Suite Verification (gate 1 close-out)

**Purpose**: run the complete frontend test suite plus static checks before claiming FRONTEND IMPLEMENTATION COMPLETE.

- [x] T045 Run `node --test --test-isolation=none tests/student-saved-scholarships.test.mjs` and record pass/fail counts; all added tests must pass with `SAVED_SCHOLARSHIPS_ENABLED` unset (default-off) and separately with it set to `"true"` under the test harness.
- [x] T046 Run `node --test tests/*.test.mjs` and confirm no regression beyond the 8 pre-existing failures already present on `origin/main` (`tests/google-auth.test.mjs`, 7 in `tests/profile-personal-information.test.mjs`).
- [x] T047 Run `pnpm exec tsc --noEmit` (clean) and `pnpm lint` (0 errors; only the 3 pre-existing warnings).
- [x] T048 Run `pnpm build` (default env, flag unset) and confirm the saved route still participates as a notFound() 404 — no runtime fetch, no shell render of saved-specific panes.
- [x] T049 Browser verification against the local dev-mock (`scripts/dev-mock-backend.mjs` running on port 4100, `.env.local` set with `BACKEND_URL=http://127.0.0.1:4100` and `SAVED_SCHOLARSHIPS_ENABLED=true`) in ar and en at 1440/768/375 px: scenarios `populated`, `empty`, `one-item`, `unsave-failure`, `auth-401`, `forbidden-403`, `server-500`, `malformed`. At each viewport width (1440 / 768 / 375 px) and in each locale assert `document.documentElement.scrollWidth === document.documentElement.clientWidth` on both populated and empty states (SC-006 — no horizontal page overflow). Record a verification note under [specs/006-student-saved-scholarships/verification.md](./verification.md). Nothing mock-related is committed except the dev-mock script itself and its README.
- [x] T050 Append a Feature 006 verification record to [specs/006-student-saved-scholarships/verification.md](./verification.md) summarizing automated results (T045–T048), the dev-mock browser pass (T049), confirmed flag-OFF default, and the still-open backend obligations.

---

## FRONTEND IMPLEMENTATION COMPLETE (Gate 1)

> **Gate 1 Status: PASSED** (2026-10-05)
> Verified with standard command suite:
>
> - `node --test --test-isolation=none tests/student-saved-scholarships.test.mjs` (29/29 PASS)
> - `pnpm test:student-layout` (15/15 PASS)
> - `pnpm test:i18n` (6/6 PASS)
> - `pnpm test:scholarship-discovery` (90/90 PASS)
> - `pnpm exec tsc --noEmit` (0 errors)
> - `pnpm lint` (0 errors, 3 warnings)
> - `pnpm build` (Compiled successfully, static 404 preserved for `/student/saved`)

**Gate 1 scope**: tasks T001–T050 above (including T006a and T034b added by the analyze-remediation pass). The feature flag `SAVED_SCHOLARSHIPS_ENABLED` remains OFF (unset) in every committed source and every deployed environment. No tasks in gate 1 flip the flag by default, ship fixture data as production fallback, or claim live-backend acceptance.

**Gate 1 exit checks (all must hold)**:

- The saved route returns `notFound()` for every production/preview deploy where `SAVED_SCHOLARSHIPS_ENABLED` is unset.
- No `src/` file imports from `tests/`, `scripts/`, or any `*fixture*` path (T006).
- Flag default is still `false` (T003).
- `studentScholarshipKeys.all` is never invalidated by the extended bookmark cache (T022, T026).
- `tasks.md` must not be ticked past this point without explicit backend acceptance under gate 2.

---

## Phase 10 — BACKEND INTEGRATION ACCEPTANCE (Gate 2)

**Purpose**: live run against the aligned backend contract. **The flag flip belongs only to this gate.** No gate-1 task may enable the flag by default.

- [ ] T051 Confirm the backend has shipped the aligned `GET /api/scholarships/saved` contract: authenticated, complete unpaged array, every item discovery-card-compatible with `is_saved=true`, discovery-equivalent visibility semantics (deleted / expired / hidden / non-approved filtered out), deterministic ordering. Record confirmation (ticket link, release tag, or backend contact) in [specs/006-student-saved-scholarships/verification.md](./verification.md).
- [ ] T052 Live run against the deployed backend with ≥ 20 real saved scholarships for a test student in ar and en: populated page, confirmed empty for a cleared account, saved count equals authoritative array length, cards use real nullable fields with no fabrication, no match badges, no N+1 enrichment, no browser pagination.
- [ ] T053 Live optimistic unsave end-to-end: real `DELETE /api/scholarships/{id}/save` settles cleanly; failed delete triggers the exact-position rollback; last-item removal transitions to empty; concurrent unsave preserves independent successes. No contract-error path triggers in normal operation.
- [ ] T054 Live cross-view coherence: save from discovery → saved page re-fetches on next visit and shows the new item (no optimistic insert from the save path); unsave from the saved page flips `is_saved` on the discovery and details views coherently; `studentScholarshipKeys.all` remains uninvalidated.
- [ ] T055 Flip `SAVED_SCHOLARSHIPS_ENABLED=true` in preview, verify gate 1's exit checks still hold under the live backend (no leak, no fallback), then flip in production. Record the env-change commit/PR link (or Vercel/Render env audit entry) in [verification.md](./verification.md). **This is the only task in the entire plan that enables the flag.**
- [ ] T056 Post-flip smoke test (ar + en): the "المحفوظات" / "Saved" nav item is visible, the saved route resolves (no `notFound()`), the count matches reality, no console/network errors beyond expected 401/403/404 for intentional negative paths.

---

## Dependencies & Execution Order

| Phase                    | Depends on                                                                 | Parallelism                                                                                             |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1 — Setup & Flag         | —                                                                          | T004, T005, T006, T006a, T034 are [P] once T002 lands.                                                  |
| 2 — Validator & API      | T002 (uses the flag indirectly via tests only), T006 for the fixture guard | T009 fixtures are [P] with T007; T008 depends on T007; T011 depends on T010.                            |
| 3 — Route, Page & States | T002, T007, T010, T013                                                     | T014–T018 touch different files and may run in parallel after T013; T020 depends on T014–T018.          |
| 4 — Cache Integration    | 005 bookmark cache (already present); T013, T014                           | T021 [P] with the first draft of T022; T024–T026 depend on both.                                        |
| 5 — Nav                  | T002, T012                                                                 | T027 → T028 → T029 → T030 → T031 (sequential; all touch coupled files). T032, T033 depend on all prior. |
| 6 — i18n (copy audit)    | T034 (seeded in Phase 1); T014–T018 for context                            | T034b and T035 are [P]; T036 and T037 depend on both.                                                   |
| 7 — Responsive & Figma   | T014, T016                                                                 | T038 can run in parallel with T039; T040 depends on both.                                               |
| 8 — A11y                 | T014, T016, T017                                                           | T041–T044 are sequential within the same component tree.                                                |
| 9 — Verification         | all above                                                                  | Run sequentially; T049 requires the dev-mock from T004–T005.                                            |
| Gate 2                   | Gate 1 fully green + backend aligned                                       | T051 blocks T052–T054; T055 blocks T056.                                                                |

**MVP boundary**: gate 1 (T001–T050) is the shippable frontend increment. It carries no user-visible exposure because the route and nav sit behind the OFF flag.

---

## Notes

- Every gate-1 task runs with `SAVED_SCHOLARSHIPS_ENABLED` unset in CI; local dev may set it to `"true"` against the dev-mock.
- Tests live immediately after the code they cover within each phase; there is no separate "tests" phase.
- The dev-mock backend ([scripts/dev-mock-backend.mjs](../../scripts/dev-mock-backend.mjs)) is dev-only. The production-import guard (T006) enforces that `src/` never references it.
- `tasks.md` must not record gate 2 as complete until the flag flip is persisted in the deploy environment and the live smoke test passes.
