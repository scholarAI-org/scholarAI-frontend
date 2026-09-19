# Feature Specification: Admin Dashboard

**Feature Branch**: `002-admin-dashboard`  
**Created**: 2026-09-17  
**Status**: Draft  
**Input**: Build the dashboard-specific content for `/[locale]/admin/dashboard`
from Figma node `2890:9831`, using only supported backend dashboard APIs.

## Summary

Implement the read-oriented administrator dashboard inside the existing Admin
Application Shell. The page presents authenticated-admin context, supported
platform statistics, recent pending scholarships, and recent audit events using
backend data as the source of truth.

The shell itself—sidebar, shared header controls, `RoleGuard`, auth state,
logout, locale switching, and navigation—is owned by feature
`001-admin-application-shell` and is not rebuilt by this feature.

## Clarifications

### Supported Data and Figma Interpretation

| Figma intent                                                  | Product decision                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page heading                                                  | Render the dashboard’s localized title and description through the existing `AdminPageHeader` mechanism.                                                                                                                                                                                                             |
| Welcome area                                                  | Use the authenticated administrator name from the existing current-user architecture. `/admin/profile` is not needed unless a future dashboard requirement explicitly needs profile-only data such as `avatar_url`. No example name or avatar from Figma is valid application data.                                  |
| Welcome date                                                  | Display the actual current date derived at runtime and format it according to the active locale. The example date shown in Figma is reference content only and MUST NOT be hard-coded.                                                                                                                               |
| Statistics cards                                              | Render only `pending_scholarships`, `published_scholarships`, and total `users` from `/admin/dashboard/statistics`. The `users` value represents total platform users/accounts as defined by the backend, including administrators and inactive accounts; it MUST NOT be described as active users or monthly users. |
| Pending scholarships                                          | Render a bounded recent list from `/admin/dashboard/recent-pending-scholarships`.                                                                                                                                                                                                                                    |
| Audit log                                                     | Render a bounded recent list from `/admin/dashboard/audit-logs`.                                                                                                                                                                                                                                                     |
| Monthly activity                                              | Do not fetch or render it in this feature. Although the endpoint exists, no monthly-activity visualization is represented in the supplied Figma node and an endpoint alone does not expand scope.                                                                                                                    |
| Reports/comments metric, collection health, collection action | Omit these unsupported sections/actions. Do not use sample values, fake health states, or inert action buttons.                                                                                                                                                                                                      |
| Manual scholarship creation                                   | Provide a locale-aware navigation action linking to `/admin/scholarships/new` once `003-admin-manual-scholarship` supplies the route; do not embed or own the creation workflow/form in the dashboard.                                                                                                               |
| Scholarship review                                            | No existing review route exists. Omit per-row Review actions; do not create scholarship-review functionality.                                                                                                                                                                                                        |
| Full audit log                                                | No existing audit-log route exists. Omit the Figma action; do not create an audit-log page.                                                                                                                                                                                                                          |
| Welcome identity                                              | Use `AuthProvider` identity (`name`, `email`, `role`). Do not request `/admin/profile` for this feature because the welcome area does not require `avatar_url`.                                                                                                                                                      |

### Responsive, State, and Formatting Decisions

- Statistics use three columns where space permits, then two columns and one
  column at narrow widths.

- Statistics have localized loading, error, and success states. Numeric zero
  values are valid backend data and MUST NOT be treated as an empty state.

- Recent scholarships and audit events remain semantic lists/tables on desktop;
  at narrow widths, each item becomes a readable stacked card with labels rather
  than a clipped wide table. This feature supplies no row actions.

- Statistics, pending scholarships, and audit logs are independent React Query
  reads. Failure of one section MUST NOT block successful rendering of another.

- Pending scholarships and audit logs provide localized loading, retryable error,
  empty, and success states.

- Quantities use `Intl.NumberFormat(locale)`.

- Backend timestamps and the runtime welcome date use
  `Intl.DateTimeFormat(locale, ...)`.

- `no_deadline` takes precedence over a nullable `deadline`.

- Missing or invalid values show localized unavailable text rather than Figma
  examples.

- Use stable bounded recent-data limits selected during planning within each API
  contract; do not imply pagination or a full browsing surface.

## User Scenarios & Testing

### User Story 1 - View real platform overview (Priority: P1)

As an authorized administrator, I can see a localized dashboard overview based
on current backend data.

**Independent Test**: With API responses containing known values, load the
dashboard and verify all three statistic values and their truthful labels are
shown inside the shared admin shell.

**Acceptance Scenarios**:

1. **Given** a successful statistics response, **When** the dashboard loads,
   **Then** it shows pending scholarships, published scholarships, and total
   platform users/accounts using returned values.

