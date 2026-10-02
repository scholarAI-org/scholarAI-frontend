# Tasks — 005 Student Scholarship Discovery

**Purpose:** Deliver authenticated student scholarship discovery with a reusable Student Shell, backend-owned search/filter/sort/pagination, Grid/List views, real bookmarks, authoritative country options, and a minimal factual details boundary. Do not expand into dark mode, full details design, recommendations, fake future routes, or admin work.

## Phase 1 — Contract, types, and URL query-state foundation

- [ ] T001 Confirm `docs/api/openapi.json`: discovery, detail, save, and filter-options routes; auth/error responses; repeated-filter OR semantics; nullable cards; and sort aliases.
- [ ] T002 Add discovery raw/detail contracts, `ScholarshipDiscoveryFilterOptionsResponse`, normalized `DiscoveryQuery`, `ScholarshipCardModel`, and optional `ScholarshipMatchInfo` to `types.ts`; do not provide match data.
- [ ] T003 Add typed discovery filter/sort constants: only `newest` and `deadline_soon`, URL-input alias `deadline_soonest`, and fixed `pageSize: 20`.
- [ ] T004 Add one URL parser/serializer for search, repeated academic/funding/opportunity/country values, sort, and page; normalize whitespace, blanks, duplicates, unknown enums, aliases, and invalid pages.
- [ ] T005 Ensure URL updates reset page only for search/filter/sort changes; pagination updates only page; serialize API-only `page_size=20` separately.
- [ ] T006 Add foundation tests for canonical parsing/serialization, repeated country parameters, normalization, page reset, and Back/Forward-compatible state.
- [ ] T007 Define `studentScholarshipKeys` with `all`, `discoveries()`, `discovery(query)`, `details()`, `detail(id)`, `savedLists()`, `saved(page,pageSize)`, and `filterOptions()`; prove Grid/List is excluded.

## Phase 2 — Early i18n scaffolding + Student Shell integration

- [ ] T008 Create Arabic and English `StudentLayout`, `StudentScholarshipDiscovery`, and `StudentScholarshipDetails` scaffolding before UI work, covering visible and ARIA strings for navigation, shell, search, filters, country states, sort, Grid/List, cards, bookmarks, details, counts, pagination, all data states, and dialogs.
- [ ] T009 Add typed student navigation configuration with only Profile and Search Scholarships enabled; omit unavailable Figma destinations.
- [ ] T010 Build the StudentShell frame with desktop header/sidebar and active-route behavior; reuse existing auth/profile/locale primitives and add no auth store, notifications, or theme control.
- [ ] T011 Integrate real identity and locale behavior into the shell while preserving profile feature/forms ownership.
- [ ] T012 Build the mobile student navigation drawer: labelled trigger/dialog, keyboard navigation, Escape, appropriate focus management, and focus return.
- [ ] T013 Update only `src/app/[locale]/student/layout.tsx` as the thin Server Component integration point, retaining `RoleGuard` and rendering `StudentShell` around `{children}`.
- [ ] T014 Adapt Profile outer presentation to inherit the route shell; ensure pages never mount a second shell and remain Server Components by default.
- [ ] T015 Test the Profile shell regression, active routes, identity/locale integration, and mobile-navigation keyboard behavior.

## Phase 3 — Discovery API, filter-options, hooks, and adapter

- [ ] T016 Add `api/scholarships.ts` typed `apiClient` functions with AbortSignal support for discovery, filter options, details, save, and unsave; no admin/recommendations APIs.
- [ ] T017 Implement `getScholarshipDiscoveryFilterOptions(): Promise<ScholarshipDiscoveryFilterOptionsResponse>` for `GET /api/scholarships/filter-options` and defensively parse `countries: string[]`.
- [ ] T018 Implement `useScholarshipFilterOptions` using `studentScholarshipKeys.filterOptions()` and a longer sensible stale time than discovery; it must not depend on search, page, filters, sort, or Grid/List state.
- [ ] T019 Add the normalized card adapter for localized titles, nullable metadata/image/deadline fields, `is_saved`, and an absent-by-default match seam.
- [ ] T020 Add `useScholarshipDiscovery` with normalized query key, positive-page guard, `placeholderData: keepPreviousData`, and no retry for 401/403/422.
- [ ] T021 Add `useDiscoveryQueryState` with URL synchronization and locale-aware routing.
- [ ] T022 Test endpoint/method/query mapping, typed filter-options parsing, unchanged country serialization, no ISO/source dependency, query-key stability, stale-time independence, and adapter behavior.

## Phase 4 — Toolbar and filters

- [ ] T023 Add the thin Server Component discovery route delegating to `ScholarshipDiscoveryPage`; it renders page content only and never mounts StudentShell.
- [ ] T024 Compose `DiscoveryToolbar` UI: localized search field/placeholder, sort control, result heading, and Grid/List controls using early i18n keys.
- [ ] T025 Add toolbar interaction synchronization: transient draft, ~300ms debounce, normalized URL update/page reset, and Back/Forward draft resync; Grid/List stays in memory.
- [ ] T026 Build desktop enum filter fieldsets/checkboxes and Clear all using canonical URL callbacks and no default Figma selections.
- [ ] T027 Build the Country selector from filter-options strings only: display and URL/API value are identical, selections serialize as repeated `country` parameters, and a change resets page to 1.
- [ ] T028 Implement independent Country control loading, successful non-empty, successful empty, and localized unavailable/retry states; failed options must not disable discovery results.
- [ ] T029 Test toolbar debounce and URL behavior; all filter groups; one/multiple countries; clear all; Country state variants/retry; discovery usability on options error; and no filter-options refetch from Grid/List switching.

