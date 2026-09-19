# Tasks: Admin Dashboard

**Feature**: `002-admin-dashboard`  
**Plan**: [plan.md](./plan.md)  
**Specification**: [spec.md](./spec.md)

## Phase 1: Confirm Boundaries and Data Layer

- [x] T001 Review the completed Admin Shell, `AdminHeader`,
      `AdminPageHeader`, dashboard route, `apiClient`, `useAuth`, and existing React
      Query conventions; do not change shell ownership or auth behavior.
- [x] T002 Reinspect Figma node `2890:9831`, identifying only visual hierarchy
      and assets for backend-supported dashboard content; record unsupported cards,
      actions, and sample data as exclusions.
- [x] T003 Create `src/features/admin/dashboard/types.ts` for statistics,
      recent-pending-scholarships, and audit-log response/item contracts including
      nullable fields; do not add monthly-activity types.
- [x] T004 Create `src/features/admin/dashboard/query-keys.ts` with a stable
      `['admin', 'dashboard']` root and independent keys for statistics,
      pending-list limit, and audit limit/offset/action parameters.
- [x] T005 Create `src/features/admin/dashboard/api/dashboard.ts` with
      `apiClient`-based, cookie-authenticated GET functions for statistics, bounded
      pending scholarships, and bounded audit logs; forward `AbortSignal` and use
      `URLSearchParams` for query strings.
- [x] T006 Confirm no dashboard request uses Bearer headers, browser token
      storage, `/admin/profile`, or `/admin/dashboard/monthly-activity`.

## Phase 2: Queries, Messages, and Formatting

- [x] T007 Create independent React Query hooks for statistics, recent pending
      scholarships, and audit logs under `src/features/admin/dashboard/hooks/`.
      Do not retry `401` or `403` responses as transient failures. Use only a
      bounded retry strategy for appropriate network/server failures, and do not
      duplicate AuthProvider/RoleGuard redirect or session-expiry behavior.
- [x] T008 Define dashboard preview limits as feature-level constants:
      recent pending scholarships = 5 items and audit logs = 4 items, both
      within the documented backend limits. Use audit offset zero and expose
      no pagination/full-history behavior in this feature.
- [x] T009 Add `AdminDashboard` Arabic and English messages for welcome content,
      supported metric labels, sections, field labels, no-deadline/unavailable text,
      status fallbacks, loading, empty, errors, and retry controls.
- [x] T010 Create `src/features/admin/dashboard/lib/formatters.ts` with pure,
      locale-aware number/date-time formatting plus guarded source-domain extraction
      and nullable/deadline handling helpers.
- [x] T011 Verify formatter behavior for invalid/absent ISO values, nullable
      source URLs, `no_deadline`, and unknown status/action values without embedding
      Arabic or English UI copy in helpers.

## Phase 3: Dashboard Sections

- [x] T012 Create `DashboardWelcome` using only `useAuth` identity and localized
      copy. Derive the current date at runtime and format it with the active
      locale using the shared dashboard formatting utilities. Do not fetch
      `/admin/profile`, hard-code an administrator or example date, or add a
      manual-scholarship/scraper action.
- [x] T013 Create `DashboardStatCard` for supported semantic metric
      presentation, using existing tokens and only faithful existing/Figma assets.
- [x] T014 Create `DashboardStats` with its own statistics query and localized
      loading, retryable error, and success states. Render exactly three truthful
      cards for pending scholarships, published scholarships, and total platform
      accounts/users. Treat zero values as valid statistics, never as missing or
      empty data. The users metric must preserve the backend semantics: it
      includes administrators and inactive accounts and must never be labelled
      as active/monthly users.
- [x] T015 Create `RecentPendingScholarships` with an independent query and
      section-level loading, retryable error, empty, and success states.
- [x] T016 Create `RecentPendingScholarshipsTable` for desktop semantic table
      rendering, using backend item IDs as keys and real title, organization,
      source, status, deadline, and scrape fields only when available.
