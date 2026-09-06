# RTL/LTR audit

Audited all application routes, layouts, shared controls, landing sections,
authentication forms, profile components, locale routing, and global CSS.

## Global direction and navigation

- The locale layout already renders `html lang="ar" dir="rtl"` and
  `html lang="en" dir="ltr"`. It remains the source of page direction.
- The client translation provider now receives the same locale explicitly.
- `next-intl` routing and middleware already support Arabic/English and retain
  locale-aware links. No routing redesign was necessary.
- Both existing profile language controls now switch locales. The current path,
  query string, and hash are preserved; the document direction updates on navigation.

## Corrections

| Area                                       | Correction                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile layout, form, stepper, calendar    | Removed hardcoded RTL overrides so these inherit page direction.                                                                                              |
| Profile text                               | Replaced fixed right alignment with logical start alignment.                                                                                                  |
| Sidebar, avatar action, notification badge | Replaced physical side placement/borders with logical equivalents.                                                                                            |
| Dropdown                                   | Start-aligned options, logically anchored popup and search icon, matching search padding.                                                                     |
| Date picker                                | Inherited direction, locale-aware calendar labels/display dates, popup constrained to its field width on small screens. ISO values remain unchanged.          |
| Shared inputs                              | Icon placement and padding resolve against the surrounding UI even when input text has its own direction. Both start/end icon positions are supported.        |
| Structured input values                    | Email, telephone, URL, profile identity/passport fields use LTR text direction; labels retain the page direction. Explicit input direction remains supported. |
| Mixed text                                 | Isolated displayed profile names, dropdown values, percentages, and the numeric `+100` badge to avoid bidi reordering.                                        |
| Progress                                   | Horizontal fill starts at the reading edge; the percentage remains at the opposite end without forcing the entire component LTR.                              |
| Directional icons                          | Forward and logout icons mirror; the scholarship arrow's hover movement follows its direction.                                                                |
| Authentication panel                       | Headings and brand text align to the reading edge.                                                                                                            |

## Deliberate exceptions

- The hero glow uses physical centering (`left: 50%` plus a negative half-width
  translation). It is symmetric and should not move with locale direction.
- The shared landing logo keeps inward text alignment next to its image.
- Vertical stacking/reversal, circular progress geometry, decorative image
  gradients, centered content, and nondirectional icons are unchanged.
- Physical input padding is intentional: Inherited direction variables resolve it on
  the UI wrapper before the input sets its own direction. This also avoids the
  CSS compiler rewriting `:dir()` selectors based on language instead of direction.
- Existing profile page copy and validation messages remain primarily Arabic.
  This audit fixes layout direction; it does not provide a full English
  translation of the profile feature.

## Verification

Browser checks cover the landing, login, registration, password recovery, and
profile routes in both locales at 1440, 390, and 320 pixel widths (30 combinations).
All passed document language/direction and horizontal viewport overflow checks.
Profile checks also passed sidebar/field ordering, nationality search and
selection, calendar direction and selection, and calendar viewport containment.
A language-switch round trip preserved path, query, and hash while updating
`html.dir`. No uncaught browser page errors occurred.

Screenshots of desktop/mobile landing, login, and profile pages were captured;
Arabic login and Arabic/English profile screenshots were visually reviewed.

Additional browser checks passed 16 combinations of UI direction, input text
direction, icon position, and standard/compact padding in each locale. Email
entry, password visibility toggling, dropdown search icon spacing, and progress
fill origin also passed.

TypeScript (`tsc --noEmit`), ESLint, formatting, and `git diff --check` passed.
ESLint reports three existing warnings: unused Geist font variables in the
locale layout and an anonymous default export in the commitlint configuration.
