# Implementation Plan: Admin Dashboard

**Feature**: `002-admin-dashboard`  
**Specification**: [spec.md](./spec.md)  
**Prerequisite**: `001-admin-application-shell`

## Technical Context

| Area            | Decision                                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route and shell | Keep `src/app/[locale]/admin/dashboard/page.tsx` inside the existing guarded `AdminShell`. Do not modify layout, `RoleGuard`, sidebar, header controls, logout, locale switcher, or navigation.         |
| Page heading    | Retain the existing `AdminHeader` → `AdminPageHeader` dashboard-title mechanism. The dashboard page content starts below this shell-owned visual header band and must not render a second `h1`.         |
| Server state    | Use independent React Query `useQuery` hooks, each with a distinct dashboard query key and `AbortSignal` passed to feature-local API functions. Do not copy server data into Zustand or `AuthProvider`. |
| Transport/auth  | Use `apiClient` with `GET` requests only. Its `credentials: 'include'` behavior is the required HttpOnly-cookie authentication path; add no Authorization header or browser token storage.              |
| Identity        | Use `useAuth().user` for the welcome name. Do not request `/admin/profile`: avatar/profile enrichment is not required by the clarified dashboard scope.                                                 |
| Localization    | Use `next-intl` messages in `ar.json`/`en.json`, `useLocale`, and `Intl.NumberFormat`/`Intl.DateTimeFormat`.                                                                                            |
| Styling         | Use Tailwind and existing semantic page/surface/border/text/primary tokens. Match the Figma hierarchy with responsive grid/flex/table patterns, not generated absolute coordinates.                     |

## Figma-to-Backend Mapping

| Visible Figma concept                | Data source / behavior                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Dashboard title and description      | Existing localized `AdminDashboard` heading messages rendered by the shell header.                                            |
| Administrator welcome                | `useAuth().user.name`; render a safe generic fallback only while identity is unavailable.                                     |
| Pending scholarships card            | `statistics.pending_scholarships`.                                                                                            |
| Published/approved scholarships card | `statistics.published_scholarships`; label it published/approved consistently with product copy.                              |
| Users card                           | `statistics.users`; label it **total users**, never active users this month.                                                  |
| Fourth reports/comments card         | Omit: no supplied backend count. Do not create a placeholder fourth card or a Figma sample value.                             |
| Add scholarship manually             | Provide a locale-aware navigation action to `/admin/scholarships/new` once `003-admin-manual-scholarship` supplies the route. |
| Run collection now                   | Omit: no execution endpoint.                                                                                                  |
| Source collection health             | Omit: no backend health API.                                                                                                  |
| Recent pending-scholarships rows     | `recent-pending-scholarships.items`; use API `id` as the stable key.                                                          |
| Row review CTA                       | Omit: no review route or workflow in scope.                                                                                   |
| Recent audit events                  | `audit-logs.items`; use API `id` as the stable key.                                                                           |
| View full audit log CTA              | Omit: no existing destination.                                                                                                |
| Monthly activity                     | Omit: clarified scope excludes it because the Figma node does not represent it. Do not fetch its endpoint.                    |

## Data Layer Design

Create a focused `src/features/admin/dashboard/` feature module.

| File                                    | Responsibility                                                                                                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                              | Type the supplied API contracts: statistics, pending response/item, audit response/item, and nullable fields. Do not type monthly activity because it is not fetched.                                                                 |
| `api/dashboard.ts`                      | Export `getDashboardStatistics(signal?)`, `getRecentPendingScholarships(limit, signal?)`, and `getDashboardAuditLogs({ limit, offset, action? }, signal?)`. Build bounded query strings with `URLSearchParams`; use `apiClient` only. |
| `query-keys.ts`                         | Export `dashboardKeys` rooted at `['admin', 'dashboard']`, with separate keys for `statistics`, `pending(limit)`, and `audit({ limit, offset, action })`.                                                                             |
| `hooks/useDashboardStatistics.ts`       | React Query wrapper for statistics.                                                                                                                                                                                                   |
| `hooks/useRecentPendingScholarships.ts` | React Query wrapper for the selected bounded recent limit.                                                                                                                                                                            |
| `hooks/useDashboardAuditLogs.ts`        | React Query wrapper for the selected bounded limit and offset zero.                                                                                                                                                                   |
| `lib/formatters.ts`                     | Locale-aware pure helpers for numbers, ISO timestamps, deadline/no-deadline presentation, and safe URL-domain extraction. Keep all fallback labels in translated component messages, not helpers.                                     |

