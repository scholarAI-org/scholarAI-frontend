# Feature Specification: Reusable Admin Application Shell

**Feature Branch**: `001-admin-application-shell`  
**Created**: 2026-09-17  
**Status**: Draft  
**Input**: User request: "Build the reusable Admin Application Shell for ScholarAI based on Figma node 2890:10329."

## Summary

Create the shared application frame used by all ScholarAI admin pages. The frame
provides the admin sidebar, shared top header controls, a page-heading region,
and a content slot. It interprets the referenced Figma screen as shell design
intent only; it does not implement the Notifications page or reproduce its
blank content area.

## Clarifications

### Session 2026-09-17

- The Figma title and description for "Admin Notifications" are page-specific
  examples and are not shell content.
- The main blank area in the design is the child-page content slot.
- Existing role protection, current-user state, logout behavior, locale routing,
  and localization patterns are integration constraints, not features to
  rebuild.

### Pre-Planning Design Decisions — 2026-09-17

The referenced node is interpreted as a desktop visual reference for a reusable
application frame. It does not define application data, route inventory, or
responsive behavior. The following decisions resolve the implementation
ambiguities without treating its coordinates as a specification.

| Topic                    | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell boundary           | The shell owns the app frame: sidebar, identity block, grouped navigation, logout placement, shared header-control area, optional shared page-heading region, and the child-content slot. A child page owns all business content, filters, tables, empty states, and page-specific actions.                                                                                                                                                                                                                |
| Notifications reference  | The visible Notifications title, description, and the large blank panel are not reusable shell UI. The blank panel is the child-content slot; the notification list itself is out of scope.                                                                                                                                                                                                                                                                                                                |
| Page headings            | A page may pass localized title and optional description to the shell’s heading region, or it may render a heading itself. These modes are mutually exclusive for a given page to prevent duplicate `h1` elements. The shell never stores titles/descriptions keyed by route.                                                                                                                                                                                                                              |
| Sidebar identity         | Read only supported current-user fields from `useAuth`: `name`, `email`, and `role`. The shell must not assume an avatar, job title, unread count, or additional profile data. If an avatar is not supplied by the existing user model, render an accessible initials/fallback treatment rather than fetch separate identity state.                                                                                                                                                                        |
| Header controls          | Current-user access, notifications, theme, and language are shell-owned control locations. A control is interactive only when it has an existing supported behavior or destination. Language uses the existing locale-routing mechanism. Theme switching, notification behavior, and account destinations must not introduce new providers, persistence, endpoints, or placeholder actions in this feature; unsupported controls are omitted or rendered as clearly unavailable, not as deceptive buttons. |
| Logout                   | Logout is a shell action near the sidebar’s lower edge and invokes the existing `useLogout` flow. It does not manage cookies, React Query cache, or redirect rules itself.                                                                                                                                                                                                                                                                                                                                 |
| Active navigation        | Define navigation as data with route-matching rules. Exact routes are active only on an exact match; section roots (for example, scholarships) are active for descendant paths. Only one item is active at once, selecting the most-specific matching destination.                                                                                                                                                                                                                                         |
| Navigation not yet built | The sidebar may expose product destinations that do not yet have a page only if they are deliberately represented as unavailable and cannot navigate to a dead route. Active, clickable links are limited to implemented routes. Adding a future route later changes the navigation data, not shell markup.                                                                                                                                                                                                |
| RTL/LTR                  | Direction follows the locale/document direction, never text heuristics. In Arabic/RTL the persistent desktop sidebar is on the right. In English/LTR it mirrors to the left unless product design explicitly standardizes a right-side rail for every locale. Logical CSS/Tailwind properties, direction-aware icon treatment, and DOM order that supports keyboard navigation are required.                                                                                                               |
| Responsive behavior      | The desktop sidebar remains persistent only while viewport width can accommodate it and readable main content. Below that breakpoint, navigation collapses into an accessible, keyboard-operable drawer or equivalent disclosure launched from the header; the current route remains identifiable and logout remains reachable. The main content region owns vertical scrolling, and shell controls may not be clipped.                                                                                    |
| Figma dimensions         | The desktop frame, panel, and spacing measurements in Figma are visual targets at its reference viewport, not fixed CSS dimensions. Use tokenized spacing and responsive min/max constraints. Avoid fixed viewport heights, coordinate positioning, and hard-coded blank-area dimensions.                                                                                                                                                                                                                  |
| Assets and icons         | Reuse exact Figma-exported assets when supplied. Otherwise use the project’s established icon system for semantic controls; do not draw replacement SVG artwork solely to imitate a screenshot.                                                                                                                                                                                                                                                                                                            |

