# Implementation Plan — Student Scholarship Discovery

## 1. Objective

Deliver authenticated, backend-driven scholarship discovery from Figma nodes
`2262:3331` and `2264:3472`: reusable Student Shell, search/filter/sort,
Grid/List, real bookmarks, and a minimal factual details boundary. Light mode only.

## 2. Confirmed Routes

- `/[locale]/student/profile` — existing profile inside shared shell.
- `/[locale]/student/scholarships` — discovery.
- `/[locale]/student/scholarships/[id]` — minimal details boundary.

`src/app/[locale]/student/layout.tsx` remains a thin Server Component: retain
`RoleGuard` and render feature-owned `StudentShell` around `{children}`. Route
pages also remain Server Components by default and delegate to feature UI.

## 3. Final File and Module Structure

```
src/features/student/
  layout/{StudentShell,StudentHeader,StudentSidebar,StudentMobileNavigation}.tsx
  layout/{student-navigation,types}.ts
  scholarship-discovery/
    api/scholarships.ts
    adapters/scholarship.ts
    components/{ScholarshipDiscoveryPage,DiscoveryToolbar,DiscoveryFilters,MobileDiscoveryFilters,ScholarshipResults,ScholarshipGridCard,ScholarshipListRow,ScholarshipMatchBadge,ScholarshipSkeletons,DiscoveryEmptyState,DiscoveryErrorState,DiscoveryPagination,ScholarshipDetailsBoundary}.tsx
    hooks/{useDiscoveryQueryState,useScholarshipDiscovery,useScholarshipBookmark,useScholarshipFilterOptions,useScholarshipDetail}.ts
    lib/{discovery-query-state,deadlines,pagination}.ts
    {constants,query-keys,types}.ts
src/app/[locale]/student/scholarships/{page.tsx,[id]/page.tsx}
```

One hook per file. Routes are thin. Profile retains its forms/domain logic; only its outer frame
is inherited from the shared route layout.

## 4. Server and Client Boundaries

Locale layout continues to provide next-intl, QueryClient, and auth. Route
layouts/pages remain server by default. Client boundaries are limited to
interactive StudentShell pieces, profile shell adapter, discovery page,
URL-state/query/mutation consumers, debounce, filters, toggle, drawers,
bookmark controls, pagination, and details boundary.

## 5. Student Shell Architecture

`src/features/student/layout` owns shared presentation only: desktop
sidebar/header/content frame, mobile header/navigation drawer, active routes,
and typed navigation. It reuses auth, profile identity, locale, primitives and
tokens; it introduces no auth/session store. The RTL sidebar uses logical
inline-end. Mobile drawer is labelled, keyboard operable, Escape-dismissible,
focus managed, and returns focus to its trigger. No fake notification count or
theme control is added.

## 6. Student Navigation Behavior

Navigation config contains id, localized key, icon, href, enabled, and route
match. Only Profile and Search Scholarships are interactive. Future Figma
destinations are omitted—not disabled links, 404 links, or placeholder pages.
Discovery and detail descendants activate Search.

## 7. URL Query-State Architecture

URL is canonical for `search`, repeated `academic_level`, `funding_type`,
`opportunity_type`, `country`, `sort`, and `page`; fixed `page_size=20` is sent
but not URL-owned. Use repeated URLSearchParams values (OR within a group; AND
between groups). Trim/dedupe arrays, collapse whitespace, omit blank search,
discard unknown enums, normalize `deadline_soonest` to `deadline_soon`, and
normalize invalid/nonpositive page to 1. URL parsing/serialization is one
feature utility; Back/Forward restores state.

## 8. Search Debounce

A local input draft is transient only: initialize/resync from URL search, wait
about 300ms, then `router.replace` normalized search and page 1. Filter/sort
changes reset page 1; pagination changes page only. No second canonical state.

## 9. API Layer

`api/scholarships.ts` exclusively uses `apiClient`, typed response parsing, and a request serializer for `GET /api/scholarships/`, `GET /api/scholarships/filter-options` (`getScholarshipFilterOptions`), `GET /api/scholarships/{id}`, POST save, and DELETE save. Only the GET functions accept a React Query `AbortSignal`; save and unsave type their responses as `SavedScholarshipResponse` and `UnsaveScholarshipResponse`. It defines `ScholarshipDiscoveryFilterOptionsResponse` with `countries: string[]` and a separate `ScholarshipDetailsResponse` matching the OpenAPI detail schema. UI components never build backend URLs or call admin APIs.

## 10. Query-Key Hierarchy

```
studentScholarshipKeys.all
studentScholarshipKeys.discoveries()
studentScholarshipKeys.discovery(query)
studentScholarshipKeys.details()
studentScholarshipKeys.detail(id)
studentScholarshipKeys.savedLists()
studentScholarshipKeys.saved()
studentScholarshipKeys.filterOptions()
```