Dashboard preview limits:

- Recent pending scholarships: `limit=5`
- Recent audit logs: `limit=4`, `offset=0`

These limits are dashboard-preview decisions, not pagination behavior. The
feature does not expose full-history pagination.

## Component Design

Place dashboard UI under `src/features/admin/dashboard/components/` and avoid
extracting one-off Figma wrappers.

| Component                        | Responsibility                                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DashboardWelcome`               | Shows the localized welcome/summary card using AuthProvider identity and the runtime current date; no profile fetch, fake actions, or hard-coded name/date.                               |
| `DashboardStats`                 | Owns the statistics query and its independent loading/error/empty/success presentation; composes three cards only.                                                                        |
| `DashboardStatCard`              | Reusable presentational metric card for the three supported statistics; receives translated label, formatted value, semantic visual variant, and faithful existing/Figma asset if needed. |
| `RecentPendingScholarships`      | Owns pending-scholarships query and section-level state; renders a table on wide layouts and a readable item-card list on narrow layouts.                                                 |
| `RecentPendingScholarshipsTable` | Meaningful table-specific presentation boundary. Shows only supported fields and no Review action.                                                                                        |
| `DashboardAuditLog`              | Owns audit query and section-level state; renders a concise recent activity list/table with unknown action-safe display.                                                                  |
| `DashboardSectionState`          | Add only if the loading/error/empty pattern is genuinely shared by both data sections; it must accept localized content and retry callback rather than hard-code dashboard copy.          |

The route page remains a thin composition component: it uses `useAuth` for the
welcome card and arranges feature sections; data queries remain inside their
own section components so one request failure cannot blank the page.

## Data Presentation Rules

### Statistics

- Format all numeric values with `Intl.NumberFormat(locale)`.
- Preserve API semantics exactly: `pending_scholarships`,
  `published_scholarships`, and total `users`.
- A failed statistics request renders a localized section error/retry state; it
  does not substitute zeroes, sample counts, or unrelated metrics.

### Welcome Date

The welcome section derives the current date at render time and formats it with
the active locale using the dashboard date-formatting utility. Figma example
dates are reference content only.

### Recent Pending Scholarships

- Show `title` and `organization_name` when present; render a localized
  unavailable value for nullable organization/country/source data rather than
  inventing values.
- If `no_deadline` is true, use the localized no-deadline copy. Otherwise,
  format a valid `deadline` with `Intl.DateTimeFormat(locale, ...)`; absent or
  invalid deadlines display localized unavailable copy.
- Derive a display domain from `source_url` only by `new URL(source_url)` in a
  guarded helper. On an invalid or absent URL, show supported `source` if
  available; never hard-code Figma domains.
- Format `scraped_at` with the locale helper when valid. Preserve the API
  `status` as the source of truth, with an unknown-status-safe neutral display.
- Use API `id` keys. No review CTA or unimplemented link. The Dashboard may
  provide only the supported manual-creation navigation action; it must not
  embed creation logic.

### Audit Logs

- Show backend `action_display`, `admin_name`, `entity_name`, and formatted
  `created_at`; use `action` as a safe fallback only when `action_display` is
  absent/unknown.
- Do not assume nullable `admin_id`/`entity_id` exists or map future action
  values to Figma sample events.
- Use API `id` keys and show a localized empty state if there are no events.

## Responsive and Accessibility Strategy

1. Keep the Figma content container’s broad desktop rhythm (card surfaces,
   rounded corners, 24px-level section gaps, borders, and type hierarchy) while
   relying on the shell’s responsive content width.
2. Use a `grid` for the three cards: one column on narrow screens, two at a
   suitable small/medium breakpoint, and three on wide screens. Never reserve
   a blank fourth card.
3. Use semantic `section`/`h2`, `dl` or labelled metrics for cards, and a
   semantic `table` with headers on wide layouts. At narrow widths, render
   labelled article/list cards rather than clipping a wide table.
4. Use logical alignment and spacing utilities so Arabic RTL and English LTR
   preserve reading order. Give source URLs external-link semantics only when
   a valid URL is actually rendered.
5. Make retry controls real buttons with localized accessible names; loading,
   error, and empty states must remain announced/readable without color alone.

## File-Level Change Plan

| File                                             | Change                                                                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/[locale]/admin/dashboard/page.tsx`      | Replace the placeholder with thin dashboard composition only; preserve its place inside `AdminShell` and avoid a duplicate heading. |
| `src/features/admin/dashboard/types.ts`          | Add dashboard API types.                                                                                                            |
| `src/features/admin/dashboard/api/dashboard.ts`  | Add the three supported cookie-authenticated GET clients.                                                                           |
| `src/features/admin/dashboard/query-keys.ts`     | Add independent dashboard React Query keys.                                                                                         |
| `src/features/admin/dashboard/hooks/*`           | Add three focused read hooks.                                                                                                       |
| `src/features/admin/dashboard/lib/formatters.ts` | Add safe locale/URL/date formatting helpers.                                                                                        |
| `src/features/admin/dashboard/components/*`      | Add dashboard welcome, stats, pending-list, audit-log, and only meaningful shared state/presentation components.                    |
| `src/messages/ar.json`                           | Add dashboard labels, states, metric names, field labels, actions, and fallbacks.                                                   |
| `src/messages/en.json`                           | Add exact English counterparts.                                                                                                     |
| `public/images/admin/*`                          | Add genuine Figma assets only where no existing project asset/icon faithfully represents the required supported dashboard visual.   |

