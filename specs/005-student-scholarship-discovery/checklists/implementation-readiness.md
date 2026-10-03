# Feature 005 — Pre-implementation Readiness Checklist

Use this checklist to verify the delivered implementation and evidence against the approved Feature 005 specification, plan, tasks, and checked-in OpenAPI contract. Mark an item only when the cited behavior, artifact, or test evidence exists.

## 1. Scope protection

- [ ] The delivered feature contains a reusable Student Shell, discovery/search, URL-owned filtering/sorting/pagination, backend country options, Grid/List, bookmarks, responsive behavior, a minimal factual details boundary, Arabic RTL/English LTR, data states, and accessibility-critical interactions.
  - Missing: only the foundation exists (types, API, URL state, keys, hooks); shell, UI, bookmarks, details, i18n and responsive work are T008–T066.
- [x] No dark mode, full future Details design, Saved Scholarships page, recommendation backend, highest-match sorting, frontend match calculation, fake match data, notifications backend, Application Tracking, Document Enhancement, fake future student routes, or admin scholarship workflow is included.
  - Evidence: feature API calls only the five discovery routes (src/features/student/scholarship-discovery/api/scholarships.ts:11-38); adapter sets `match: null` (src/features/student/scholarship-discovery/adapters/scholarship.ts:30); no other routes or dark styles added. Re-verify at T066.

## 2. Backend contract

- [x] Discovery uses only `GET /api/scholarships/`; it authenticates through the existing active-user API behavior and sends fixed `page_size=20` only in the backend request.
  - Evidence: src/features/student/scholarship-discovery/api/scholarships.ts:11 via `apiClient` (cookie credentials); `page_size` added only in `toDiscoveryRequestParams` (src/features/student/scholarship-discovery/lib/discovery-query-state.ts:79-83); tests/student-scholarship-discovery.test.mjs:320.
- [x] Country options use only authenticated `GET /api/scholarships/filter-options`; 401/403 behavior follows existing API/auth handling.
  - Evidence: src/features/student/scholarship-discovery/api/scholarships.ts:29 via `apiClient`, which throws `ApiError` with status; 401/403 not retried (src/features/student/scholarship-discovery/lib/query-retry.ts:2); session 401 handled by src/features/auth/providers/AuthProvider.tsx:31; tests/student-scholarship-discovery.test.mjs:367, tests/student-scholarship-discovery.test.mjs:384.
- [x] Details use `GET /api/scholarships/{scholarship_id}` and bookmark actions use POST/DELETE `/api/scholarships/{scholarship_id}/save`.
  - Evidence: src/features/student/scholarship-discovery/api/scholarships.ts:33-38; tests/student-scholarship-discovery.test.mjs:351.
- [x] Discovery exposes only `newest` and `deadline_soon`; `deadline_soonest` is accepted on input and normalized, never emitted or displayed.
  - Evidence: only two visible sort options (src/features/student/scholarship-discovery/constants.ts:26-35); alias normalized in parsing and never serialized (src/features/student/scholarship-discovery/lib/discovery-query-state.ts); tests/student-scholarship-discovery.test.mjs:64, tests/student-scholarship-discovery.test.mjs:457.
- [x] Repeated academic-level, funding-type, opportunity-type, and country parameters preserve documented OR semantics; filter groups combine with AND.
  - Evidence: repeated params sent per group (src/features/student/scholarship-discovery/lib/discovery-query-state.ts:67-77); OR/AND semantics recorded in specs/005-student-scholarship-discovery/contract-notes.md:20-21; tests/student-scholarship-discovery.test.mjs:72, tests/student-scholarship-discovery.test.mjs:320.
- [x] Country values are taken only from filter-options and forwarded unchanged as repeated `country` values.
  - Evidence: src/features/student/scholarship-discovery/components/CountryFilter.tsx uses only `useScholarshipFilterOptions`; `mergeCountryOptions`, URL parsing and API params keep strings unchanged (tests/student-scholarship-discovery.test.mjs: country round-trip, merge and serialization tests).
