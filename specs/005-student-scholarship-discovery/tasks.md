# Tasks — 005 Student Scholarship Discovery

**Purpose:** Deliver authenticated student scholarship discovery with a reusable Student Shell, backend-owned search/filter/sort/pagination, Grid/List views, real bookmarks, authoritative country options, and a minimal factual details boundary. Do not expand into dark mode, full details design, recommendations, fake future routes, or admin work.

## Known external dependencies

- **Backend discovery data** — see [backend-issues.md](backend-issues.md). All published scholarships have `study_level`, `funding_type` and `opportunity_type` set to null (plus `university_name`, `title_ar`, `title_en`), so the academic level, funding and opportunity filters return no matches and cards show no funding badge or study level. The study-level and funding matchers also reject common free-text forms. Reported to the backend team; no frontend workaround (decision 2026-10-03). End-to-end filter verification for T026, T029 and T045 depends on this fix or on manually classified records.

## Phase 1 — Contract, types, and URL query-state foundation

- [x] T001 Confirm `docs/api/openapi.json`: discovery, detail, save, and filter-options routes; auth/error responses; repeated-filter OR semantics; nullable cards; and sort aliases.
  - Evidence: `contract-notes.md` records routes, error statuses, OR/AND semantics, limits, nullable fields, and the unpaged `/saved` array.
- [x] T002 Add discovery raw/detail contracts, `ScholarshipDiscoveryFilterOptionsResponse`, normalized `DiscoveryQuery`, `ScholarshipCardModel`, and optional `ScholarshipMatchInfo` (`score`, `level`, `reasons`, `coverage`; no eligibility) to `types.ts`; do not provide match data. `ScholarshipDetailsResponse` is a separate type matching `docs/api/openapi.json:9204`, including required `ingestion_type` and `source` and every nullable field. Add a details adapter that normalizes the list-or-string fields `majors`, `eligibility_criteria`, and `required_documents` into `string[]`.
  - Evidence: separate `ScholarshipDetailsResponse`, `toScholarshipDetails`/`toStringList`, match fields `score`/`level`/`reasons`/`coverage`, `opportunity_type` typed as the OpenAPI enum; adapter tests pass.
- [x] T003 Add typed discovery filter/sort constants: only `newest` and `deadline_soon`, URL-input alias `deadline_soonest`, and fixed `pageSize: 20`.
- [x] T003a Add a typed sort-option config (value plus i18n key) that can accept a future `match` sort without exposing it now; only `newest` and `deadline_soon` are visible. Test that adding a hidden `match` entry changes neither the visible options nor Grid/List components.
  - Evidence: `discoverySortOptions` + `getVisibleSortOptions` in `constants.ts`; sort-config tests pass. Grid/List components do not exist yet, so the test covers the config and URL parsing only.
- [x] T004 Add one URL parser/serializer for search, repeated academic/funding/opportunity/country values, sort, and page; normalize whitespace, blanks, duplicates, unknown enums, aliases, and invalid pages. Cap values to the OpenAPI limits: `search` ≤300 characters, each `country` ≤100 characters and ≤50 values, and other filter groups ≤20 values.
  - Evidence: `normalizeDiscoveryQuery` caps search/country/filter values; parse/serialize and cap tests pass.
- [x] T005 Ensure URL updates reset page only for search/filter/sort changes; pagination updates only page; serialize API-only `page_size=20` separately.
  - Evidence: `withSearch`/`withFilterChange`/`withSort` reset page, `withPage` changes only page, `toDiscoveryRequestParams` adds `page_size`; tests pass.
- [x] T006 Add foundation tests for canonical parsing/serialization, repeated country parameters, normalization, page reset, and Back/Forward-compatible state.
  - Evidence: `tests/student-scholarship-discovery.test.mjs` (`pnpm test:scholarship-discovery`), 24 passing tests.
- [x] T007 Define `studentScholarshipKeys` with `all`, `discoveries()`, `discovery(query)`, `details()`, `detail(id)`, `savedLists()`, `saved()` (no paging params; `GET /api/scholarships/saved` returns an unpaged array), and `filterOptions()`; prove Grid/List is excluded.
  - Evidence: `saved()` takes no params; key stability and Grid/List exclusion tests pass.

## Phase 2 — Early i18n scaffolding + Student Shell integration