**Open product decision with a safe default**: The current codebase exposes no
theme provider or notification destination. This shell feature will not create
either. If their behavior is not available at implementation time, the controls
must be absent or explicitly unavailable; product owners can enable them later
through a separately scoped feature.

## User Scenarios & Testing

### User Story 1 - Navigate between admin pages (Priority: P1)

As an authenticated administrator, I can use persistent grouped navigation to
move between admin areas while keeping the same application frame.

**Why this priority**: This establishes the reusable frame and makes the admin
information architecture usable before any feature-specific content exists.

**Independent Test**: Render two existing or fixture admin routes in the shell,
navigate through a sidebar item, and verify the selected item updates from the
current route while the sidebar and header remain present.

**Acceptance Scenarios**:

1. **Given** an authenticated admin visits an admin route, **When** the page
   renders, **Then** the sidebar, shared header, page-heading region, and page
   content slot are visible.
2. **Given** a sidebar navigation item maps to the current route, **When** the
   shell renders, **Then** that item is shown as active without relying on
   hard-coded page state.
3. **Given** an admin selects a navigation item, **When** navigation completes,
   **Then** the destination remains under the localized admin route and the
   same shell surrounds its content.

### User Story 2 - Identify and manage the current admin session (Priority: P1)

As an authenticated administrator, I can see my identity in the sidebar and
access shared account, notification, theme, language, and logout controls from
the shell.

**Why this priority**: The shell must expose the shared controls represented by
the design while preserving the project’s single source of authentication
truth.

**Independent Test**: Render the shell with the existing authenticated-user
provider and verify identity data is displayed from that provider; trigger the
logout control and verify the established logout flow runs.

**Acceptance Scenarios**:

1. **Given** a current authenticated admin, **When** the shell renders,
   **Then** their available identity information appears in the sidebar.
2. **Given** the shell is rendered, **When** the user inspects shared controls,
   **Then** user access, notifications, theme, language, and logout controls
   are available in their designated shell regions.
3. **Given** an admin uses logout, **When** logout succeeds, **Then** the
   existing logout behavior and post-logout navigation are used.

### User Story 3 - Supply page-specific headings and content (Priority: P1)

As an admin-page developer, I can provide that page’s title and supporting
description, or render its own heading, without editing the shared shell.

**Why this priority**: It prevents the Notifications reference content from
becoming coupled to every admin page and enables future routes to share the
frame.

**Independent Test**: Render the shell with dashboard heading metadata, then
with notification heading metadata, and verify each page renders its own
heading while the shell code remains unchanged.

**Acceptance Scenarios**:

1. **Given** an admin page supplies a title and description, **When** it is
   rendered in the shell, **Then** the page-heading region displays that page’s
   values.
2. **Given** an admin page elects to render its own heading, **When** it is
   rendered in the shell, **Then** the shell does not add a duplicate heading.
3. **Given** any child page, **When** it renders content, **Then** its content
   occupies the main content slot rather than a shell-owned blank panel.

### User Story 4 - Use the shell in Arabic and English (Priority: P1)

As an administrator using Arabic or English, I can use an equally functional,
readable admin shell in the correct document direction.

**Why this priority**: Bidirectionality and localization are required platform
behavior, not a later visual enhancement.

**Independent Test**: Render an admin route in Arabic/RTL and English/LTR; at
desktop and narrow viewports, verify direction-aware sidebar placement,
readable grouping, controls, and content layout.

**Acceptance Scenarios**:

1. **Given** the Arabic locale, **When** an admin page renders, **Then** the
   sidebar is persistently positioned on the right and directional UI follows
   RTL conventions.
2. **Given** the English locale, **When** the same page renders, **Then** the
   layout and directional controls follow LTR conventions.
3. **Given** either locale at a narrow viewport, **When** the shell renders,
   **Then** navigation and shared controls remain operable without clipped or
   inaccessible content.