2. **Given** any statistic value is `0`, **When** the dashboard renders,
   **Then** `0` is displayed as a valid statistic and is not treated as missing,
   empty, or replaced with Figma sample data.

3. **Given** the statistics request is loading or fails, **When** the page
   renders, **Then** the statistics section provides a localized truthful loading
   or error state without replacing values with zeros or Figma samples.

4. **Given** an authenticated administrator, **When** the welcome area renders,
   **Then** it uses their real `AuthProvider` identity data and never a hard-coded
   administrator name or Figma avatar.

5. **Given** the welcome area renders, **When** the current date is displayed,
   **Then** the date is derived at runtime and formatted for the active locale,
   with no hard-coded Figma example date.

### User Story 2 - Review recent pending scholarships (Priority: P1)

As an administrator, I can scan recently pending scholarships and their
available metadata without entering a scholarship-management workflow.

**Independent Test**: Supply a pending-scholarships response with null
organization/country/deadline fields and verify valid rows render gracefully,
without fictitious fallback data.

**Acceptance Scenarios**:

1. **Given** recent pending items, **When** the section renders, **Then** each
   row displays only supported title, organization, country, deadline/no-deadline,
   source, status, and scrape-time information as available.

2. **Given** no pending items, **When** the section renders, **Then** it shows
   a localized empty state instead of sample scholarship rows.

3. **Given** one or more nullable fields are missing, **When** an item renders,
   **Then** the dashboard uses localized truthful fallback text and does not
   invent organization names, countries, deadlines, domains, or dates.

### User Story 3 - Review recent administrative activity (Priority: P1)

As an administrator, I can see a concise, recent audit trail for supported
administrative events.

**Independent Test**: Supply audit-log items with nullable `admin_id` and
`entity_id`; verify the page renders available `admin_name`, `action_display`,
`entity_name`, and `created_at` without assuming optional identifiers exist.

**Acceptance Scenarios**:

1. **Given** recent audit events, **When** the audit section renders,
   **Then** it displays real backend action, actor, entity, and timestamp data.

2. **Given** no audit events, **When** the section renders,
   **Then** it shows a localized empty state.

3. **Given** an unknown future action value or nullable identifier,
   **When** the entry renders, **Then** the dashboard presents the available
   backend data safely without crashing or inventing meaning.

### User Story 4 - Use the dashboard in either locale and viewport (Priority: P1)

As an Arabic or English administrator, I can read and operate the dashboard in
my locale and document direction on desktop and narrow screens.

**Independent Test**: Load representative data in Arabic/RTL and English/LTR at
desktop and narrow widths; verify statistic cards, recent-scholarship content,
audit events, dates, numbers, loading states, empty states, and error states
remain readable and usable.

**Acceptance Scenarios**:

1. **Given** Arabic is active, **When** the dashboard renders,
   **Then** layout, reading order, alignment, localized dates, and numbers follow
   RTL expectations.

2. **Given** English is active, **When** the dashboard renders,
   **Then** layout, reading order, alignment, localized dates, and numbers follow
   LTR expectations.

3. **Given** a narrow viewport, **When** recent scholarship or audit content
   renders, **Then** the content remains readable without relying on a clipped
   desktop-only table.

## Functional Requirements

- **FR-001**: The dashboard MUST render inside the existing Admin Shell at
  `/[locale]/admin/dashboard`; it MUST NOT duplicate shell, auth, role guard,
  navigation, logout, or language-switch code.

- **FR-002**: The page MUST use the existing page-heading mechanism for its
  localized title and description.

- **FR-003**: Dashboard reads MUST use the shared `apiClient` and React Query
  conventions, relying on existing HttpOnly-cookie credentials. It MUST NOT add
  Bearer headers, browser token storage, or an auth store.

- **FR-004**: The statistics section MUST request
  `GET /admin/dashboard/statistics` and show only:
  - `pending_scholarships`
  - `published_scholarships`
  - `users`

  The `users` field MUST be presented according to its backend semantics as
  total platform users/accounts, including administrators and inactive accounts.
  It MUST NOT be labelled as active users, active monthly users, or student-only
  users.

- **FR-005**: The pending-scholarships section MUST request
  `GET /admin/dashboard/recent-pending-scholarships?limit=<bounded value>`
  with a limit from 1 through 50.

- **FR-006**: The audit section MUST request
  `GET /admin/dashboard/audit-logs?limit=<bounded value>&offset=<number>` with
  a limit from 1 through 100; it MUST NOT imply full audit-log browsing.

