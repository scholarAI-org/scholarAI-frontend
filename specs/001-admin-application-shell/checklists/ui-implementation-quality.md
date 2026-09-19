# Admin Shell UI Implementation Quality Checklist

Use this checklist during implementation and review of the reusable Admin
Application Shell. It applies to shell/layout code, not to future admin feature
pages.

## Figma Intent and Visual System

- [ ] The implementation uses the inspected Figma node as visual/design intent,
      not as generated source code or a set of literal x/y coordinates.
- [ ] Layout uses semantic flex/grid structure; absolute positioning is limited
      to genuinely necessary visual details.
- [ ] The desktop visual hierarchy is retained: brand and identity, grouped
      navigation, shared header controls, page-heading area, content slot, and
      bottom logout action.
- [ ] Figma proportions, type hierarchy, spacing, borders, backgrounds, and
      sidebar/header hierarchy are adapted responsively rather than fixed to the
      Figma viewport.
- [ ] Existing ScholarAI typography and semantic design tokens are used before
      adding any admin-specific token or raw value.
- [ ] Any Figma asset/icon with no faithful project equivalent is downloaded and
      committed as its genuine exported asset; no replacement SVG path is invented.
- [ ] Existing project/Lucide icons are reused only when they clearly match the
      intended glyph.

## Shell Boundaries and Components

- [ ] `AdminLayout` retains the existing `RoleGuard` and wraps its `children`
      in the reusable `AdminShell`.
- [ ] `AdminShell` contains shared frame behavior only and does not know
      individual admin page business content.
- [ ] The Notifications title, description, list, empty state, and other
      feature content are not implemented by the shell.
- [ ] No shared component hard-codes `إشعارات المسؤول` or any page-specific
      title/description.
- [ ] Page-specific headings are supplied by the child page (or a documented
      page-heading API), with exactly one `h1` per rendered page context.
- [ ] Sidebar, header, navigation configuration, and page-heading presentation
      have distinct, maintainable responsibilities; Figma grouping alone did not
      dictate component boundaries.
- [ ] Future admin routes do not require copying sidebar/header markup.

## Authentication and Session Integration

- [ ] Admin identity comes exclusively from `useAuth`/the existing
      `AuthProvider` current-user architecture.
- [ ] No parallel auth context, user store, current-user query, or session state
      was introduced.
- [ ] Identity display uses only available fields (`name`, `email`, `role`) and
      a safe derived initials fallback when needed.
- [ ] No example or fixed identity, including `م. خالد محمد`, appears in source
      code, messages, fixtures shipped to users, or shell UI.
- [ ] The logout action calls the existing `useLogout` flow.
- [ ] Logout’s pending/disabled state is represented accessibly and no cache,
      cookie, or redirect behavior is reimplemented in the shell.

## Navigation and Locale Routing

- [ ] Navigation is typed/configured data, grouped by product purpose, with no
      manually maintained `active` flags.
- [ ] Active state is derived from `usePathname` using exact and descendant
      route matching; only the most-specific matching item is active.
- [ ] Implemented destinations use locale-aware `Link` from
      `@/i18n/navigation`, not raw anchors or manually assembled locale prefixes.
- [ ] Unimplemented destinations are omitted or clearly unavailable and cannot
      navigate to dead routes.
- [ ] Language switching uses the existing locale-aware router, preserves the
      current path/query/hash where applicable, and does not introduce a second
      locale state.
- [ ] All visible labels, accessible names, pending text, and unavailable-state
      text are present in both `ar.json` and `en.json` through `next-intl`.

## Responsive and Bidirectional Layout

- [ ] Arabic/RTL displays the persistent desktop sidebar on the right.
- [ ] English/LTR mirrors the persistent desktop sidebar to the left and uses
      directionally correct alignment and icon behavior.
- [ ] Logical direction-aware CSS/Tailwind utilities are preferred over
      duplicated left/right layouts.
- [ ] At narrow widths, the persistent sidebar becomes an accessible drawer or
      disclosure without concealing navigation, logout, or page content.
- [ ] The small-screen navigation supports keyboard operation, an accessible
      name, focus management, Escape dismissal, and predictable close behavior.
- [ ] Main content remains `min-w-0`, scrollable, unclipped, and readable at
      desktop and narrow viewports.
- [ ] Long user names, translated labels, and future navigation labels wrap or
      truncate safely without breaking the rail or header.

## Accessibility and Code Quality

- [ ] Shell regions use semantic landmarks: `aside`, `nav`, `header`, and
      `main` as appropriate.
- [ ] Interactive controls are semantic buttons/links with localized accessible
      names, visible focus treatment, and keyboard support.
- [ ] Non-functional account, notification, or theme affordances are not
      represented as deceptive interactive controls.
- [ ] Icons are decorative only when adjacent text already names the action;
      otherwise they have an accessible label through their control.
- [ ] Color, focus, disabled, active, and hover states maintain usable contrast.
- [ ] Components are typed, avoid duplicated layout/auth/navigation logic, and
      follow the repository’s Tailwind and import conventions.
- [ ] `pnpm lint` and `pnpm build` pass after the implementation.
- [ ] Manual QA covers authenticated admin access, route-active state, logout,
      Arabic/RTL, English/LTR, Figma desktop proportions, and narrow viewport
      behavior.