- [x] Contract fixtures cover nullable discovery/detail fields, and discovery never calls the recommendations endpoint.
  - Evidence: nullable card and detail fixtures in tests/student-scholarship-discovery.test.mjs:213-318; no recommendations endpoint referenced in src/features/student/scholarship-discovery.

## 3. URL state

- [x] Browser URL state contains only `search`, repeated `academic_level`, `funding_type`, `opportunity_type`, `country`, `sort`, and `page`.
  - Evidence: serializer emits only these keys (src/features/student/scholarship-discovery/lib/discovery-query-state.ts:67-77); unknown params such as `view` are dropped (tests/student-scholarship-discovery.test.mjs:427).
- [x] `page_size` is fixed at 20, API-only, absent from browser URLs and Back/Forward restoration, and not user-editable.
  - Evidence: `DISCOVERY_PAGE_SIZE` (src/features/student/scholarship-discovery/constants.ts:9) used only in request params; URL `page_size` ignored and never serialized (tests/student-scholarship-discovery.test.mjs:114).
- [x] Grid/List is in-memory presentation state and absent from URLs.
  - Evidence: `useState` in ScholarshipDiscoveryPage; not in URL or keys (tests/student-scholarship-discovery.test.mjs view-switch and URL tests); round-2 manual re-test passed (ar/en).
- [x] Search, filter, and sort changes reset only `page` to 1; pagination changes only `page`.
  - Evidence: `withSearch`/`withFilterChange`/`withSort`/`withPage` (src/features/student/scholarship-discovery/lib/discovery-query-state.ts:86-93); tests/student-scholarship-discovery.test.mjs:132.
- [x] Back/Forward restores the effective search/filter/sort/page state.
  - Evidence: filter/sort/page use push and search uses replace (`lib/discovery-navigator.ts`, tested with a fake router in tests/student-scholarship-discovery.test.mjs); the query is parsed from the URL only; round-1 manual Back/Forward check passed in ar/en.
- [x] URL parsing removes blanks, collapses search whitespace, deduplicates values, rejects unsupported enums, normalizes the legacy sort alias, and converts invalid pages to 1.
  - Evidence: `normalizeDiscoveryQuery` (src/features/student/scholarship-discovery/lib/discovery-query-state.ts:44-55); tests/student-scholarship-discovery.test.mjs:72, tests/student-scholarship-discovery.test.mjs:89, tests/student-scholarship-discovery.test.mjs:107.

## 4. React Query architecture

- [x] The key factory contains `all`, `discoveries()`, `discovery(query)`, `details()`, `detail(id)`, `savedLists()`, `saved()`, and `filterOptions()`.
  - Evidence: src/features/student/scholarship-discovery/query-keys.ts:3-13 matches specs/005-student-scholarship-discovery/plan.md:92; `saved()` takes no params; tests/student-scholarship-discovery.test.mjs (query keys are stable and hierarchical).
- [x] `discovery(query)` contains normalized backend-affecting state only; Grid/List is in no React Query key.
  - Evidence: the hook keys a normalized query (src/features/student/scholarship-discovery/hooks/useScholarshipDiscovery.ts:10); tests/student-scholarship-discovery.test.mjs:400, tests/student-scholarship-discovery.test.mjs:427.
- [x] `filterOptions()` is independent of search, filters, page, sort, and view mode, with a longer stale time than discovery.
  - Evidence: 30-minute stale time (src/features/student/scholarship-discovery/hooks/useScholarshipFilterOptions.ts:6-11); independent key; tests/student-scholarship-discovery.test.mjs:449.
- [x] Switching Grid/List alone causes neither discovery nor filter-options refetch.
  - Evidence: `lib/queries.ts` builds options from the URL query only; tests/student-scholarship-discovery.test.mjs drives real QueryObservers through repeated view switches with one discovery and one filter-options request (and fails if the view leaks into the query).
