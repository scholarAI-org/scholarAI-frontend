# Feature Specification: Student Scholarship Discovery

**Feature Branch**: `005-student-scholarship-discovery`  
**Created**: 2026-09-28  
**Status**: In progress — foundation implemented  
**Input**: Authenticated student scholarship search and discovery at Figma node
`2262:3331` (Search — 2 col), with its empty state at `2264:3472`.

## Summary

Provide an authenticated student's bilingual, responsive scholarship-discovery
page. It lists only the backend's student-visible published opportunities and
uses server-side search, filtering, sorting, and pagination. Students can
choose a grid or compact list representation, save or unsave an opportunity,
and navigate to its existing-or-to-be-confirmed student details route.

This feature is light theme only. Figma samples are visual references, never
application data.

## Existing-Codebase Findings and Decisions

| Area                         | Finding / decision                                                                                                                                                                                                                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Student route and protection | `src/app/[locale]/student/layout.tsx` provides the student `RoleGuard`; the discovery page belongs beneath it.                                                                                                                                                                                                    |
| Student shell                | There is no shared Student Shell today. The profile route composes `ProfileLayout`, `Navbar`, and `Sidebar` locally. Feature 005 owns introducing the first reusable Student Shell—not a page-specific copy—while reusing existing auth/session/i18n primitives.                                                  |
| Scholarship details          | No student scholarship-detail route exists, but OpenAPI confirms `GET /api/scholarships/{scholarship_id}` for a student-visible numeric ID. The canonical route is `/[locale]/student/scholarships/[id]`.                                                                                                         |
| API and auth                 | Use `apiClient`. Browser calls go through the same-origin `/backend` proxy, so the auth cookie stays first-party; server calls use `BACKEND_URL`. No per-feature auth client or token storage.                                                                                                                    |
| Server state                 | The project uses TanStack React Query with typed feature API functions and query-key factories. Discovery must follow that pattern.                                                                                                                                                                               |
| Routing/locales              | Use `Link` and router utilities from `@/i18n/navigation`, with internal unprefixed paths. Messages use `next-intl` JSON catalogues.                                                                                                                                                                               |
| Countries                    | `GET /api/scholarships/filter-options` is the sole authoritative country-options source for discovery. It returns the stored display/query strings from the currently student-visible discovery population. Display and submit each returned string unchanged; repeated `country` parameters retain OR semantics. |
| OpenAPI                      | `docs/api/openapi.json` is checked in and is the source of truth. It confirms student-visible discovery/details/save/filter-options routes, repeated-filter behavior, exact country matching, and supported sorts.                                                                                                |

## Scope Boundaries

### Supported discovery functionality now

- `GET /api/scholarships/` with server-side search, filters, supported sort,
  page, and page size.
- Grid and List View over the same normalized records.
- Saved state from `is_saved`, with real save/unsave mutations.
- Dynamic count, pagination, empty, loading, background-refresh, and error
  states.
- Arabic RTL and English LTR, responsive desktop/tablet/mobile behavior.

### Frontend work required now

- Shared/reusable Student Shell integration and active scholarship-search item.
- Discovery route, URL-backed canonical query state, typed API/domain layer,
  React Query hooks, responsive controls/cards, and localized messages.
- A small functional student-detail route boundary for the Details CTA, without
  implementing the subsequent full details Figma experience.

### Recommendation seams prepared now

- A normalized `ScholarshipCardModel`, separate from raw discovery API data.
- Optional `match` data and a dedicated badge slot which renders nothing in
  the absence of authoritative data.
- Typed sort-option configuration that can later add an unavailable `match`
  option without rewriting view components.

### Deferred

- Recommendation/match backend, client-side compatibility calculation,
  recommendation scores/reasons/coverage, and match sorting.
- Dark mode, application tracking, notifications, scraper/admin workflows,
  and document enhancement.

## User Stories and Acceptance Scenarios

### User Story 1 — Discover scholarships (P1)

As a signed-in student, I can browse the real currently available scholarships
that the backend makes visible to me.

1. Given a successful response, when the page opens, then it renders `items`
   only and shows the server-provided `total`, rather than Figma examples.