## Implementation Sequence

1. Confirm the existing Admin Shell/header already owns the dashboard heading;
   leave its structure unchanged.
2. Create types, query keys, and `apiClient`-based dashboard API clients. Add
   unit-level request construction checks if the project’s current test setup
   supports them.
3. Create three independent React Query hooks with bounded limits, abort-signal
   forwarding, deliberate retry behavior, and no initial mock data.
4. Add bilingual messages and locale formatter helpers before rendering state
   text or dynamic fields.
5. Build `DashboardWelcome` and `DashboardStats`, using AuthProvider only for
   identity and the statistics hook only for metrics.
6. Build pending scholarships and audit log sections with desktop/narrow
   presentations and their own loading/error/empty states.
7. Compose the sections in the route page, verify no unsupported Figma section
   or CTA enters the DOM, then refine visual spacing against Figma intent.
8. Download/commit exact Figma assets only after confirming an existing asset or
   Lucide glyph is not faithful enough for a supported visual element.

## Verification Plan

- Run `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` when network font
  availability permits.
- Verify authenticated admin dashboard requests use only shared `apiClient` and
  cookie credentials.
- Mock/inspect independent success, loading, error, partial-failure, and empty
  responses for statistics, pending scholarships, and audit logs.
- Verify no requests are made to `/admin/profile` or monthly activity.
- Verify exact metric semantics, nullable field fallbacks, safe invalid URL
  handling, no-deadline behavior, and unknown audit/status rendering.
- Verify Arabic/RTL and English/LTR at desktop and narrow widths, including
  number/date formatting, card reflow, table-to-card transformation, keyboard
  retry controls, and no duplicated shell/header.

### Query Retry Policy

Dashboard queries must use explicit retry behavior:

- Do not retry `401 Unauthorized` or `403 Forbidden` responses.
- Do not duplicate authentication/session-expiry redirects already owned by
  `AuthProvider` and `RoleGuard`.
- Retry only appropriate transient network/server failures.
- Keep retries bounded; do not retry indefinitely.
- Each dashboard resource handles its own failure independently so one failed
  query does not prevent successful sibling sections from rendering.
