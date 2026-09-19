# Implementation Plan: Reusable Admin Application Shell

**Feature**: `001-admin-application-shell`  
**Status**: Ready for implementation  
**Specification**: [spec.md](./spec.md)

## Technical Context

| Area                      | Decision                                                                                                                                                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework                 | Next.js App Router with TypeScript and React. The shell is applied from `src/app/[locale]/admin/layout.tsx`.                                                                                                                                                                                                               |
| Styling                   | Tailwind CSS v4 with the established semantic token variables in `src/app/globals.css`; use flex/grid and logical directional styling.                                                                                                                                                                                     |
| Localization              | `next-intl`; translations come from `src/messages/ar.json` and `src/messages/en.json`. Locale-aware `Link`, `usePathname`, and `useRouter` come from `src/i18n/navigation.ts`.                                                                                                                                             |
| Authentication            | `AuthProvider`/`useAuth` supplies the current admin (`name`, `email`, `role`). The existing `RoleGuard` remains the authorization boundary.                                                                                                                                                                                |
| Logout                    | `useLogout` owns the mutation, React Query cache clearing, and redirect to `/login`.                                                                                                                                                                                                                                       |
| Icons/assets              | Reuse an existing matching icon only when visually equivalent; otherwise download the exported Figma asset before implementation and commit it under the project’s public asset convention. Do not copy the generated Figma code or hand-draw its SVG paths.                                                               |
| Existing layout precedent | `ProfileLayout`, `profile/Sidebar`, and `profile/Navbar` establish the same visual language, 236px desktop rail, 108px header, locale switching, and responsive layout approach. They are profile-specific and rely on static item state/href behavior, so they are reference/reuse candidates—not the admin shell itself. |

## Figma Design Findings

The inspected Figma node (`2890:10329`) is a 1440px RTL desktop reference with:

- a 236px right-side white rail, separated by an `#E2E8F0` border;
- a 108px white main-content header with a title/subtitle area and compact
  controls;
- `#F8FAFC` main background, `#434343` primary heading, `#B5B5B5` supporting
  text, `#274383` navy identity accent, and `#F97316` accent;
- grouped sidebar labels and 14px navigation labels, with 18–20px icons;
- a bottom-separated logout action; and
- Figma-exported assets for the navigation icons, notification bell/status dot,
  logout icon, logo/photo, and theme glyph.

The reference’s Notifications heading, description, example administrator
identity, unread dot, screenshot photo, and empty canvas are page/example data,
not shared-shell truth. Its generated absolute coordinates and React/Tailwind
output are reference-only.

## Proposed Component Architecture

Create the components under `src/features/admin/components/` because they are
admin-domain UI, then compose them only at the admin route layout boundary.

| Component/module                                                      | Responsibility                                                                                                                                                                         | Client boundary                                                                |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `AdminShell.tsx`                                                      | Owns responsive shell geometry and composes sidebar, header, and `children`. It has no route list, authenticated-user mapping, heading data, or page business data hard-coded into it. | Client, because it coordinates responsive navigation state and child controls. |
| `AdminSidebar.tsx`                                                    | Renders brand, auth-derived identity, grouped nav, and logout at the rail footer. Renders links only for available destinations.                                                       | Client, because it uses route state and `useLogout`.                           |
| `AdminHeader.tsx`                                                     | Renders the mobile navigation trigger and shared control region. It does not render a page title or query notification data.                                                           | Client, due to locale switching and shell-control interaction.                 |
| `AdminPageHeader.tsx`                                                 | Stateless semantic `h1`/optional description presentation for page-provided localized content.                                                                                         | Server-compatible/presentational.                                              |
| `admin-navigation.ts`                                                 | Typed, localized navigation configuration: group key, item key, icon/asset, destination when implemented, and explicit route matcher. It contains no `active` flags.                   | Server-compatible data.                                                        |
| `admin-shell.types.ts` (only if types cannot live beside their owner) | Defines `AdminNavigationGroup`, `AdminNavigationItem`, route matcher, and optional `AdminPageHeader` data.                                                                             | N/A.                                                                           |

Do not create a component for every Figma frame/group. In particular, sidebar
group labels, identity card pieces, and compact header controls stay internal
markup unless they develop independent reuse or interaction needs.