- [x] T008 Create Arabic and English `StudentLayout`, `StudentScholarshipDiscovery`, and `StudentScholarshipDetails` scaffolding before UI work, covering visible and ARIA strings for navigation, shell, search, filters, country states, sort, Grid/List, cards, bookmarks, details, counts, pagination, all data states, and dialogs.
  - Evidence: `StudentLayout` (19), `StudentScholarshipDiscovery` (71) and `StudentScholarshipDetails` (30) keys in src/messages/ar.json and en.json; `pnpm test:student-layout` checks key parity, ICU validity via `intl-messageformat`, and Arabic plural categories (`zero` or `=0`, plus one/two/few/many/other).
- [x] T009 Add typed student navigation configuration with only Profile and Search Scholarships enabled; omit unavailable Figma destinations.
  - Evidence: `src/features/student/layout/student-navigation.ts` (Profile enabled; Search Scholarships disabled until T023); tests/student-layout.test.mjs navigation tests pass.
- [x] T010 Build the StudentShell frame with desktop header/sidebar and active-route behavior; reuse existing auth/profile/locale primitives and add no auth store, notifications, or theme control.
  - Evidence: manual check passed (ar/en, desktop): single header and sidebar, RTL/LTR, active item.
- [x] T011 Integrate real identity and locale behavior into the shell while preserving profile feature/forms ownership.
  - Evidence: manual check passed (ar/en): account name in header and sidebar; language switch keeps the route.
- [x] T012 Build the mobile student navigation drawer: labelled trigger/dialog, keyboard navigation, Escape, appropriate focus management, and focus return.
  - Evidence: manual check passed (mobile width, keyboard): label, Escape/backdrop/close/link close, Tab trap, focus return to the menu button.
- [x] T013 Update only `src/app/[locale]/student/layout.tsx` as the thin Server Component integration point, retaining `RoleGuard` and rendering `StudentShell` around `{children}`.
  - Evidence: `src/app/[locale]/student/layout.tsx` is a Server Component rendering `RoleGuard` > `StudentShell` once; tests/student-layout.test.mjs layout test passes.
- [x] T014 Adapt Profile outer presentation to inherit the route shell; ensure pages never mount a second shell and remain Server Components by default.
  - Evidence: Profile body moved to `src/features/profile/components/ProfilePageContent.tsx` with logic unchanged; `profile/page.tsx` is a thin Server Component; old `Navbar`/`Sidebar`/`ProfileLayout` deleted; tests/student-layout.test.mjs single-shell tests pass.
- [x] T015 Test the Profile shell regression, active routes, identity/locale integration, and mobile-navigation keyboard behavior.
  - Evidence: automated tests in tests/student-layout.test.mjs plus manual check passed: Profile save, avatar upload, logout, active routes and mobile keyboard behaviour in ar/en.
- [ ] T015a Follow-up: move the hard-coded Arabic in the Profile content (step labels, completion label, profile-name fallback, "under development" box) into Arabic/English messages.
- [ ] T015b Follow-up: localize the hard-coded Arabic loading and error text in `src/features/auth/components/RoleGuard.tsx`.

## Phase 3 — Discovery API, filter-options, hooks, and adapter

- [x] T016 Add `api/scholarships.ts` typed `apiClient` functions for discovery, filter options, details, save, and unsave; no admin/recommendations APIs. Only GET functions take an `AbortSignal`. Save returns `SavedScholarshipResponse` and unsave returns `UnsaveScholarshipResponse`.
  - Evidence: GET functions take `AbortSignal`; save/unsave typed as `SavedScholarshipResponse`/`UnsaveScholarshipResponse`; method/path tests pass.
- [x] T017 Implement `getScholarshipFilterOptions(signal?): Promise<ScholarshipDiscoveryFilterOptionsResponse>` for `GET /api/scholarships/filter-options` and defensively parse `countries: string[]`.
  - Evidence: `parseFilterOptionsResponse` keeps non-empty strings unchanged and throws on malformed payloads; tests pass.
- [x] T018 Implement `useScholarshipFilterOptions` using `studentScholarshipKeys.filterOptions()` and a longer sensible stale time than discovery; it must not depend on search, page, filters, sort, or Grid/List state.
- [x] T019 Add the normalized card adapter for localized titles, nullable metadata/image/deadline fields, `is_saved`, and an absent-by-default match seam. A missing title becomes `undefined`; the UI shows a translated fallback.
  - Evidence: adapter returns `undefined` for a missing title; title-selection tests pass.
- [x] T020 Add `useScholarshipDiscovery` with normalized query key, positive-page guard, `placeholderData: keepPreviousData`, and no retry for 401/403/422.
  - Evidence: `hooks/useScholarshipDiscovery.ts` normalizes the query (positive-page guard) before keying and fetching; hooks split one per file; guard tests pass.