## Phase 5 — Grid and List results

- [ ] T030 Inspect Figma nodes `2262:3331` and `2264:3472` before visual implementation; record stable asset requirements without shipping MCP URLs.
- [ ] T031 Implement `ScholarshipGridCard` from the normalized model with native backend `<img>`, meaningful alt text, lazy loading, stable aspect ratio, malformed/load-error handling, and local neutral fallback; never use Figma runtime fallbacks, Next Image solely for lint, a global lint disable, or a broad `next.config` host allowlist. If needed, keep `@next/next/no-img-element` suppression narrowly documented and component-local around the scholarship backend-image component.
- [ ] T032 Implement compact `ScholarshipListRow` from the exact same model and actions; retain the same factual hierarchy.
- [ ] T033 Implement `ScholarshipMatchBadge` as a future seam that returns nothing without authoritative match data and never calculates data locally.
- [ ] T034 Implement results composition and semantic `aria-pressed` Grid/List toggle; changing view must not change URL, page, filters, sort, discovery query, or filter-options query.
- [ ] T035 Test shared-model rendering, nullable data, no fake match badge, future authoritative match fixture, presentation-only switching, and scholarship image policy: native `<img>`, lazy loading, alt behavior, malformed/load-error/local-neutral fallback, no Figma runtime fallback, no global lint disable or broad `next.config` host allowlist, and any required lint suppression component-local only.

## Phase 6 — Bookmark mutations

- [ ] T036 Implement `useScholarshipBookmark` with a per-scholarship pending guard and real POST/DELETE selected by `isSaved`.
- [ ] T037 Optimistically snapshot/update only discovery caches containing the ID, `detail(id)`, and saved-list caches; roll back exact snapshots on failure.
- [ ] T038 On settlement invalidate only relevant `discoveries()`, `detail(id)`, and `savedLists()` families; never invalidate `studentScholarshipKeys.all`.
- [ ] T039 Add localized accessible Save/Remove labels, pending state, and failure feedback to Grid and List controls.
- [ ] T040 Test save/unsave method/ID, duplicate prevention, optimistic update/rollback, and targeted cache coherence.

## Phase 7 — Pagination, loading, empty, and error states

- [ ] T041 Add defensive calendar-date deadline helpers for no deadline, valid/today/future dates, missing/malformed values, locale wording, and no negative countdown.
- [ ] T042 Add bounded pagination-window/ellipsis helper and tests for first/middle/last/small/large windows.
- [ ] T043 Implement accessible pagination from server `page`, `page_size`, and `total_pages`, including Previous/Next, disabled states, `aria-current`, URL update, and replace-based out-of-range reconciliation.
- [ ] T044 Implement Grid/List skeletons and background-refresh busy behavior without removing usable results.
- [ ] T045 Implement distinct no-scholarships/no-matches empty states with real edit-search/clear actions.
- [ ] T046 Implement truthful auth, 422, generic retryable, malformed-card, loading/error/empty live states.
- [ ] T047 Test deadline cases, counts/plurals, pagination/reconciliation, skeleton/refresh, empty variants, and errors.

## Phase 8 — Responsive and mobile behavior

- [ ] T048 Build the mobile filter dialog from the same URL-owned filters with Apply/Clear/Close, labelled modal semantics, Escape, focus management/return, and no fetch on open/close.
- [ ] T049 Apply `lg` shell/filter/two-column Grid/full List behavior; below `lg` adaptive results/filter trigger; at mobile one-column Grid, wrapping List, stacked toolbar, compact pagination, and mobile navigation.
- [ ] T050 Verify no overflow and logical RTL/LTR placement/order across shell, toolbar, filters, cards, bookmarks, and pagination.
- [ ] T051 Add responsive/mobile-filter and keyboard coverage, recording manual viewport evidence when the test harness cannot assess layout.

## Phase 9 — Minimal scholarship details boundary

- [ ] T052 Add thin Server Component `[id]/page.tsx` delegating to `ScholarshipDetailsBoundary`; do not mount StudentShell or implement the future full Details Figma page.
- [ ] T053 Implement detail query positive numeric-ID guard and real `GET /api/scholarships/{id}` request using `detail(id)`.
- [ ] T054 Implement factual details states: loading, 401/403 convention, 404, retryable error, real nullable fields/bookmark, and localized Back to discovery.
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

## Phase 12 — Tests and final verification

- [ ] T063 Run `node --test tests/student-scholarship-discovery.test.mjs`.
- [ ] T064 Run `git diff --check`, `pnpm lint`, and `pnpm exec tsc --noEmit`.
- [ ] T065 Run `pnpm build`; record only concrete external/environment blockers.
- [ ] T066 Update Feature 005 verification/checklist documentation with actual test results and RTL/LTR, responsive, and Figma evidence.