`discovery(query)` contains normalized backend-affecting discovery state only;
use v5 `placeholderData: keepPreviousData` and no retry for 401/403/422.
`filterOptions()` is independent of discovery filters, search, page, sort, and
view mode. Grid/List is presentation-only state and is never included in any
React Query key; a presentation change alone never refetches discovery or
filter options. `saved()` takes no paging parameters because
`GET /api/scholarships/saved` returns one unpaged array.

## 11. API Adapter / Normalized Card Model

Adapt raw nullable API cards once to `ScholarshipCardModel`: localized title
(`title_ar` Arabic, `title_en` English, then title), trimmed metadata, usable
image, country, level/funding/type, deadline/no-deadline, and saved state. UI
uses only this model and never invents missing data. A blank title becomes
`undefined`; the UI shows a translated fallback.

Details use their own adapter over `ScholarshipDetailsResponse`. It normalizes
the list-or-string fields `majors`, `eligibility_criteria`, and
`required_documents` into `string[]`.

## 12. Recommendation Seam

Optional `match?: ScholarshipMatchInfo | null` supports `score`, `level`, `reasons`,
and `coverage` later. Eligibility is not part of the match type in this feature. Feature 005 supplies none; MatchBadge returns
null. No mock endpoint, percentage, explanation, highest-match sort, or
browser-side compatibility calculation exists.

## 13. Discovery Page Composition

`ScholarshipDiscoveryPage` renders content inside the shell: heading/count,
toolbar, filters, results, and pagination. Count comes only from response total
through localized plural messages.

## 14. Grid View

Desktop main content renders two cards per row. Cards show only real available
image/fallback, funding badge, title, metadata, deadline/remaining text,
bookmark, Details, and empty-safe MatchBadge slot.

## 15. List View

List View is required, compact, and uses exactly the same model/query/actions:
thumbnail, title, available provider/university/country/level/funding/deadline,
bookmark, Details, and match slot. It has no independent fetching or logic.

## 16. Grid/List Toggle

Two labelled buttons expose `aria-pressed`. View is in-memory state; switching
preserves query/filter/sort/page/data and triggers no URL or discovery refetch.

## 17. Filters

Desktop sidebar uses labelled checkbox groups for academic level, funding, and
opportunity type. Typed config maps labels to backend enums; no Figma samples
are selected. Clear all resets search, filters, sort default, and page while
retaining view mode.

## 18. Country Data Source

`GET /api/scholarships/filter-options` is the sole country-options source. `useScholarshipFilterOptions` queries it with `studentScholarshipKeys.filterOptions()` and a longer sensible stale time than discovery because values change less often. It depends on no search, page, selection, sort, or Grid/List state; switching views never refetches it.

The Country selector displays each returned `string` truthfully and sends that same string unchanged in repeated `country` parameters. It supports zero, one, and many selections, URL restoration/Back/Forward, page reset on a change, and clear-all. Its loading, non-empty, empty, and unavailable/retry states are independent: a filter-options failure leaves discovery results usable.

## 19. Mobile Filters

Reuse the same filter groups/URL callbacks in a labelled modal drawer with
clear/apply/close behavior, Escape/focus handling, and no duplicate state.
Opening or closing alone does not fetch.

## 20. Sorting

Typed localized options are only Newest → `newest` and Deadline soon →
`deadline_soon`. Read-only compatibility alias `deadline_soonest` normalizes;
it is never emitted/displayed. Highest match is unavailable. Sort
options come from a typed config that can later accept a `match` option without
exposing it now.

## 21. Bookmark Mutation / Cache Strategy

One per-ID pending guard chooses real POST/DELETE from `isSaved`. Optimistically
snapshot/update only discovery caches containing the ID, `detail(id)`, and
saved-list caches; roll back exactly those snapshots on failure. On settlement,
invalidate/refetch only relevant `discoveries()`, `detail(id)`, and `savedLists()`
families—never `all` or unrelated student queries. Controls expose pending and
truthful failure feedback.

## 22. Result Count

Use response `total`, never Figma samples; next-intl Arabic/English plural copy
renders the subtitle.

## 23. Pagination

Use server page/page_size/total_pages. Render bounded first/last/ellipsis window,
Previous/Next, disabled states, labelled nav, and `aria-current`. Page is
URL-owned. Reconcile an invalid response page once with a valid URL boundary.

## 24. Deadline Handling

Validate date-only values defensively. `no_deadline` displays localized No
deadline; valid UTC-formatted dates yield nonnegative remaining text. Missing or
malformed deadline displays localized Deadline not specified.

## 25. Image Strategy

Scholarship image hosts are arbitrary backend-provided hosts, so runtime images
use native accessible `<img>`: meaningful alt text, lazy loading, stable aspect
ratio, malformed-URL handling, load-error handling, and a local neutral
placeholder. Never use Figma sample images as runtime fallbacks. The current
Next ESLint preset reports `@next/next/no-img-element` as a warning; if needed,
use only a narrowly documented component-level suppression around the scholarship
backend-image component. Do not disable the rule or modify ESLint globally, add
a broad arbitrary-host `next.config` allowlist, or migrate this feature to Next
Image solely to address the warning.

## 26. Empty / Loading / Error States