2. Given a wide screen, results appear in two columns beside filters; on a
   narrow screen they appear in one column and filters are available in a
   usable drawer/panel without horizontal overflow.
3. Given nullable fields, cards omit unavailable metadata gracefully, show a
   project-consistent image fallback, and never invent a university, funding,
   deadline, or match value.

### User Story 2 — Search, filter, sort, and clear (P1)

As a student, I can refine the server result set and share or refresh the same
result state.

1. Given I type a nonblank query, when its sensible debounce expires, then
   the URL and request use trimmed `search` and reset `page` to 1.
2. Given I enter only whitespace, then no meaningless `search` query is sent.
3. Given selections within and across filter groups, then they are represented
   canonically in URL state and sent through the documented backend semantics;
   a change resets page 1.
4. Given I choose newest or deadline-soon, then only the corresponding
   supported backend `sort` value is requested. No highest-match option or
   local ranking is shown.
5. Given I activate Clear all, then all filters (including countries) and
   `page` reset while search, sort, and the Grid/List preference remain
   unchanged. Rationale: the button lives in the filter panel, and the empty
   state offers "edit search" and "clear filters" as separate actions.

### User Story 3 — Change presentation and navigate results (P1)

As a student, I can toggle between equivalent grid and list representations and
move through the server's result pages.

1. Given results are loaded, toggling Grid/List changes presentation only: it
   preserves query state, current page, and loaded data and makes no discovery
   request.
2. Given `total_pages` exceeds a small window, pagination renders an accessible
   bounded window with ellipses, not every page; it follows server page bounds.
3. Given a changed filter/search makes a page invalid, the UI reconciles to a
   valid returned page without looping or displaying misleading data.
4. Given a details CTA is used, it uses locale-aware navigation and the
   authoritative student-detail identifier/route, never a guessed slug route.

### User Story 4 — Save scholarships (P1)

As a student, I can save and remove a saved scholarship with immediate,
truthful feedback.

1. Given an unsaved item, activating Save makes one `POST
/api/scholarships/{id}/save` request and exposes a pending state.
2. Given a saved item, activating Remove saved makes one `DELETE
/api/scholarships/{id}/save` request.
3. Given an optimistic update fails, the card returns to its authoritative
   prior state and presents a localized error; success updates discovery and
   any existing saved-scholarship cache.

### User Story 5 — Understand non-happy states (P1)

As a student, I receive an accurate state while data changes or cannot load.

1. Initial loading shows Grid/List-appropriate skeletons; background changes
   preserve usable previous results when React Query supports it.
2. A zero-result response shows the supplied localized empty-state intent and
   real actions to change search or clear filters—never fallback scholarships.
3. Network/server, 401, 403, and 422 failures follow global API/auth/error
   conventions and do not masquerade as empty results.

## Functional Requirements

### Route, state, and API

- **FR-001**: Add the discovery page beneath `/[locale]/student`, inheriting
  existing student role protection and shared Student Shell behavior.
- **FR-002**: Use one canonical, URL-search-param-backed discovery query state:
  `search`, academic levels, funding types, countries, opportunity types,
  `sort`, and `page`. URL parsing must validate, normalize, and omit
  defaults/empty values deterministically. `page_size` is fixed at 20, is added
  only to the backend discovery request, and is not browser URL state,
  Back/Forward state, or a user-editable value.
- **FR-003**: Grid/List is separate presentation state. It may be session/local
  preference only if consistent with project conventions; it MUST NOT alter an
  API query or reset discovery state.
- **FR-004**: Fetch only `GET /api/scholarships/` for discovery, passing only
  valid documented query parameters. Do not filter a single returned page in
  the browser.
- **FR-005**: Typed API functions must forward React Query abort signals, use
  `apiClient`, encode repeated selected values according to confirmed OpenAPI
  semantics, and expose `items`, `total`, `page`, `page_size`, `total_pages`.
- **FR-006**: Use these API mappings, subject to deployed OpenAPI confirmation:
  bachelor→`bachelor`, master→`master`, PhD→`phd`, exchange→`exchange`;
  fully funded→`full`, partially funded→`partial`; scholarship→`scholarship`,
  academic exchange→`academic_exchange`, research/fellowship→
  `research_fellowship`, training→`training`; sort newest→`newest`, deadline
  soon→`deadline_soon`.
