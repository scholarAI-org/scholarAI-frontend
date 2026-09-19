# Tasks: Reusable Admin Application Shell

**Feature**: `001-admin-application-shell`  
**Plan**: [plan.md](./plan.md)  
**Specification**: [spec.md](./spec.md)

## Phase 1: Foundation

- [ ] T001 Review the current `src/app/[locale]/admin/layout.tsx`,
      `RoleGuard`, `AuthProvider`, `useLogout`, and `src/i18n/navigation.ts` before
      changing the shell; preserve their existing contracts.

- [ ] T002 Inspect the shell asset set from Figma node `2890:10329`; compare
      every needed glyph against `src/components/icons` and `lucide-react` before
      downloading any asset.

- [ ] T003 Download and commit only required genuine Figma assets without a
      faithful existing match to `public/images/admin/`; do not retain expiring MCP
      asset URLs or author substitute SVGs.

- [ ] T004 Add matching `AdminShell` message namespaces to `src/messages/ar.json`
      and `src/messages/en.json` for brand, identity role, navigation groups/items,
      logout, pending logout, unavailable entries, language switching, and mobile
      navigation labels.

- [ ] T005 Add any narrowly necessary semantic admin token(s) to
      `src/app/globals.css`, reusing existing page/surface/border/text/navy/orange
      tokens before introducing a new value.

## Phase 2: Navigation Model and Presentational Primitives

- [ ] T006 Create `src/features/admin/admin-navigation.ts` with typed grouped
      navigation definitions, translation keys, icon/asset references, explicit
      exact/descendant route matchers, and optional destination availability.

- [ ] T007 Define dashboard as the sole enabled admin destination until more
      routes exist; model all displayed future destinations as non-linked,
      unavailable entries rather than links to missing pages.

- [ ] T008 Create `src/features/admin/components/AdminPageHeader.tsx` as a
      semantic presentational `h1` and optional description component using
      page-supplied localized content; do not create a route-to-title map.

- [ ] T009 Create shared admin-shell types only if needed to avoid duplicated
      navigation, identity, and heading contracts across components.

## Phase 3: Sidebar and Header

- [ ] T010 Create the client `src/features/admin/components/AdminSidebar.tsx`
      with semantic brand, authenticated-admin identity, grouped navigation, and a
      lower-anchored logout region.

- [ ] T011 Map only `useAuth` fields (`name`, `email`, `role`) into sidebar
      identity and derive initials safely; do not query profile data or hard-code an
      administrator name/avatar.

- [ ] T012 Use `usePathname` and the navigation matchers in `AdminSidebar.tsx`
      to derive exactly one active item, preferring the most-specific matching path.

- [ ] T013 Render enabled items with locale-aware `Link` from
      `@/i18n/navigation`; render unavailable items without an `href` and with a
      clear localized unavailable state.

- [ ] T014 Wire the sidebar logout button to `useLogout`, including accessible
      pending and disabled behavior; do not duplicate query-cache clearing or
      redirect logic.

- [ ] T015 Create the client `src/features/admin/components/AdminHeader.tsx`
      with the shared control region and a localized, accessible mobile-navigation
      trigger.

- [ ] T016 Implement language switching in `AdminHeader.tsx` using `useLocale`,
      `usePathname`, and `useRouter` from `@/i18n/navigation`, plus
      `useSearchParams` from `next/navigation`. Preserve the current pathname and
      query parameters when switching locale, preserve the client-side hash when
      applicable, and use `scroll: false`.

- [ ] T017 Render account, notification, and theme controls only when they have
      an existing supported behavior/destination; do not implement new account,
      notifications, or theme features and do not render inert controls as buttons.

## Phase 4: Shell Composition and Responsive Behavior

- [ ] T018 Create client `src/features/admin/components/AdminShell.tsx` to
      compose `AdminSidebar`, `AdminHeader`, and `children` into a semantic
      `aside`/`header`/`main` application frame.

- [ ] T019 Implement the desktop layout with grid/flex, logical border/order
      utilities, a 236px visual-target rail, and 108px visual-target header;
      preserve Figma hierarchy without absolute screen coordinates or fixed blank
      content areas.

- [ ] T020 Ensure Arabic/RTL positions the persistent desktop rail on the right
      and English/LTR mirrors the layout to the left. Mirror only directional icons
      where semantically appropriate; do not blindly transform all icons.

- [ ] T021 Implement the narrow-screen navigation disclosure/drawer, reusing
      sidebar navigation content while providing focus management, Escape dismissal,
      route-change close behavior, and an accessible name.

- [ ] T022 Ensure main content is `min-w-0`, responsive, and scrollable without
      clipping header controls, navigation, logout, or child-page content.

- [ ] T023 Update `src/app/[locale]/admin/layout.tsx` so its existing
      `RoleGuard` remains outermost and `AdminShell` wraps `children` inside it.

## Phase 5: Page-Slot Proof and Validation

- [ ] T024 Keep `src/app/[locale]/admin/dashboard/page.tsx` free of dashboard
      feature work; if necessary, replace its inline placeholder styling only with
      a localized minimal content-slot/heading demonstration using
      `AdminPageHeader`.

- [ ] T025 Verify shared shell source contains no Notifications page title or
      description, static `active` navigation flag, fixed admin identity, duplicate
      auth state, or direct unlocalized user-facing strings.

- [ ] T026 Verify Figma asset containers provide explicit dimensions and that
      each non-decorative control has an accessible name.

- [ ] T027 Manually test authenticated admin dashboard load and confirm the
      existing `RoleGuard` still redirects unauthenticated/non-admin users.

- [ ] T028 Manually test route-derived sidebar active state, enabled dashboard
      navigation, unavailable future items, and existing logout behavior.

- [ ] T029 Manually test Arabic/RTL and English/LTR at desktop width and narrow
      width, including language switching, sidebar/drawer placement, keyboard
      navigation, focus handling, and Escape dismissal.

- [ ] T030 Run the repository's existing lint and production build commands using
      the package manager already used by the project.

- [ ] T031 Complete the
      [UI implementation quality checklist](./checklists/ui-implementation-quality.md)
      and record any accepted exception in the feature documentation.

- [ ] T032 Compare the completed Admin Shell against Figma node `2890:10329`
      at the reference desktop viewport. Verify visual hierarchy, sidebar/header
      proportions, spacing, typography, borders, backgrounds, alignment, and
      RTL composition. Fix meaningful visual differences without introducing
      screenshot-specific absolute positioning.

## Dependency Order

`T001–T005` → `T006–T009` → `T010–T017` → `T018–T023` → `T024–T032`

Tasks in Phase 3 can proceed in parallel after Phase 2. Shell composition
(Phase 4) depends on both sidebar and header work. Validation begins only once
the guarded layout integration is complete.

## Out of Scope

- Notifications lists, badge counts, or notification data.
- Dashboard statistics, scholarship review/management, users management,
  reports, or profile-page implementation.
- New authentication/session stores, a theme persistence system, account pages,
  or routes created solely to make navigation items clickable.