Grid/List skeletons match active view; background refresh preserves usable data
with busy status. Empty distinguishes no available scholarships from no matches
and provides real edit-search/clear actions matching Figma intent. Handle
401/403 via existing auth behavior, 422 truthfully, generic retryable failure,
malformed cards safely, and bookmark failures locally. Never use fake records.

## 27. Minimal Scholarship Details Route

`[id]/page.tsx` renders client `ScholarshipDetailsBoundary`, validates a positive
numeric ID, and enables real detail query only then. It renders loading, existing
auth behavior for 401/403, truthful 404, generic retryable error, factual
plain-text title/provider/university/country/level/funding/deadline/bookmark
state, and
locale-aware Back to discovery. It shares `detail(id)` bookmark coherence and
fabricates no match, eligibility, application, or tracking information.
`description_html` is never rendered in this feature.

## 28. Responsive Behavior

At `lg`, show sidebar/header, filters and two-column Grid/full List. Below `lg`,
move filters to trigger/drawer and adapt cards. At `sm`, use mobile navigation,
one Grid column, wrapping compact List, drawer, stacked toolbar and compact
pagination. Logical sizing/gaps prevent horizontal overflow.

## 29. Internationalization

Before StudentShell or discovery UI work, add Arabic/English `StudentLayout`, `StudentScholarshipDiscovery`, and `StudentScholarshipDetails` namespaces for all anticipated visible and ARIA copy. This includes navigation/shell, search, filters and country loading/unavailable states, sort, Grid/List, cards, bookmarks, details, counts, pagination, every data state, both dialogs, and accessibility labels. No UI task may introduce temporary hard-coded strings. The later i18n phase audits completeness, copy quality, plurals, RTL/LTR, and labels.

## 30. Accessibility

Use labelled search, fieldsets/legends/checkboxes, labelled country/sort
controls, pressed view buttons, semantic card links/bookmark buttons, labelled
pagination, and appropriate live regions. Navigation/filter drawers are
labelled modal dialogs with keyboard behavior, Escape, initial focus, trap, and
focus return. Preserve visible focus and logical reading order in both directions.

## 31. Figma Convergence Workflow

Load design-to-code skill before Figma context calls. Inspect and screenshot
`2262:3331` and `2264:3472`, map dimensions/type/spacing/borders/radii/icons to
tokens, build real-data behavior first, then compare Arabic desktop and separate
responsive states. Download stable assets only; never ship MCP URLs. Dark nodes
are out of scope.

## 32. Testing Strategy

Unit tests in `tests/student-scholarship-discovery.test.mjs`: query parsing,
serialization, repeated filters, invalid normalization, enum handling, adapter,
deadline helpers, pagination window.

Integration/component tests with the repository-equivalent harness: search
debounce, URL updates/back-forward where testable, filters/clear/sort/pagination,
Grid/List toggle and no view-only refetch, Grid/List nullable fields/count,
empty/loading/error, optimistic bookmark/rollback/targeted caches, mobile
filters, details boundary, locale behavior, and accessibility controls.

Recommendation tests prove no default match/fake badge, authoritative enriched
fixture rendering, and no browser-side score calculation. Verify with `pnpm lint`,
`node --test tests/student-scholarship-discovery.test.mjs`, and `pnpm build`.

## 33. Implementation Phases

1. Contract/types/query-state foundation.
2. Early i18n scaffolding and Student Shell integration.
3. Discovery API, filter-options, and adapter.
4. Toolbar and filters.
5. Grid/List results.
6. Bookmark mutations.
7. Pagination/loading/empty/error states.
8. Responsive/mobile behavior.
9. Minimal details boundary.
10. i18n/accessibility.
11. Figma visual convergence.
12. Tests and verification.

## 34. Risks and Mitigations

| Risk                              | Mitigation                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| StudentShell regresses Profile    | Incremental shell extraction; retain profile ownership and test route.             |
| URL/debounce drift                | One normalizing parser; transient draft resyncs from URL.                          |
| Display vs backend enums          | Typed mapping and serializer tests.                                                |
| Filter-options temporary failure  | Isolated query with localized unavailable/retry control; discovery remains usable. |
| Arbitrary image hosts             | Native fallback; no unbounded allowlist.                                           |
| Bookmark drift / stale saved list | Targeted snapshots, rollback and narrow invalidation.                              |
| Invalid page after count change   | One-time URL reconciliation.                                                       |
| Nullable/malformed data           | Adapter and neutral fallbacks.                                                     |
| Details scope creep               | Factual boundary; future feature replaces body.                                    |
| Match API changes                 | Optional adapter seam; no mock.                                                    |
| No List Figma                     | Preserve Grid hierarchy; verify readability.                                       |
| Responsive RTL regression         | Logical CSS and Arabic desktop/mobile checks.                                      |

## 35. Explicit Deferred / Out of Scope

Dark mode/theme refactor; full scholarship-details design; recommendation
backend/highest-match/client scoring; fake notifications; application tracking;
document enhancement; and future placeholder student pages.