- [x] Bookmark updates and settlement are targeted; settlement never invalidates `studentScholarshipKeys.all`.
  - Evidence: `bookmarkMutationOptions` onMutate/onSettled; targeted-invalidation test in tests/student-scholarship-discovery.test.mjs.

## 5. Student Shell

- [x] `StudentShell` is mounted only by `src/app/[locale]/student/layout.tsx`, which retains `RoleGuard`.
  - Evidence: src/app/[locale]/student/layout.tsx; tests/student-layout.test.mjs (layout mounts StudentShell once, inside RoleGuard).
- [x] Student route pages remain Server Components by default and page content never mounts a second shell.
  - Evidence: src/app/[locale]/student/profile/page.tsx renders `ProfilePageContent`; tests/student-layout.test.mjs (pages are Server Components that never mount a second frame).
- [x] Profile retains its domain and form ownership while inheriting the shared outer frame.
  - Evidence: src/features/profile/components/ProfilePageContent.tsx (logic unchanged); manual check passed for forms, avatar upload and logout in ar/en.
- [x] Only implemented Profile and Search Scholarships destinations are interactive.
  - Evidence: src/features/student/layout/student-navigation.ts; only Profile is visible until T023 enables Search; tests/student-layout.test.mjs navigation tests.
- [x] Mobile navigation has an accessible label, keyboard operation, Escape dismissal, appropriate focus management, and focus return.
  - Evidence: src/features/student/layout/StudentMobileNavigation.tsx; focus-trap logic tested in tests/student-layout.test.mjs; manual keyboard check passed at mobile width.

## 6. i18n

- [x] Arabic and English `StudentLayout`, `StudentScholarshipDiscovery`, and `StudentScholarshipDetails` messages exist before user-facing UI implementation.
  - Evidence: src/messages/ar.json and en.json (19 + 71 + 30 keys), added in commit 4cb2f2f before any UI; tests/student-layout.test.mjs key parity test.
- [x] Messages cover navigation, search, filters, Country loading/empty/unavailable states, sorting, Grid/List, cards, bookmarks, pagination, data states, dialogs, details, and accessibility labels.
  - Evidence: keys for navigation, search, filters, country states, sort, views, cards, bookmarks, pagination, data states, dialogs, details and ARIA labels; ICU and plural tests in tests/student-layout.test.mjs. Re-audit at T057.
- [x] No visible or ARIA string introduced by Feature 005 is temporarily hard-coded.
  - Evidence: foundation code has no user-facing strings; the title fallback is `undefined` (src/features/student/scholarship-discovery/adapters/scholarship.ts:13-31). Re-verify at T057.

## 7. Scholarship rendering

- [x] Grid and List consume the same normalized `ScholarshipCardModel` and use the same bookmark/details actions.
  - Evidence: both render `ScholarshipCardParts` and the same `ScholarshipBookmark` from one `ScholarshipCardModel`.
- [x] Both views safely omit or represent nullable backend metadata without inventing facts.
  - Evidence: adapter + rule A1 (`lib/card-labels.ts`) hide only null/blank values; real data with null fields renders cleanly; tests in tests/student-scholarship-discovery.test.mjs; round-2 manual re-test passed (ar/en).
- [x] No compatibility score, eligibility result, match reason, or match badge is fabricated.
  - Evidence: adapter always sets `match: null` (src/features/student/scholarship-discovery/adapters/scholarship.ts:30); no match calculation exists; tests/student-scholarship-discovery.test.mjs:240. Re-verify when views are built.
- [x] `ScholarshipMatchBadge` renders nothing when authoritative match data is absent.
  - Evidence: components/ScholarshipMatchBadge.tsx returns null when `getMatchBadgeDisplay` does; tests/student-scholarship-discovery.test.mjs match-badge test.

## 8. Images

- [x] Runtime scholarship images use native `<img>` for arbitrary backend hosts with meaningful alt text, lazy loading, and stable aspect ratio.
  - Evidence: `ScholarshipImage` (native lazy `<img>`, `card.imageAlt`, fixed aspect box); server-render test in tests/student-scholarship-discovery.test.mjs; round-2 manual re-test passed (ar/en).
