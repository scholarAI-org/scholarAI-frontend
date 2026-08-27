# Design System Update Report

**Source:** Figma file `1 (Copy)` (`akJGjAJkOgTWkqArmXLPbx`)
**Date:** 2026-08-27
**Scope:** Color tokens only (per instructions, no unrelated code changes)

## Summary

The Figma file contains two relevant sources of truth that don't always agree with each other:

1. **`Page 1` → `landing-ِAR`** — the actual landing-page mockup, with colors applied via named Figma Styles (`Navy`, `Green`, `Grey/Stroke`, `Primary/Orange`, etc.).
2. **`desaign system`** (a second canvas, literal typo in the Figma file itself) — a dedicated, documented style guide with swatches, hex labels, and dot-notation token names (`color.navy`, `color.greenFaint`, `shadow.md`, `space.4`, etc.), covering colors, typography, spacing, radius, shadows, buttons, inputs, badges, and feedback states.

Both were cross-referenced against the codebase's existing tokens in `src/app/globals.css` (the project's only design-token source — Tailwind v4 uses this CSS `@theme` block instead of a `tailwind.config.js`, and no `theme.ts`/`design-tokens.json` exists).

Most of the codebase's colors were already correct (several had been previously confirmed against the Landing page and were left untouched). This pass fixed the ones that were guessed/wrong, added tokens for colors that were already hardcoded ad-hoc in components, and fixed a real color mismatch (an eyebrow label using green instead of Figma's orange). Nothing outside color tokens was touched.

## Files modified

| File                                                                                                       | What changed                                                                                               |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [src/app/globals.css](src/app/globals.css)                                                                 | Fixed 2 guessed values, added 4 new tokens, re-derived 1 token from a raw color instead of a magic literal |
| [src/components/ui/AuthTabs.tsx](src/components/ui/AuthTabs.tsx)                                           | Hardcoded hex → new `--color-bg-tab` token                                                                 |
| [src/features/landing/components/ScholarshipCard.tsx](src/features/landing/components/ScholarshipCard.tsx) | Hardcoded hex → new `--color-gray-900` token                                                               |
| [src/features/landing/components/SectionHeading.tsx](src/features/landing/components/SectionHeading.tsx)   | Eyebrow badge recolored green → orange to match Figma                                                      |
| [src/features/auth/components/LoginPanel.tsx](src/features/auth/components/LoginPanel.tsx)                 | 3 inline gradients: literal navy rgba → `--color-navy-900` reference                                       |
| [src/features/auth/components/RegisterPanel.tsx](src/features/auth/components/RegisterPanel.tsx)           | 1 inline gradient: literal navy rgba → `--color-navy-900` reference                                        |

## Before / after: values changed