## Functional Requirements

- **FR-001**: The system MUST provide one reusable admin shell/layout for
  admin child routes, including `/[locale]/admin/dashboard`,
  `/[locale]/admin/notifications`, and future
  `/[locale]/admin/scholarships/...` routes.
- **FR-002**: The shell MUST preserve the existing `RoleGuard` protection for
  all admin routes and MUST NOT create a second authentication or current-user
  state source.
- **FR-003**: The shell MUST use the established `AuthProvider`/current-user
  architecture for admin identity and the established logout behavior for its
  logout action.
- **FR-004**: In RTL, the persistent desktop sidebar MUST be on the right. In
  LTR it MUST mirror to the left, with all directional presentation adapting to
  the locale/document direction.
- **FR-005**: The sidebar MUST include the current admin identity, grouped
  application navigation, and a logout action anchored near its lower edge.
- **FR-006**: Implemented navigation entries MUST be actual application links;
  their active state MUST be derived from the current route using the
  most-specific route match. Destinations without an implemented route MUST NOT
  navigate to a dead page.
- **FR-007**: The shared top header MUST provide locations for current-user
  access, notifications, theme, and language controls. A location MUST become
  interactive only through an existing supported behavior or destination;
  unavailable behavior MUST be omitted or clearly unavailable, never presented
  as a deceptive interactive control.
- **FR-008**: The shell MUST expose a main content region for admin child pages.
  It MUST NOT render feature content such as notification rows, dashboard
  statistics, scholarship tables, or user-management data.
- **FR-009**: Admin pages MUST be able to supply a page title and optional
  supporting description to a shared page-heading region, or opt to render
  their own heading without duplicate shell content.
- **FR-010**: The shell MUST NOT hard-code the Figma reference title
  "إشعارات المسؤول" or its description.
- **FR-011**: All new user-visible copy MUST use the existing Arabic/English
  `next-intl` message structure.
- **FR-012**: The implementation MUST reuse established project components,
  Tailwind conventions, routing, and design tokens where they exist; it MUST
  use semantic elements and flex/grid before absolute positioning.
- **FR-013**: Shell controls and navigation MUST be keyboard accessible, have
  accessible names, and retain usable focus behavior.
- **FR-014**: The shell MUST remain responsive. At widths that cannot support a
  persistent sidebar and readable content, navigation MUST become an accessible,
  keyboard-operable drawer or disclosure; content scrolling and all shell
  controls MUST remain accessible.

## Key Entities

- **Admin shell configuration**: Shared structural configuration for sidebar,
  header controls, heading slot, and child-content slot; contains no page
  business data.
- **Navigation item**: A localized label, destination route, icon or asset when
  available, grouping membership, and route-matching rule used to determine its
  active state.
- **Page heading data**: Page-owned localized title and optional description;
  not owned by the shared shell.
- **Current admin**: The authenticated current user supplied by the existing
  auth architecture and displayed only through its supported identity fields.

## Non-Goals

- Implementing the Admin Notifications page or a notification list.
- Implementing dashboard statistics, scholarship management, user management,
  or any other admin business feature.
- Replacing or duplicating `AuthProvider`, `RoleGuard`, current-user fetching,
  or logout logic.
- Treating Figma-generated code or static rows as production implementation.

## Assumptions

- Existing admin routes continue to be nested beneath `/[locale]/admin`.
- The exact visual assets in the referenced Figma file will be reused when they
  are available to the implementation team; no substitute artwork is required
  by this specification.
- Theme and language controls will connect to existing capabilities when those
  capabilities exist. Introducing a new persistence model for either control is
  outside this feature unless separately specified.

## Success Criteria

- **SC-001**: A developer can add an admin child page that renders inside the
  shared frame without copying sidebar or header markup.
- **SC-002**: On every supported admin route, the active navigation item is
  correct after direct load and after in-app navigation.
- **SC-003**: Arabic/RTL and English/LTR shell renderings are usable at desktop
  and narrow viewport widths, with no inaccessible shell control or hidden page
  content.
- **SC-004**: A page can change its title/description without modifying the
  shared shell, and no notification-specific title or description appears on an
  unrelated admin page.
- **SC-005**: Admin access stays protected by the existing role guard and
  logout uses the existing session lifecycle.