- [x] Malformed URLs and image load failures use a local neutral placeholder.
  - Evidence: `getScholarshipImageSource` (invalid URL and onError paths) tested in tests/student-scholarship-discovery.test.mjs; headless Chrome: a failing https URL fell back with alt="" in the same box.
- [x] Figma sample images are not runtime fallbacks.
  - Evidence: ScholarshipImage falls back to the local `/images/student/scholarship-image-fallback.svg` only; tests/student-scholarship-discovery.test.mjs image tests.
- [x] No global ESLint disable, global ESLint policy modification, or broad arbitrary-host `next.config` allowlist is introduced.
  - Evidence: eslint.config.mjs and next.config.ts unchanged from `main`. Re-verify at T035.
- [x] Any `@next/next/no-img-element` suppression is narrowly documented and component-local to the scholarship backend-image component.
  - Evidence: one documented `eslint-disable-next-line` in components/ScholarshipImage.tsx; tests/student-scholarship-discovery.test.mjs asserts it is the only one in src/features/student and that eslint.config.mjs is unchanged. (The profile avatar exception in components/profile/ProfileSummaryCard.tsx predates Feature 005.)

## 9. Bookmark behavior

- [x] Unsaved cards issue one POST save request and saved cards issue one DELETE unsave request, with a per-scholarship pending guard.
  - Evidence: endpoint/method and duplicate-blocking tests in tests/student-scholarship-discovery.test.mjs; headless Chrome double-click sent one POST.
- [x] Optimistic changes update only affected discovery, detail, and saved-list caches; a failed mutation restores exact snapshots.
  - Evidence: multi-page optimistic and precise-rollback tests in tests/student-scholarship-discovery.test.mjs.
- [x] Discovery, detail, and saved-list `is_saved` state remain coherent after success or failure.
  - Evidence: optimistic update covers discoveries() and detail(id); rollback per card; settlement invalidates discoveries, detail and saved lists (tests in tests/student-scholarship-discovery.test.mjs).
- [x] Save, Remove saved, pending, and failure feedback have accessible localized labels.
  - Evidence: components/ScholarshipBookmark.tsx (bookmark.saveFor/removeFor, aria-busy spinner, polite bookmark.error); round-3 manual check passed (ar/en).

## 10. Pagination and states

- [ ] Pagination uses server `page`, `page_size`, and `total_pages`, with Previous/Next, a bounded page window, ellipses, disabled states, and `aria-current`.
  - Built and unit-tested (tests/student-scholarship-discovery.test.mjs); not verifiable with real data yet (7 published scholarships = one page).
- [x] An out-of-range returned page is reconciled once using URL replacement.
  - Evidence: replace-mode `reconcilePage` once per URL with a visible notice (approved as built); target, notice and replace mode tested in tests/student-scholarship-discovery.test.mjs.
- [x] Initial loading uses view-appropriate skeletons and background refresh retains usable results with a busy indication.
  - Evidence: `ScholarshipSkeletons` + `getDiscoveryResultsState` (tested in tests/student-scholarship-discovery.test.mjs); round-2 manual re-test passed (ar/en).
- [x] No-scholarships and no-matches empty states are distinct and offer truthful edit-search/clear actions.
  - Evidence: `DiscoveryEmptyState` with edit search (focuses input) and clear filters; selection tested in tests/student-scholarship-discovery.test.mjs; round-2 manual re-test passed (ar/en).
- [x] Authentication, 422, generic retryable, and malformed-data states are distinguishable and accessible.
  - Evidence: `DiscoveryErrorState` + `getDiscoveryResultsState` (every error type, malformed responses/cards, canceled requests) tested in tests/student-scholarship-discovery.test.mjs; round-2 manual re-test passed (ar/en).

## 11. Responsive behavior

- [x] At desktop `lg`, the Student Shell/sidebar/header, discovery filters, two-column Grid, and full List are present.
  - Evidence: shell, filter panel, two-column grid and full-width list rows; round-2 manual re-test passed (ar/en) at desktop width.