| Token                                                       | Before                                              | After                                               | Source / reason                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--color-green-50`                                          | `#16c17212` (guessed, ~7% alpha)                    | `rgba(22, 193, 114, 0.08)`                          | Figma `desaign system` → `color.greenFaint` (documented token)                                                                                                                                                                                                                                   |
| `--color-red-50`                                            | `#fef2f2` (guessed flat pink)                       | `rgba(220, 38, 38, 0.08)`                           | Figma style `Addtional/error` — no flat "red-50" swatch exists in Figma; the actual design uses a translucent red tint over white                                                                                                                                                                |
| `--color-red-500` comment                                   | "TODO: reasonable guess"                            | "Confirmed via Figma"                               | Figma `desaign system` → "Error" swatch = `#dc2626`, exactly matching the prior guess                                                                                                                                                                                                            |
| `--color-text-label`                                        | `rgba(30, 27, 51, 0.7)` (magic literal)             | `rgb(from var(--color-gray-900) r g b / 70%)`       | Same computed color, now correctly derived from the new `--color-gray-900` raw token instead of a duplicated literal (matches the project's existing `rgb(from ...)` pattern already used for `--gradient-panel-overlay`)                                                                        |
| `AuthTabs.tsx` tab strip bg                                 | `bg-[#F1F1FB]`                                      | `bg-[var(--color-bg-tab)]`                          | Same value, now tokenized. Figma style `Background/Tab` = `#F1F1FB` (exact match)                                                                                                                                                                                                                |
| `ScholarshipCard.tsx` badge text                            | `text-[#1E1B33]`                                    | `text-[var(--color-gray-900)]`                      | Same value, now tokenized. Figma style `Grey/text` = `#1E1B33` (exact match)                                                                                                                                                                                                                     |
| `SectionHeading.tsx` eyebrow bg                             | `bg-[var(--color-bg-success-subtle)]` (light green) | `bg-[var(--color-bg-accent-subtle)]` (light orange) | Figma style `Opacity/Orange` = `rgba(255, 141, 40, 0.1)`                                                                                                                                                                                                                                         |
| `SectionHeading.tsx` eyebrow text                           | `text-[var(--color-primary)]` (green)               | `text-[var(--color-text-eyebrow)]` (orange)         | Figma style `Primary/Orange` = `#f97316`, used **57 times** across the landing page as the color of small "eyebrow" labels above section headings (e.g. "Featured scholarships", "How it works"). The codebase had implemented these as green pills — visually confirmed the fix in a screenshot |
| `LoginPanel.tsx` / `RegisterPanel.tsx` gradients (4 places) | `rgba(2, 38, 71, 0.X)` literal                      | `rgb(from var(--color-navy-900) r g b / X%)`        | Same rendered color (`#022647` = `--color-navy-900`), now referencing the token instead of duplicating its RGB components — no visual change                                                                                                                                                     |

## New tokens added

| Token                      | Value                     | Figma source                                        |
| -------------------------- | ------------------------- | --------------------------------------------------- |
| `--color-orange-500`       | `#f97316`                 | Style `Primary/Orange`                              |
| `--color-gray-900`         | `#1e1b33`                 | Style `Grey/text`                                   |
| `--color-bg-accent-subtle` | `rgba(255, 141, 40, 0.1)` | Style `Opacity/Orange`                              |
| `--color-bg-tab`           | `#f1f1fb`                 | Style `Background/Tab`                              |
| `--color-text-eyebrow`     | `var(--color-orange-500)` | Semantic alias for the eyebrow-label use case above |

## Figma naming convention

Two different conventions are used in the file, and neither is fully consistent internally (see below):

- **Landing-page Figma Styles:** `Category/Name`, e.g. `Primary/Orange`, `Primary/Navy`, `Grey/Stroke`, `Grey/Label`, `Status/Success`, `Background/Tab`.
- **Design-system documentation page:** dot-notation design tokens, e.g. `color.navy`, `color.greenFaint`, `shadow.md`, `space.4`, `radius.md` (labels only — these aren't real Figma Variables, just text labels next to swatches).

The codebase's own convention (`--color-{hue}-{shade}` for raw tokens, `--color-{role}-{modifier}` for semantic tokens) was kept and extended, rather than adopting Figma's naming literally, to stay consistent with the rest of `globals.css`.

## Inconsistencies found (in Figma itself, not just the code)

These were **not** "fixed" by picking one value, since guessing which one the designer intended would risk a wrong sitewide change. Flagging for the design team to resolve at the source:

- **Two different reds:** `Addtional/Red100` = `rgba(220, 38, 38, 0.6)` vs. `Opacity/Red` = `rgba(255, 56, 60, 0.1)` — these are different hues (`#DC2626` vs `#FF383C`), not just different opacities of the same red.
- **Two different "faint green" values:** the landing page's `Opacity/Green` style = `rgba(22, 193, 114, 0.06)`, while the design-system doc page's `color.greenFaint` token = `rgba(22, 193, 114, 0.08)`. We adopted `0.08` (the explicitly-named, reusable design token) for `--color-green-50`.
- **Three near-identical off-white backgrounds:** `Background/Default` (`#F7F7F7`, used repeatedly on the real landing page and already matching the codebase's `--color-gray-50`/`--color-bg-page`), `Background/Page` (`#F8FAFC`, used on a landing-page section wrapper), and the doc page's `color.bg` (`#F7F8FA`, used as the demo screens' own backdrop). **Left `--color-bg-page` unchanged** since it has real, repeated landing-page precedent — changing it would be a sitewide background change on unconfirmed grounds.
- **Two case-sensitive style names with different values:** `Grey/Text` = `#434343` vs. `Grey/Text` (lowercase "t") = `#1E1B33` — likely a copy/rename mistake in the Figma file. The codebase only ever uses the `#1E1B33` value (now tokenized as `--color-gray-900`); `#434343` doesn't appear to be used anywhere in the actual mockups.
- **Two unrelated shadow scales:** the real landing-page components use `Shadows/1`, `Shadows/2`, `Shadows/green` (already exactly matched by the codebase's `--shadow-tab`, `--shadow-button`, `--shadow-badge-green`), while the design-system doc page defines an entirely separate scale (`shadow.xs` … `shadow.xl`, `shadow.navy`, `shadow.focus`) that isn't used anywhere on the actual landing page. Documented below, not applied — see "Not applied."

## Not applied — unresolved / needs designer input

- **`--color-teal-500: #00c8b3`** (the "full funding" badge on scholarship cards) — this color does **not appear anywhere** in the Figma file, under any name or context. Left unchanged; there's nothing in Figma to correct it against.
- **`#10B981`** (a decorative blurred glow circle in `Hero.tsx`) — also does not appear anywhere in Figma. Left unchanged.
- **Card shadow (`rgba(2, 38, 71, 0.08)`)** — used with _three different offsets_ in the codebase: `--shadow-card` (`0px 4px 12px ...`), and inline in `ScholarshipCard.tsx`/`FeatureCard.tsx`/`TestimonialCard.tsx` (`0_8px_24px ...`). Neither matches Figma's own documented `shadow.navy` (`0 10px 28px -6px rgba(2,38,71,0.35)`, a much stronger shadow). Since Figma itself doesn't resolve which shape is correct, this was left untouched rather than guessed — flagging for follow-up once a designer confirms the intended shadow.
- **`--color-bg-page` (`#f7f7f7`)** — see the three-way background inconsistency above. Kept as-is; real landing-page usage supports the current value, but Figma isn't fully consistent about it.

## Extracted but not applied (out of color/token scope for this pass)

Per the task's Design System scope, these were fully extracted for the record but not wired into the codebase, since none of them exist as tokens today and doing so is a larger structural addition than "update the corresponding [color] values":

- **Typography scale** (Figma `desaign system` page): Almarai 11px–36px sizes (`XS` 11px → `4XL` 36px), each with weight/line-height; separate Rubik weight variants (`regular`/`bold`/`meduim`) used elsewhere in the file at 8–28px. The codebase currently only has `--font-family-base`, no size scale.
- **Spacing scale**: `space.1` (4px) through `space.20` (80px), on a 4px base unit. No spacing tokens exist in the codebase today.
- **Border radius scale**: `sm` 8px, `md` 12px (**matches the codebase's existing `--radius-input`/`--radius-button`/`--radius-card`, already correct — no change needed**), `lg` 16px, `xl` 20px, `2xl` 24px, `full` 9999px.
- **Status/badge colors** not yet used by any component: `Info` `#3b82f6`, `Warning` `#f59e0b` (badge-text variant `#b45309`), plus badge-state colors for active/featured/under-review/rejected/draft states. No status-badge component exists in the codebase to apply these to yet.

## Verification

- `pnpm exec eslint` and `pnpm exec tsc --noEmit` both pass clean on all changed files.
- Visually verified in a headless browser: the landing page's eyebrow badges ("Featured scholarships", "How it works") now render in orange as in Figma, and the `/login` page (AuthTabs tab strip + panel gradients) renders identically to before, confirming the token-only swaps introduced no regressions.