- [x] T017 Add the narrow-screen recent-scholarship card/list presentation with
      labelled fields; omit Review and all unimplemented links/actions.
- [x] T018 Create `DashboardAuditLog` with an independent query and localized
      loading, retryable error, empty, and success states, using backend action/
      action-display, actor, entity, and timestamp fields safely.
- [x] T019 Extract a shared section-state component only if it removes genuine
      duplicate loading/error/empty behavior without owning dashboard-specific copy.

## Phase 4: Route Composition and Visual Integration

- [x] T020 Replace the placeholder in `src/app/[locale]/admin/dashboard/page.tsx`
      with thin dashboard composition: welcome, statistics, recent pending
      scholarships, and audit logs.
- [x] T021 Preserve the existing shell-owned dashboard heading; do not render a
      duplicate `AdminPageHeader` or modify sidebar/header/RoleGuard code.
- [x] T022 Implement responsive dashboard layout with semantic grid/flex/table
      patterns: three statistics columns on wide viewports, then two/one columns;
      readable recent-data content at narrow widths.
- [x] T023 Apply Figma visual intent—section order, card surface, spacing,
      typography hierarchy, borders, and emphasis—using existing design tokens;
      do not copy Figma absolute coordinates or sample values.
- [x] T024 Download and commit a genuine Figma asset only if a supported visual
      has no faithful existing project asset/icon; do not author replacement SVGs.
- [ ] T025 Verify the dashboard contains no unsupported reports/comments card,
      scraper/source-health content, run-collection behavior, review workflow,
      or full audit-log link. Manual scholarship creation is allowed only as a
      locale-aware navigation action to the implemented
      `003-admin-manual-scholarship` route.

## Phase 5: Verification

- [x] T026 Verify each API section independently: success, loading, retryable
      error, empty result, and partial failure alongside a successful sibling
      section.
- [x] T027 Verify all rendered values map exactly to backend semantics and no
      Figma sample person, date, scholarship, domain, source status, audit event,
      count, or health value ships as application data.
- [x] T028 Verify pending scholarship nullable-field fallbacks, URL validation,
      no-deadline precedence, status presentation, and stable ID keys.
- [x] T029 Verify audit-log action/action-display fallbacks, nullable identifiers,
      unknown future actions, timestamps, and stable ID keys.
- [x] T030 Verify Arabic/RTL and English/LTR number/date formatting, reading
      order, table/card behavior, responsive statistic grid, keyboard retry
      controls, safe external links, and accessible status indicators. External
      links opened in a new tab must use the project's safe rel behavior
      (`noopener noreferrer`) where applicable.
- [x] T031 Compare supported dashboard content against Figma node `2890:9831` at
      the desktop reference and narrow viewport sizes; correct meaningful hierarchy
      or proportion differences without screenshot-specific positioning.
- [x] T032 Run `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`; document
      the existing external-font/network build blocker if it persists.
- [x] T033 Complete the [dashboard implementation checklist](./checklists/implementation-quality.md)
      and document any accepted exception.

## Dependency Order

`T001–T006` → `T007–T011` → `T012–T019` → `T020–T025` → `T026–T033`

Dashboard section tasks can proceed in parallel after Phase 2. Route composition
depends on the section components; validation starts after composition is
complete.

## Out of Scope

- Admin Shell/layout or authentication changes.
- Monthly activity.
- Admin profile enrichment.
- Scholarship review/edit workflows.
- Scholarship CRUD or creation workflow implementation inside the Dashboard.
- Scraper controls or scraper/source health.
- Reports/comments management.
- Notifications management.
- Full audit-log browsing/page.
- Manual-scholarship form implementation; this is owned by
  `003-admin-manual-scholarship`.

The Dashboard IS responsible for exposing the localized
"Add scholarship manually" navigation CTA once
`003-admin-manual-scholarship` provides the destination route.

The CTA navigates to:

`/admin/scholarships/new`

The Dashboard must not embed or duplicate the creation form itself.