- [x] T021 Add `useDiscoveryQueryState` with URL synchronization and locale-aware routing.
  - Evidence: `useDiscoveryQueryState` delegates to `createDiscoveryNavigator` (`lib/discovery-navigator.ts`) with the `@/i18n/navigation` router; tests/student-scholarship-discovery.test.mjs drives it with a fake router: replace for search, push (`scroll: false`) for filters/sort/page/clear, page reset, no-op skipping, and URL-only Back/Forward state.
- [x] T022 Test endpoint/method/query mapping, typed filter-options parsing, unchanged country serialization, no ISO/source dependency, query-key stability, stale-time independence, and adapter behavior.
  - Evidence: endpoint/method/query mapping, unchanged country strings, filter-options validation, key stability, stale-time independence, and adapter tests pass.

## Phase 4 — Toolbar and filters

- [x] T023 Add the thin Server Component discovery route delegating to `ScholarshipDiscoveryPage`; it renders page content only and never mounts StudentShell.
  - Evidence: `src/app/[locale]/student/scholarships/page.tsx` renders `ScholarshipDiscoveryPage` in `<Suspense>`; no shell or `use client`; Search Scholarships enabled in navigation; tests/student-layout.test.mjs route guards and navigation tests pass.
- [x] T024 Compose `DiscoveryToolbar` UI: localized search field/placeholder, sort control, result heading, and Grid/List controls using early i18n keys.
  - Evidence: Figma-aligned `DiscoveryToolbar` (search, sort, `DiscoveryViewToggle` with `aria-pressed`); view-switch QueryObserver test in tests/student-scholarship-discovery.test.mjs; round-2 manual re-test passed (ar/en).
- [x] T025 Add toolbar interaction synchronization: transient draft, ~300ms debounce, normalized URL update/page reset, and Back/Forward draft resync; Grid/List stays in memory.
  - Evidence: `DiscoverySearchField` (local draft, 300ms debounce, Enter flush, Clear, replace mode, URL re-sync); debounce/re-sync tests with mock timers in tests/student-scholarship-discovery.test.mjs; round-1 manual check passed in ar/en (one request per debounced search, Back/Forward).
- [x] T026 Build desktop enum filter fieldsets/checkboxes and Clear all using canonical URL callbacks and no default Figma selections.
  - Evidence: `DiscoveryFilters` (fieldsets/legends, native checkboxes, push mode, Clear all for filters and page); tests/student-scholarship-discovery.test.mjs filter tests; round-1 manual check passed in ar/en.
- [x] T027 Build the Country selector from filter-options strings only: display and URL/API value are identical, selections serialize as repeated `country` parameters, and a change resets page to 1.
  - Evidence: `CountryFilter` (options only from filter-options, exact strings, repeated params, page reset); merge/serialization tests in tests/student-scholarship-discovery.test.mjs; round-1 manual check passed in ar/en.
- [x] T028 Implement independent Country control loading, successful non-empty, successful empty, and localized unavailable/retry states; failed options must not disable discovery results.
  - Evidence: independent loading/empty/unavailable+Retry states in `CountryFilter`; round-1 manual check passed with filter-options blocked (results stayed usable, Retry recovered).
- [x] T029 Test toolbar debounce and URL behavior; all filter groups; one/multiple countries; clear all; Country state variants/retry; discovery usability on options error; and no filter-options refetch from Grid/List switching.
  - Evidence: pure-logic tests in tests/student-scholarship-discovery.test.mjs plus the passed round-1 manual check; the Grid/List part is covered by the QueryObserver test "switching Grid/List never refetches results or country options".

## Phase 5 — Grid and List results

- [x] T030 Inspect Figma nodes `2262:3331` and `2264:3472` before visual implementation; record stable asset requirements without shipping MCP URLs.
  - Evidence: inspected `2262:3331`, `2264:3472` plus tablet/mobile search frames via the Figma server; node map recorded in plan.md section 31; illustration `2264:4109` exported to `public/images/student/scholarship-empty-state.svg`; no MCP URLs shipped.
- [x] T031 Implement `ScholarshipGridCard` from the normalized model with native backend `<img>`, meaningful alt text, lazy loading, stable aspect ratio, malformed/load-error handling, and local neutral fallback; never use Figma runtime fallbacks, Next Image solely for lint, a global lint disable, or a broad `next.config` host allowlist. If needed, keep `@next/next/no-img-element` suppression narrowly documented and component-local around the scholarship backend-image component.
  - Evidence: `ScholarshipGridCard` + `ScholarshipImage` (http(s) only, lazy, fixed box, decorative fallback incl. onError; tests and headless-Chrome check); funding/level rendering verified against mock data; round-2 manual re-test passed (ar/en). Real data currently has null funding/level: see backend-issues.md.
  - Note: the local neutral fallback image is decorative (`alt=""`); there is no `card.imageFallbackAlt` message. Real backend images use `card.imageAlt`.