- **FR-007**: Country UI must obtain options only from `GET
/api/scholarships/filter-options`. It displays each returned string and sends
  it unchanged through repeated `country` query parameters. It supports zero,
  one, or multiple selections; URL restoration/Back/Forward; page reset on
  change; and clear-all. Filter-options loading, empty, and unavailable/retry
  states are independent of discovery, so a failed options request never
  prevents scholarship results from remaining usable.

### Domain model and cards

- **FR-008**: Normalize raw API data once at the feature boundary into a
  nullable-safe `ScholarshipCardModel` with ID, localized title selection,
  provider/university, country, study level, funding/opportunity type, image,
  deadline/no-deadline, saved state, and optional match data.
- **FR-009**: The extensible model contains `match?: { score?: number | null;
level?: 'high' | 'medium' | 'low' | null; reasons?: string[]; coverage?:
number | null } | null`. No browser code calculates or defaults those values.
- **FR-010**: Grid cards include available image, funding badge, title, country,
  level, deadline/remaining time, bookmark, Details CTA, and an empty-safe
  future MatchBadge slot. Desktop grid has two main-result columns.
- **FR-011**: List cards use the same model and actions in a compact horizontal
  hierarchy, preserving image, title, key metadata, funding, deadline, save,
  details, and optional empty-safe MatchBadge slot.
