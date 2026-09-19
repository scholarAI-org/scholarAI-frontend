# ScholarAI Frontend Constitution

## Core Principles

### I. Figma Informs, Application Architecture Leads

Figma is the source of design intent and visual truth; it is not source code.
Before implementing a Figma screen, engineers MUST inspect its structure and
identify reusable application concepts, layout regions, shared components,
page-specific content, and interaction states. Generated Figma React code MUST
NOT be copied verbatim.

Implementations MUST use semantic React components and normal flex or grid
layouts. Absolute positioning is permitted only where it is genuinely required
by the design.

### II. Reuse the Established Application System

Changes MUST reuse the existing project architecture, components, design
tokens, Tailwind conventions, routing, authentication, and internationalization
patterns. Components MUST have clear responsibilities and be reusable whenever
the concept is shared.

Shared shell components MUST remain generic: they MUST NOT hard-code
page-specific titles or business data. When a Figma asset is required, its exact
asset MUST be reused; replacement SVG artwork MUST NOT be invented when the
source asset exists.

### III. Preserve the Platform Contract

ScholarAI is a Next.js App Router application written in TypeScript, styled with
Tailwind CSS, localized with `next-intl`, and powered by React Query,
`AuthProvider`, and role-based layouts. New work MUST remain compatible with
these choices unless an explicitly approved architectural change supersedes
them.

Authentication state MUST come from the established `AuthProvider` and
current-user architecture. Duplicate authentication state, parallel session
stores, and competing current-user sources are prohibited.

Admin routes MUST remain beneath `/[locale]/admin` and MUST continue to be
protected by the existing `RoleGuard`.

### IV. Internationalization and Bidirectionality by Default

All user-facing text MUST support the existing Arabic and English
internationalization structure. No new visible copy may be embedded in a single
locale-only implementation.

RTL and LTR are first-class layout requirements. Layout, spacing, directional
icons, alignment, ordering, and interaction behavior MUST be verified in both
directions; a mirrored layout is not an optional later enhancement.

### V. Quality Is Part of Visual Fidelity

Every implementation MUST preserve accessibility, maintainability, responsive
behavior, and code clarity while matching design intent. Visual parity does not
justify inaccessible controls, brittle layout, duplicated business logic, or
unresponsive interfaces.

Semantic HTML, accessible names and keyboard behavior, responsive breakpoints,
and clear TypeScript types are required as appropriate to the component.

## Delivery Standards

- Start UI work by documenting the reusable and page-specific concepts implied
  by the design before coding.
- Prefer existing components and tokens; introduce a new shared component only
  when the concept is stable and has a clear responsibility.
- Keep data fetching and mutation behavior in the established React Query and
  feature-layer patterns.
- Validate affected views at relevant viewport sizes and in both Arabic/RTL and
  English/LTR before declaring the work complete.
- Review changed admin paths to confirm locale nesting and `RoleGuard`
  protection remain intact.

## Governance

This constitution governs all frontend implementation, review, and planning
work. A proposed exception MUST state the reason, scope, and rollback or
follow-up plan in the relevant specification or pull request.

Amendments require an explicit update to this document, a version increment,
and a compatibility review of active templates, specifications, and plans.
When guidance conflicts, this constitution takes precedence over ad hoc
implementation preferences.

**Version**: 1.0.0  
**Ratified**: 2026-09-17  
**Last Amended**: 2026-09-17
