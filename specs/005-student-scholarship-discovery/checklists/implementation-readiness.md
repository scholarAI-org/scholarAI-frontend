# Feature 005 — Pre-implementation Readiness Checklist

Use this checklist to verify the delivered implementation and evidence against the approved Feature 005 specification, plan, tasks, and checked-in OpenAPI contract. Mark an item only when the cited behavior, artifact, or test evidence exists.

## 1. Scope protection

- [ ] The delivered feature contains a reusable Student Shell, discovery/search, URL-owned filtering/sorting/pagination, backend country options, Grid/List, bookmarks, responsive behavior, a minimal factual details boundary, Arabic RTL/English LTR, data states, and accessibility-critical interactions.
- [ ] No dark mode, full future Details design, Saved Scholarships page, recommendation backend, highest-match sorting, frontend match calculation, fake match data, notifications backend, Application Tracking, Document Enhancement, fake future student routes, or admin scholarship workflow is included.

## 2. Backend contract

- [ ] Discovery uses only `GET /api/scholarships/`; it authenticates through the existing active-user API behavior and sends fixed `page_size=20` only in the backend request.
- [ ] Country options use only authenticated `GET /api/scholarships/filter-options`; 401/403 behavior follows existing API/auth handling.
- [ ] Details use `GET /api/scholarships/{scholarship_id}` and bookmark actions use POST/DELETE `/api/scholarships/{scholarship_id}/save`.
- [ ] Discovery exposes only `newest` and `deadline_soon`; `deadline_soonest` is accepted on input and normalized, never emitted or displayed.
- [ ] Repeated academic-level, funding-type, opportunity-type, and country parameters preserve documented OR semantics; filter groups combine with AND.
- [ ] Country values are taken only from filter-options and forwarded unchanged as repeated `country` values.
- [ ] Contract fixtures cover nullable discovery/detail fields, and discovery never calls the recommendations endpoint.

## 3. URL state

- [ ] Browser URL state contains only `search`, repeated `academic_level`, `funding_type`, `opportunity_type`, `country`, `sort`, and `page`.
- [ ] `page_size` is fixed at 20, API-only, absent from browser URLs and Back/Forward restoration, and not user-editable.
- [ ] Grid/List is in-memory presentation state and absent from URLs.
- [ ] Search, filter, and sort changes reset only `page` to 1; pagination changes only `page`.
- [ ] Back/Forward restores the effective search/filter/sort/page state.
- [ ] URL parsing removes blanks, collapses search whitespace, deduplicates values, rejects unsupported enums, normalizes the legacy sort alias, and converts invalid pages to 1.

## 4. React Query architecture

- [ ] The key factory contains `all`, `discoveries()`, `discovery(query)`, `details()`, `detail(id)`, `savedLists()`, `saved(page,pageSize)`, and `filterOptions()`.
- [ ] `discovery(query)` contains normalized backend-affecting state only; Grid/List is in no React Query key.
- [ ] `filterOptions()` is independent of search, filters, page, sort, and view mode, with a longer stale time than discovery.
- [ ] Switching Grid/List alone causes neither discovery nor filter-options refetch.
- [ ] Bookmark updates and settlement are targeted; settlement never invalidates `studentScholarshipKeys.all`.

## 5. Student Shell

- [ ] `StudentShell` is mounted only by `src/app/[locale]/student/layout.tsx`, which retains `RoleGuard`.
- [ ] Student route pages remain Server Components by default and page content never mounts a second shell.
- [ ] Profile retains its domain and form ownership while inheriting the shared outer frame.
- [ ] Only implemented Profile and Search Scholarships destinations are interactive.
- [ ] Mobile navigation has an accessible label, keyboard operation, Escape dismissal, appropriate focus management, and focus return.

## 6. i18n

- [ ] Arabic and English `StudentLayout`, `StudentScholarshipDiscovery`, and `StudentScholarshipDetails` messages exist before user-facing UI implementation.
- [ ] Messages cover navigation, search, filters, Country loading/empty/unavailable states, sorting, Grid/List, cards, bookmarks, pagination, data states, dialogs, details, and accessibility labels.
- [ ] No visible or ARIA string introduced by Feature 005 is temporarily hard-coded.

## 7. Scholarship rendering