- **FR-012**: `no_deadline` displays localized “No deadline”. A valid deadline
  (a `YYYY-MM-DD` calendar date compared with the student's local day) shows
  the locale-formatted date plus: nonnegative days left when it is in the
  future, “Closes today” when it is today, or “Deadline passed”
  (“انتهى موعد التقديم”) when it is in the past; a countdown is never negative.
  A missing or malformed deadline shows localized “Deadline not specified.”

### Saving, pagination, and states

- **FR-013**: Save mutations call only the real specified POST/DELETE routes,
  prevent duplicate submissions, safely roll back failures, and update/invalidate
  discovery and an existing saved-list cache without localStorage persistence.
- **FR-014**: Pagination uses response `page`, `page_size`, and `total_pages`.
  Search/filter/sort updates reset to page 1; changing views does not.
- **FR-015**: Header count derives exclusively from `response.total` using
  localized plural-aware copy.
- **FR-016**: Initial/loading, refresh, empty, malformed-card, save-pending,
  save-error, request-error, 401, 403, and 422 paths must be accurate and
  accessible. Existing global auth/error behavior takes precedence.

### Presentation, localization, and accessibility

- **FR-017**: Implement the Figma light design using project conventions, not
  static sample content or expiring Figma asset URLs. Download only stable
  assets needed by the interface; use real scholarship images when present.
- **FR-018**: All new visible and accessible strings require Arabic and English
  `next-intl` keys. Arabic is RTL and English LTR; use logical layout/alignment
  for icons, filter drawer, metadata, actions, sort, and pagination.
- **FR-019**: Use semantic labelled search, checkbox/filter controls,
  select/combobox controls, buttons, links, and pagination navigation. View
  toggle buttons expose accessible names and `aria-pressed`. Bookmark labels
  are “Save scholarship” / “Remove saved scholarship” independent of icon.
- **FR-020**: Desktop keeps sidebar plus two-column results; tablet adapts or
  collapses filters; mobile provides a semantic accessible filter drawer/panel
  and one card per row. Keyboard focus/order must remain reliable.

## Test Requirements

Automated tests must cover successful API-backed discovery; exact student
endpoint use; trimmed/debounced search; each academic/funding/country/type
filter and multiple/combined selections; clear all; supported sorts; dynamic
count/pagination; grid/list rendering and no refetch/state loss on switch;
save, unsave, pending, and rollback; details navigation; all deadline and
nullable-field behavior; no image; empty/loading/network/error states; Arabic
RTL and English LTR; keyboard navigation; accessible names/pressed states; and
responsive presentation.

They must also prove that cards hide absent match data, can render authoritative
future match data passed into the normalized model, never invent matching data,
and can accept a future typed match sort configuration without Grid/List
rewrites.

## Explicit Non-Requirements

- Dark-mode classes, theme-system refactors, and dark Figma convergence.
- A mock or production recommendation service, AI matching, compatibility
  scoring, fake percentages/reasons, or highest-match ordering.
- Client-side duplicate filtering/ranking of a server result page.
- Figma sample scholarships, static fake countries, localStorage saves, or a
  second student-auth/shell/navigation system.

## Clarified Architecture Decisions

### 1. Student Shell ownership

Feature 005 introduces the first reusable `StudentShell` infrastructure. It
owns only shared presentation and navigation: desktop sidebar, responsive
header, mobile navigation/drawer behavior, active-route display, and the
shared content frame. It reuses `RoleGuard`, `AuthProvider`, locale routing,
and the existing profile identity data/hooks; it does not create a new auth,
session, or profile-state architecture.

Desktop presents the sidebar and header around route content. Mobile replaces
the sidebar with a keyboard-accessible menu/drawer and keeps the identity,
language control, and navigation reachable. The header may use real name,
avatar, or derived initial when available. It must not invent notification
counts. It omits the Figma theme control because there is no functional theme
infrastructure.

Only implemented destinations are interactive: Profile and this discovery
route. Unimplemented Figma destinations are omitted from navigation until a
real route exists; they are neither links to 404 nor empty placeholder pages.

### 2. Details CTA boundary

Discovery links Details with the numeric `id` to
`/student/scholarships/[id]`. Feature 005 includes only the minimum functional
route boundary necessary to keep that link truthful: validate the positive
integer ID; call `GET /api/scholarships/{scholarship_id}`; render authentic
loading, 401/403/404/error states and a compact, accessible factual summary
from the response with a back-to-discovery action. Details show plain-text
fields only; `description_html` is never rendered in this feature. It must not create sample
content, a separate detail API, or the full scholarship-details Figma screen.
A following student-details feature owns the complete visual and interaction
experience, reusing this route and query.

### 3. Grid/List presentation state

List View is in scope and is designed from the grid visual system and shared
shell. Grid and List consume the exact same `ScholarshipCardModel`; they retain
image, title, country, available provider/university, study level, funding,
deadline, save, Details, and the future empty-safe match slot. View choice is
in-memory UI state because the repository has no local-preference convention.
It is not URL state and changing it must not reset or refetch discovery.

### 4. URL-state contract

Discovery URL state is canonical and refreshable. Use repeated query keys for
multi-selects, for example `academic_level=bachelor&academic_level=master`,
and likewise for `funding_type`, `opportunity_type`, and `country`. Use scalar
`search`, `sort`, and `page`; the feature uses a fixed configured page size of
20, so `page_size` is not user URL state.

Parsing trims enum values and search, collapses internal search whitespace,
keeps country values exactly as returned by filter-options (dropping only
blank ones), deduplicates values, discards invalid/unknown values, discards blank search, and maps
an invalid/nonpositive page to 1. Repeated values mean OR within that filter;
different filter groups mean AND, per OpenAPI. URL changes drive the query, so
browser Back/Forward restores effective search/filter/sort/page state. The
debounced text input is only transient input state; when it becomes effective,
it updates URL search and page 1. Filter or sort changes also set page 1.

### 5. Sort contract

Expose two localized options only: “Newest” / “الأحدث” → `newest`, and
“Deadline soon” / “الأقرب موعداً” → `deadline_soon`. `deadline_soonest` is
accepted only when reading legacy/backend-compatible URLs and normalizes to
`deadline_soon`; it is never emitted. Highest-match is absent until its backend
contract exists.

### 6. Recommendation seam

Cards carry an optional `match` field shaped as in FR-009:
`{ score?, level?, reasons?, coverage? } | null`. Eligibility is not part of
this type in Feature 005.

- Match data is provided by the backend only. Feature 005 has no backend
  source, so the adapter sets `match` to `null`.
- Browser code never calculates, estimates, or defaults any match value.
- `ScholarshipMatchBadge` renders nothing when `match` is absent or `null`.
- No match sort is exposed. The typed sort-option config can accept a future
  `match` option without changing Grid/List components, but it stays hidden
  until a backend contract exists.