## Integration Design

1. Keep `RoleGuard` as the outer wrapper in
   `src/app/[locale]/admin/layout.tsx`.
2. Render `<AdminShell>{children}</AdminShell>` inside that guard. This keeps
   all current and future nested admin routes under the same authorization and
   layout boundary.
3. Within `AdminSidebar`, call `useAuth` only after the guard has admitted the
   user. Map `user.name`, `user.email`, and `user.role` to display data and
   derive safe initials from the name. Do not add profile fetching or an auth
   store.
4. In `AdminSidebar`, use `usePathname` from `@/i18n/navigation` and the
   navigation configuration’s exact/section matchers to derive one active item.
   Use `Link` from that same module for implemented routes, preserving locale
   prefixes. The only currently implemented destination is dashboard; future
   entries render as non-link unavailable rows or are omitted until their route
   exists.
5. Wire the sidebar logout button to `useLogout().mutate()`, preserving its
   pending/disabled state. Do not duplicate cache or redirect logic.
6. Reuse the existing locale-switch pattern from `profile/Navbar.tsx`: read
   `useLocale`, replace the current localized `usePathname()` with
   `useRouter().replace(..., { locale: nextLocale, scroll: false })`, and
   preserve search/hash. Localize its accessible label and visible abbreviation.
7. Reserve header locations for account, notification, and theme controls. Do
   not create account pages, notifications APIs, a theme provider, or inert
   buttons. Render a control only when an existing behavior/destination is
   available; language and mobile navigation are actionable in this feature.
8. Provide a deliberate page-heading API. Either:
   - have a child page render `AdminPageHeader` in its content slot, or
   - add a narrowly scoped layout/page metadata mechanism only after confirming
     it works with App Router server/client boundaries.

   Start with the first option: it is explicit, localized, and prevents the
   shell from coupling itself to route-specific titles. Do not add a hard-coded
   route-to-heading map.

## Visual and Responsive Implementation Strategy

1. Map the design language to existing tokens first. Use established page,
   surface, border, text, navy, and orange variables. Add an admin-specific
   token only if an inspected Figma value cannot be expressed by the existing
   token system; document the semantic purpose rather than adding raw values to
   individual components. Preserve Figma’s 18px/16px/14px/12px/10px hierarchy
   using the existing application font (`Almarai`); loading Rubik solely for
   this shell would break the project’s established typography system.
2. Use a full-viewport shell with a main column and desktop rail. At the
   large-screen breakpoint, use grid/flex ordering and logical border
   properties so RTL puts the rail on the right and LTR mirrors it left. The
   236px rail and 108px header are desktop visual targets, not immovable global
   dimensions.
3. Preserve the hierarchy: logo/brand → identity → navigation groups → logout;
   header controls and mobile trigger → page content. Use semantic `aside`,
   `nav`, grouped lists with headings, `header`, and `main`.
4. At widths where the 236px rail would harm readable content, hide the
   persistent rail and expose the same `AdminSidebar` navigation through an
   accessible disclosure/drawer. Implement focus management, Escape close,
   an accessible name, and route-change close behavior. Do not use a visual-only
   hamburger.
5. Let the page content column scroll normally and remain `min-w-0`; avoid
   fixed content heights and avoid recreating Figma’s blank panel.
6. Render Figma-specific exported assets in fixed, explicit icon containers.
   Verify an existing Lucide glyph matches before using it. Commit downloaded
   asset bytes rather than referencing the expiring Figma MCP URLs.

## File-Level Change Plan

