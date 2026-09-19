# Admin Dashboard Implementation Quality Checklist

Use this checklist when implementing and reviewing feature
`002-admin-dashboard` against Figma node `2890:9831` and its supported backend
contracts.

## Shell and Architecture

- [x] The dashboard renders only as content inside the completed Admin
      Application Shell.
- [x] No sidebar, global header, language switcher, logout, auth provider, or
      `RoleGuard` logic is duplicated or rebuilt.
- [x] The existing `AdminPageHeader`/shell heading mechanism supplies the page
      title and description; the page does not render a duplicate `h1`.
- [x] Dashboard components have clear feature-specific responsibilities and do
      not duplicate components already provided by `001-admin-application-shell`.
- [x] The dashboard does not create a route solely to satisfy a Figma button or
      navigation affordance.

## Backend Truthfulness

- [x] No Figma sample names, counts, dates, scholarship rows, source domains,
      audit events, or health values appear as production data.
- [x] Every rendered metric maps directly to a supported backend field.
- [x] `users` is presented with wording consistent with the API semantics:
      total platform accounts/users, including administrators and inactive
      accounts; it is never described as active users or monthly users.
- [x] `pending_scholarships` and `published_scholarships` retain their backend
      semantics.
- [x] No reports/comments metric is fabricated.
- [x] No scraper/source-collection health data is fabricated.
- [x] No fake or inert “Run collection now” behavior is implemented.
- [ ] Verify the Dashboard exposes the localized “Add scholarship manually”
      navigation action once feature `003-admin-manual-scholarship` exists,
      without embedding creation logic inside the Dashboard.
- [x] Unsupported scholarship-review and full-audit-log actions are omitted
      unless a pre-existing valid destination is explicitly confirmed.
- [x] Monthly activity is not fetched or rendered in this feature.

## API and Server State

- [x] All dashboard requests use the shared `apiClient` and its
      HttpOnly-cookie `credentials: include` behavior.
- [x] No Authorization Bearer header, localStorage/sessionStorage token, or new
      auth/session store is introduced.
- [x] React Query exclusively owns dashboard server state; data is not copied
      into Zustand or `AuthProvider`.
- [x] Statistics, recent pending scholarships, and audit logs each use stable,
      typed API contracts and deliberately scoped query keys.
- [x] Query keys distinguish resource and request parameters, including recent
      list limit and audit offset/action when used.
- [x] API functions forward React Query’s abort signal and bound all API limits
      to their documented ranges.
- [x] `/admin/profile` is not fetched for the welcome card unless an explicitly
      required profile-only field, such as an avatar, is actually rendered.

## States and Data Presentation

- [x] Statistics have localized loading, error/retry, and success states; pending
      scholarships and audit logs additionally have localized empty states.
- [x] A failed section does not prevent other successful dashboard sections
      from rendering.
- [x] No error state silently replaces unavailable data with zeros or Figma
      mock values.
- [x] Recent scholarship rows use backend `id` values as stable keys.
- [x] Pending scholarship title and organization use real fields from the API.
- [x] Nullable organization, country, deadline, source URL, and scraped time
      values have explicit localized unavailable/no-deadline treatment.
- [x] `no_deadline` takes precedence over `deadline`.
- [x] Source URLs are parsed defensively before rendering as links; invalid or
      absent URLs are not rendered as unsafe/fictitious links or Figma domains.
- [x] Displayed source/domain values derive from real `source_url` or supported
      `source` data only.
- [x] Scholarship status comes from the backend and unknown future values have
      a safe neutral treatment.
- [x] Audit entries use backend `action_display`, `action`, `admin_name`,
      `entity_name`, and `created_at`; no administrator name or event is assumed.
- [x] Nullable audit identifiers and unknown future actions render safely.

## Internationalization, Responsive Behavior, and Accessibility

- [x] Every new visible string, fallback, label, retry control, table header,
      and accessible name exists in both Arabic and English `next-intl` messages.
- [x] Numbers use locale-aware `Intl.NumberFormat`.
- [x] Dates/times use locale-aware `Intl.DateTimeFormat`, including valid
      handling for invalid or absent timestamps.
- [x] Arabic/RTL and English/LTR preserve reading order, alignment, direction,
      and icon/link behavior.
- [x] Statistics cards reflow from desktop multi-column layout to readable
      narrow-screen cards without reserving a fabricated fourth card.
- [x] Recent-pending and audit content remains readable on narrow screens using
      an accessible stacked-card/list presentation or another non-clipped pattern.
- [x] Desktop tables use semantic `table`, caption/heading context, and scoped
      headers as appropriate.
- [x] Links, status indicators, retry controls, and any remaining interactive
      elements have accessible names, keyboard behavior, visible focus, and do not
      communicate state through color alone.

## Visual Quality and Verification

- [x] The implementation follows Figma node `2890:9831` for supported content
      hierarchy, card proportions, typography, spacing, borders, surfaces, and
      visual emphasis.
- [x] Generated Figma React/Tailwind code was not copied into production.
- [x] Layout uses responsive grid/flex/table patterns; no screenshot-specific
      absolute coordinates or fixed blank panels are introduced.
- [x] Existing project design tokens and faithful existing icon components are
      used before adding new assets.
- [x] A genuine Figma asset is downloaded and committed only when no faithful
      project asset/icon exists; no replacement SVG artwork is invented.
- [x] `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` are run, with any
      environment-only build blocker documented separately.

## Authentication and Query Behavior

- [x] Dashboard queries do not retry `401` or `403` responses as transient
      failures; authentication/authorization failures follow the existing auth
      architecture instead of entering repeated request loops.

- [x] Transient server/network failures may use a bounded retry strategy, while
      permanent client/auth errors are not retried blindly.

- [x] The welcome-card current date is derived at runtime and formatted using
      the active locale; no Figma example date is hard-coded.

- [x] Dashboard queries do not introduce competing session-expiry or redirect
      logic that duplicates `AuthProvider`/`RoleGuard` responsibilities.