- [x] T032 Implement compact `ScholarshipListRow` from the exact same model and actions; retain the same factual hierarchy.
  - Evidence: `ScholarshipListRow` shares `ScholarshipCardParts` and the model with the grid card; round-2 manual re-test passed (ar/en). Funding/level/provider fields depend on backend data: see backend-issues.md.
  - Note: the local neutral fallback image is decorative (`alt=""`); there is no `card.imageFallbackAlt` message. Real backend images use `card.imageAlt`.
- [x] T033 Implement `ScholarshipMatchBadge` as a future seam that returns nothing without authoritative match data and never calculates data locally.
  - Evidence: `ScholarshipMatchBadge` renders `getMatchBadgeDisplay(match)` only; it returns null for absent/empty/invalid data and the adapter always sets `match: null`; authoritative fixture renders as given (tests/student-scholarship-discovery.test.mjs).
- [x] T034 Implement results composition and semantic `aria-pressed` Grid/List toggle; changing view must not change URL, page, filters, sort, discovery query, or filter-options query.
  - Evidence: `ScholarshipResults` renders the same model as Grid or List from in-memory view state; QueryObserver test proves no URL/key/query change; round-2 manual re-test passed (ar/en).
- [ ] T035 Test shared-model rendering, nullable data, no fake match badge, future authoritative match fixture, presentation-only switching, and scholarship image policy: native `<img>`, lazy loading, alt behavior, malformed/load-error/local-neutral fallback, no Figma runtime fallback, no global lint disable or broad `next.config` host allowlist, and any required lint suppression component-local only.
  - Partial: tests/student-scholarship-discovery.test.mjs covers nullable/wrongly typed fields, no default match, a future authoritative match fixture, presentation-only switching (QueryObserver) and the image policy (http(s) only, local fallback, lazy, alt, single component-local suppression, no global ESLint change). Missing: rendered-card checks (no React test harness); covered by the manual checklist.

## Phase 6 — Bookmark mutations

- [ ] T036 Implement `useScholarshipBookmark` with a per-scholarship pending guard and real POST/DELETE selected by `isSaved`.
- [ ] T037 Optimistically snapshot/update only discovery caches containing the ID, `detail(id)`, and the `saved()` cache; roll back exact snapshots on failure.
- [ ] T038 On settlement invalidate only relevant `discoveries()`, `detail(id)`, and `saved()` queries; never invalidate `studentScholarshipKeys.all`.
- [ ] T039 Add localized accessible Save/Remove labels, pending state, and failure feedback to Grid and List controls.
- [ ] T040 Test save/unsave method/ID, duplicate prevention, optimistic update/rollback, and targeted cache coherence.

## Phase 7 — Pagination, loading, empty, and error states

- [x] T041 Add defensive calendar-date deadline helpers for no deadline, valid/today/future dates, missing/malformed values, locale wording, and no negative countdown.
  - Evidence: `lib/deadlines.ts` parses YYYY-MM-DD as calendar dates, compares against the local calendar day, never counts negative, and formats with the pinned Latin-digit locale; `ScholarshipDeadline` shows none/unspecified/past/today/days-left. tests/student-scholarship-discovery.test.mjs covers malformed and impossible dates, all statuses, local-midnight and DST flips, four time zones (and fails if "today" uses UTC), and Latin digits.
- [x] T042 Add bounded pagination-window/ellipsis helper and tests for first/middle/last/small/large windows.
  - Evidence: `lib/pagination.ts` `getPageWindow` (first/last, current ±1, ellipses, at most 7 slots); tests/student-scholarship-discovery.test.mjs covers empty, small, first, middle, last, large and clamped windows plus unique keys for every page up to 40.
- [ ] T043 Implement accessible pagination from server `page`, `page_size`, and `total_pages`, including Previous/Next, disabled states, `aria-current`, URL update, and replace-based out-of-range reconciliation.
  - Built: `DiscoveryPagination` (window, Previous/Next, `aria-current`, push mode, focus/scroll) and out-of-range reconcile (replace + notice), approved as built; window and reconcile logic tested in tests/student-scholarship-discovery.test.mjs. Open: the multi-page UI cannot be exercised with real data (7 published scholarships = one page); verify once there are more than 20 published scholarships (see backend-issues.md).