- **FR-007 — Monthly Activity Exclusion**: The Admin Dashboard MUST NOT fetch
  or render `/admin/dashboard/monthly-activity` in this feature. Monthly
  activity visualization is outside the scope of `002-admin-dashboard` and may
  be introduced in a future feature.

  Monthly activity visualization is outside the scope of
  `002-admin-dashboard` and may be introduced by a future feature.

- **FR-008**: The statistics section MUST provide localized loading, error, and
  success states. Zero statistic values MUST be treated as valid backend data.

- **FR-009**: The recent-pending-scholarships and audit-log sections MUST each
  provide localized loading, retryable error, empty, and success states.

- **FR-010**: Failure of one independent dashboard read MUST NOT suppress
  successful sibling sections.

- **FR-011**: Nullable API fields MUST be handled without invented names,
  countries, deadlines, dates, URLs, statuses, domains, actors, or entities.

- **FR-012**: All visible text, dates, labels, accessible names, state messages,
  empty states, and retry controls MUST support existing Arabic/English
  `next-intl` messages.

- **FR-013**: Layout MUST support RTL and LTR with responsive cards and lists;
  it MUST preserve the Figma visual hierarchy using semantic flex/grid/table
  patterns rather than copied absolute coordinates.

- **FR-014**: The dashboard MUST NOT implement scholarship-creation logic or
  embed the manual-scholarship form inside the dashboard.

  Once feature `003-admin-manual-scholarship` provides the manual creation
  route, the dashboard MUST expose the localized "Add scholarship manually"
  navigation action linking to `/admin/scholarships/new` through the existing
  locale-aware navigation architecture.

  The dashboard MUST NOT implement unsupported reports/comments functionality,
  collection health, collection execution, scholarship review/edit workflows,
  notifications management, or full audit-log browsing.

- **FR-015**: The dashboard MUST use `AuthProvider` identity for its welcome
  area and MUST NOT request `/admin/profile` unless an avatar or another
  profile-only field becomes an explicitly required dashboard element.

- **FR-016**: Numbers MUST use locale-aware `Intl.NumberFormat`.

- **FR-017**: Dates and timestamps MUST use locale-aware
  `Intl.DateTimeFormat`.

- **FR-018**: `no_deadline` MUST take precedence over a nullable `deadline`
  value.

- **FR-019**: The dashboard welcome section MUST display the current date derived
  at runtime.

  The date MUST be formatted according to the active application locale.

  The implementation MUST NOT hard-code the example date shown in Figma.

- **FR-020**: Dashboard React Query behavior MUST NOT duplicate authentication
  or authorization responsibilities already owned by `AuthProvider` and
  `RoleGuard`.

- **FR-021**: Authentication or authorization failures such as `401` and `403`
  MUST NOT be treated as blindly retryable transient dashboard failures.

## Key Entities

- **Dashboard statistics**: `pending_scholarships`,
  `published_scholarships`, and total `users`.

- **Recent pending scholarship**: A pending scholarship with available source,
  deadline, organization, country, status, and scrape metadata.

- **Audit log entry**: A recorded action with available actor, action display,
  entity, details, and creation time.

- **Authenticated administrator identity**: The existing `AuthProvider`
  representation used by the dashboard welcome area.

- **Admin profile**: An optional future enrichment source for `full_name`,
  email, role, and `avatar_url`; it is not required by this feature and does not
  replace `AuthProvider` state.

## Non-Goals

- Any Admin Shell change or duplicate shell implementation.

- Monthly activity visualization or
  `/admin/dashboard/monthly-activity` integration.

- Fake Figma data, unavailable metrics, health states, or actions.

- Manual scholarship creation form implementation remains owned by
  `003-admin-manual-scholarship`. The Admin Dashboard MUST expose the localized
  “Add scholarship manually” navigation action once that route is available;
  it does not own or embed the creation form itself.

- Scholarship review/editing, scraper operation, reports management,
  notification management, or full audit-log pages.

- Fetching `/admin/profile` solely to reproduce the Figma example avatar.

## Success Criteria

- **SC-001**: On a successful load, the dashboard presents all
  backend-supported overview data with zero Figma sample values used as
  application data.

- **SC-002**: Statistics display truthful backend values, including valid zero
  values, and never misrepresent total platform users as active/monthly users.

- **SC-003**: Recent scholarships and audit logs are independently understandable
  during loading, error, empty, and success states in Arabic and English.

- **SC-004**: The welcome section uses authenticated-user identity and a
  runtime-derived, locale-formatted current date with no hard-coded example
  identity or date.

- **SC-005**: At desktop and narrow widths, cards and recent-data content remain
  readable in RTL and LTR without affecting the shared Admin Shell.

- **SC-006**: No duplicate auth/session mechanism, fake route, unsupported
  action, unsupported monthly-activity UI, or misleading metric is introduced.