- [x] Below `lg`, results adapt and filters are reachable through a mobile trigger/panel.
  - Missing: mobile filter trigger and panel (T048).
- [x] On mobile, navigation, one-column Grid, compact/wrapping List, stacked toolbar, compact pagination, and no fixed-width overflow are verified.
  - Missing: mobile layout (T049–T051).
- [x] RTL and LTR use logical placement and preserve readable keyboard/focus order.
  - Evidence: logical classes throughout; headless-Chrome geometry mirrored between /ar and /en; round-2 manual re-test passed (ar/en).

## 12. Minimal details

- [ ] The canonical route is `/[locale]/student/scholarships/[id]` and rejects invalid/non-positive IDs before requesting data.
  - Missing: details route (T052, T053). The detail hook already refuses invalid IDs (src/features/student/scholarship-discovery/hooks/useScholarshipDetail.ts).
- [ ] The real detail endpoint renders loading, existing 401/403 behavior, 404, and retryable-error states.
  - Missing: detail states (T054).
- [ ] The details view is a factual nullable-safe summary with bookmark coherence and localized Back to discovery navigation.
  - Missing: details view (T054, T055). The details adapter is ready (src/features/student/scholarship-discovery/adapters/scholarship.ts:33).
- [ ] No full Details Figma experience, application flow, tracking, eligibility, or fabricated match content has entered the route.
  - Missing: route not built (T052–T056).

## 13. Accessibility

- [x] Search has a label; filter groups use fieldsets/legends and native checkboxes; Country and sort controls are labelled.
  - Evidence: `DiscoverySearchField` (sr-only label), `DiscoveryFilters` and `CountryFilter` (fieldset/legend, native checkboxes), `DiscoverySortSelect` (label); round-1 manual keyboard check passed in ar/en.
- [ ] Grid/List controls expose `aria-pressed`; bookmark controls, Details links, and pagination navigation have accessible names.
  - Missing: toggle, bookmark and pagination controls (T034, T039, T043).
- [ ] Pagination exposes `aria-current`; loading, error, and empty states use appropriate live announcements.
  - Live announcements in place (role=status/alert); pagination `aria-current` is built but not yet seen with real data (one page).
- [x] Mobile navigation and mobile filters are labelled dialogs with keyboard operation, Escape, focus management, focus return, and a focus trap where appropriate.
  - Missing: both dialogs (T012, T048, T059).

## 14. Figma convergence

- [ ] Functional implementation is compared with primary node `2262:3331` and empty node `2264:3472` for spacing, typography, borders, radii, icons, RTL alignment, toolbar, filters, cards, pagination, and empty state.
  - Missing: Figma comparison (T030, T061).
- [ ] List View is intentionally inferred from the shared visual system and is included in the comparison.
  - Missing: List View comparison (T061, T062).
- [x] Dark-mode Figma nodes remain out of scope.
  - Evidence: dark nodes excluded in specs/005-student-scholarship-discovery/plan.md:254 and tasks.md:112.

## 15. Verification

- [x] `git diff --check` completes successfully.
  - Evidence: passed at 066ccbf (exit 0).
- [x] `pnpm lint` completes successfully.
  - Evidence: passed at 066ccbf (0 errors; 3 existing warnings in unrelated files).
- [x] `pnpm exec tsc --noEmit` completes successfully.
  - Evidence: passed at 066ccbf (exit 0).
- [x] `node --test tests/student-scholarship-discovery.test.mjs` completes successfully.
  - Evidence: 26/26 passed at 066ccbf (`pnpm test:scholarship-discovery`).
- [x] `pnpm build` completes successfully.
  - Evidence: passed at 066ccbf (exit 0). The new routes do not exist yet, so re-run at T065.
- [ ] Actual test results plus RTL/LTR, responsive, and Figma-convergence evidence are recorded in Feature 005 verification documentation.
  - Missing: no Feature 005 verification document yet (T066).

CHECKLIST READY FOR /speckit.implement