| File                                                 | Change                                                                                                                                                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/[locale]/admin/layout.tsx`                  | Preserve the existing `RoleGuard`; insert `AdminShell` around `children`.                                                                                                                                                       |
| `src/features/admin/components/AdminShell.tsx`       | Add shell composition, desktop/mobile layout, and content slot.                                                                                                                                                                 |
| `src/features/admin/components/AdminSidebar.tsx`     | Add semantic grouped navigation, route-derived active state, identity display, and existing logout integration.                                                                                                                 |
| `src/features/admin/components/AdminHeader.tsx`      | Add shared header control area, language switch, and accessible small-screen navigation trigger.                                                                                                                                |
| `src/features/admin/components/AdminPageHeader.tsx`  | Add optional reusable localized heading/description rendering for child pages.                                                                                                                                                  |
| `src/features/admin/admin-navigation.ts`             | Add typed groups, implemented dashboard link, and explicit disabled/future item definitions without static `active` flags.                                                                                                      |
| `src/features/admin/components/admin-shell.types.ts` | Add only if needed to keep component/navigation types clear and shared.                                                                                                                                                         |
| `src/messages/ar.json`                               | Add `AdminShell` labels for brand, role, navigation groups/items, logout/pending logout, navigation toggle, unavailable items, and language controls.                                                                           |
| `src/messages/en.json`                               | Add matching `AdminShell` translations.                                                                                                                                                                                         |
| `public/images/admin/*`                              | Add only exact downloaded Figma assets that do not have a visually matching existing project asset/icon.                                                                                                                        |
| `src/app/globals.css`                                | Add semantic admin token(s) only where existing tokens cannot faithfully express a documented design role; do not add coordinate-based CSS.                                                                                     |
| `src/app/[locale]/admin/dashboard/page.tsx`          | Do not add dashboard feature content. Optionally replace its inline styles with a minimal localized page heading/content placeholder only if necessary to prove the shell slot; avoid turning it into dashboard implementation. |

## Implementation Sequence

1. Reconfirm the current admin layout, auth contract, locale navigation, token
   definitions, and profile-layout precedent before edits; preserve unrelated
   working-tree changes.
2. Download and inspect the exact Figma assets required by the shell. Compare
   each to current project/Lucide icons; retain only assets without a faithful
   existing match.
3. Add bilingual `AdminShell` messages and typed navigation configuration.
   Initially make only dashboard an active navigation destination; model future
   destinations safely as disabled/non-linked if product visibility requires
   them.
4. Build `AdminSidebar` with `useAuth`, `usePathname`, `Link`, and `useLogout`.
   Verify one active item, long-name truncation/accessible full name, pending
   logout state, and both text directions.
5. Build `AdminHeader` and language switching using existing locale-navigation
   utilities. Keep unsupported theme/account/notification behavior out of the
   interactive DOM.
6. Build `AdminShell` around those components, add the responsive drawer
   behavior, and place it in the guarded admin layout.
7. Add `AdminPageHeader` as a page-owned presentational helper. Keep
   Notifications wording out of every shell component and configuration.
8. Perform visual and behavior validation in Arabic and English, at desktop and
   narrow sizes; adjust tokens/layout only where discrepancies affect reusable
   shell behavior.

## Verification Plan

- Run `pnpm lint` and `pnpm build` after implementation.
- Add focused tests if the project’s test setup can exercise component behavior;
  otherwise manually verify the following against the running application:
  - unauthenticated and non-admin visitors remain governed by `RoleGuard`;
  - dashboard renders inside the shell and remains localized;
  - route-derived active styling works on direct load and navigation;
  - only implemented routes are clickable; future entries do not lead to 404s;
  - logout calls the existing hook, disables while pending, and follows its
    existing redirect behavior;
  - language switching preserves the current route and uses RTL/LTR correctly;
  - keyboard users can open, navigate, and close the small-screen drawer;
  - Arabic RTL places the desktop rail right and English LTR mirrors it left;
  - the layout remains usable at Figma desktop proportions and at narrow widths;
  - page content has no hard-coded Notifications title, description, user name,
    or feature content.

## Risks and Guardrails

- **Generated Figma output**: It uses absolute positioning and example data.
  Treat it only as visual evidence; do not paste it into the project.
- **Existing profile components**: They are close visual precedents but use
  static active state and raw anchors. Do not reuse them in a way that bypasses
  locale routing or route-derived state.
- **Figma assets**: MCP asset URLs expire. Download and commit required bytes
  during implementation, and do not create substitute SVGs.
- **No current theme/notifications/account feature**: Do not broaden this shell
  work by introducing behavior or backend endpoints for them.
- **App Router client boundaries**: Keep route layout authorization server-safe;
  isolate hooks and responsive interactivity to client components.