- [x] T044 Implement Grid/List skeletons and background-refresh busy behavior without removing usable results.
  - Evidence: grid/list `ScholarshipSkeletons` on first load, previous results kept with the updating status (`getDiscoveryResultsState`, tested in tests/student-scholarship-discovery.test.mjs); round-2 manual re-test passed (ar/en).
- [x] T045 Implement distinct no-scholarships/no-matches empty states with real edit-search/clear actions.
  - Evidence: `DiscoveryEmptyState` (Figma 2264:4108) noScholarships vs noMatches with edit search/clear filters; selection tested in tests/student-scholarship-discovery.test.mjs; round-2 manual re-test passed (ar/en). Filter-driven no-matches results are currently caused by backend data: see backend-issues.md.
- [x] T046 Implement truthful auth, 422, generic retryable, malformed-card, loading/error/empty live states.
  - Evidence: `DiscoveryErrorState` (403, 422 + clear filters, generic + retry), 401 via AuthProvider, malformed cards in place, canceled requests never error (tests in tests/student-scholarship-discovery.test.mjs); round-2 manual re-test passed (ar/en).
- [ ] T047 Test deadline cases, counts/plurals, pagination/reconciliation, skeleton/refresh, empty variants, and errors.
  - Partial: tests/student-scholarship-discovery.test.mjs covers deadlines, pagination window and reconciliation, loading/updating, every error type, noScholarships vs noMatches and malformed cards; tests/student-layout.test.mjs and tests/i18n-numerals.test.mjs cover counts and plurals. Missing: rendered-state checks (no React test harness); covered by the manual checklist.

## Phase 8 — Responsive and mobile behavior

- [ ] T048 Build the mobile filter dialog from the same URL-owned filters with Apply/Clear/Close, labelled modal semantics, Escape, focus management/return, and no fetch on open/close.
- [ ] T049 Apply `lg` shell/filter/two-column Grid/full List behavior; below `lg` adaptive results/filter trigger; at mobile one-column Grid, wrapping List, stacked toolbar, compact pagination, and mobile navigation.
- [ ] T050 Verify no overflow and logical RTL/LTR placement/order across shell, toolbar, filters, cards, bookmarks, and pagination.
- [ ] T051 Add responsive/mobile-filter and keyboard coverage, recording manual viewport evidence when the test harness cannot assess layout.

## Phase 9 — Minimal scholarship details boundary

- [ ] T052 Add thin Server Component `[id]/page.tsx` delegating to `ScholarshipDetailsBoundary`; do not mount StudentShell or implement the future full Details Figma page.
- [ ] T053 Implement detail query positive numeric-ID guard and real `GET /api/scholarships/{id}` request using `detail(id)`.
- [ ] T054 Implement factual details states: loading, 401/403 convention, 404, retryable error, real nullable fields/bookmark, and localized Back to discovery. Show plain-text fields only; never render `description_html` in this feature.
- [ ] T055 Preserve detail `is_saved` coherence through bookmark cache updates; fabricate no eligibility, match, application, or tracking information.
- [ ] T056 Test ID validation/enable guard, endpoint/states/null fields, Back link, and bookmark coherence.

## Phase 10 — Localization and accessibility audit

- [ ] T057 Audit translation completeness and ensure no visible or ARIA string was hard-coded during UI work.
- [ ] T058 Refine Arabic and English copy, pluralization, RTL/LTR behavior, localized country unavailable/retry wording, and accessibility labels.
- [ ] T059 Audit semantic controls/live regions and both mobile dialogs for labels, keyboard behavior, Escape, focus trap where appropriate, and focus return.
- [ ] T060 Add focused Arabic/English and accessibility-critical tests/manual verification.

## Phase 11 — Figma visual convergence

- [ ] T061 Compare real-data implementation to primary/empty Figma nodes for spacing, sizing, typography, borders, radii, icons, toolbar, filters, cards, pagination, empty state, and Arabic RTL alignment.
- [ ] T062 Converge tablet/mobile adaptations with repository tokens and stable local assets; retain inferred List View and exclude dark nodes.
- [ ] T062a Follow-up (out of scope for Feature 005): Figma uses Rubik while the app uses Almarai everywhere; decide app-wide whether to switch fonts. No font change in this feature.

## Phase 12 — Tests and final verification

- [ ] T063 Run `node --test tests/student-scholarship-discovery.test.mjs`.
- [ ] T064 Run `git diff --check`, `pnpm lint`, and `pnpm exec tsc --noEmit`.
- [ ] T065 Run `pnpm build`; record only concrete external/environment blockers.
- [ ] T066 Update Feature 005 verification/checklist documentation with actual test results and RTL/LTR, responsive, and Figma evidence.