- [ ] Grid and List consume the same normalized `ScholarshipCardModel` and use the same bookmark/details actions.
- [ ] Both views safely omit or represent nullable backend metadata without inventing facts.
- [ ] No compatibility score, eligibility result, match reason, or match badge is fabricated.
- [ ] `ScholarshipMatchBadge` renders nothing when authoritative match data is absent.

## 8. Images

- [ ] Runtime scholarship images use native `<img>` for arbitrary backend hosts with meaningful alt text, lazy loading, and stable aspect ratio.
- [ ] Malformed URLs and image load failures use a local neutral placeholder.
- [ ] Figma sample images are not runtime fallbacks.
- [ ] No global ESLint disable, global ESLint policy modification, or broad arbitrary-host `next.config` allowlist is introduced.
- [ ] Any `@next/next/no-img-element` suppression is narrowly documented and component-local to the scholarship backend-image component.

## 9. Bookmark behavior

- [ ] Unsaved cards issue one POST save request and saved cards issue one DELETE unsave request, with a per-scholarship pending guard.
- [ ] Optimistic changes update only affected discovery, detail, and saved-list caches; a failed mutation restores exact snapshots.
- [ ] Discovery, detail, and saved-list `is_saved` state remain coherent after success or failure.
- [ ] Save, Remove saved, pending, and failure feedback have accessible localized labels.

## 10. Pagination and states

- [ ] Pagination uses server `page`, `page_size`, and `total_pages`, with Previous/Next, a bounded page window, ellipses, disabled states, and `aria-current`.
- [ ] An out-of-range returned page is reconciled once using URL replacement.
- [ ] Initial loading uses view-appropriate skeletons and background refresh retains usable results with a busy indication.
- [ ] No-scholarships and no-matches empty states are distinct and offer truthful edit-search/clear actions.
- [ ] Authentication, 422, generic retryable, and malformed-data states are distinguishable and accessible.

## 11. Responsive behavior

- [ ] At desktop `lg`, the Student Shell/sidebar/header, discovery filters, two-column Grid, and full List are present.
- [ ] Below `lg`, results adapt and filters are reachable through a mobile trigger/panel.
- [ ] On mobile, navigation, one-column Grid, compact/wrapping List, stacked toolbar, compact pagination, and no fixed-width overflow are verified.
- [ ] RTL and LTR use logical placement and preserve readable keyboard/focus order.

## 12. Minimal details

- [ ] The canonical route is `/[locale]/student/scholarships/[id]` and rejects invalid/non-positive IDs before requesting data.
- [ ] The real detail endpoint renders loading, existing 401/403 behavior, 404, and retryable-error states.
- [ ] The details view is a factual nullable-safe summary with bookmark coherence and localized Back to discovery navigation.
- [ ] No full Details Figma experience, application flow, tracking, eligibility, or fabricated match content has entered the route.

## 13. Accessibility

- [ ] Search has a label; filter groups use fieldsets/legends and native checkboxes; Country and sort controls are labelled.
- [ ] Grid/List controls expose `aria-pressed`; bookmark controls, Details links, and pagination navigation have accessible names.
- [ ] Pagination exposes `aria-current`; loading, error, and empty states use appropriate live announcements.
- [ ] Mobile navigation and mobile filters are labelled dialogs with keyboard operation, Escape, focus management, focus return, and a focus trap where appropriate.

## 14. Figma convergence

- [ ] Functional implementation is compared with primary node `2262:3331` and empty node `2264:3472` for spacing, typography, borders, radii, icons, RTL alignment, toolbar, filters, cards, pagination, and empty state.
- [ ] List View is intentionally inferred from the shared visual system and is included in the comparison.
- [ ] Dark-mode Figma nodes remain out of scope.

## 15. Verification

- [ ] `git diff --check` completes successfully.
- [ ] `pnpm lint` completes successfully.
- [ ] `pnpm exec tsc --noEmit` completes successfully.
- [ ] `node --test tests/student-scholarship-discovery.test.mjs` completes successfully.
- [ ] `pnpm build` completes successfully.
- [ ] Actual test results plus RTL/LTR, responsive, and Figma-convergence evidence are recorded in Feature 005 verification documentation.

CHECKLIST READY FOR /speckit.implement
