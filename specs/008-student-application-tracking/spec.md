# Spec: 008-student-application-tracking

Short spec, written directly (no full Spec Kit run). The earlier attempt was never pushed, so this is a rebuild.

## Goal

A student page, **Application tracking** (`متابعة التقديم`), where a student sees every scholarship they track, changes its status, keeps a private note, and stops tracking it.

## Source of truth

- Design: Figma `vy2q4AYXDerSsF1U8xu6Gf`, node `2415:4656` (read on 2026-10-26).
- API: `docs/api/openapi.json` snapshot plus the notes in [contract-notes.md](./contract-notes.md).
- Layout/shell: the existing Student Shell. This feature only adds the page content and one nav item.

## What the Figma shows

1. Page title `متابعة التقديم` and a subtitle (header row, owned by the shell). The Figma subtitle promised "important dates", which the backend cannot store, so the shipped copy drops that promise: `تابع حالة كل منحة وسجّل ملاحظاتك الخاصة` / "Track the status of each scholarship and keep your own notes."
2. A row of **7 status cards** (icon, count, label). Order in RTL reading order, starting at the right:
   `saved / interested` (UI-only), `preparing_documents`, `ready_to_apply`, `applied`, `accepted`, `rejected`, `closed`.
3. A **vertical list of tracking cards**. Each card has:
   - a delete icon and an external-link icon (left side in RTL),
   - an orange `المنحة` pill (link to the scholarship),
   - a **status dropdown** (icon + label + chevron),
   - the scholarship title, and a meta line `organization — deadline — last update`,
   - a `ملاحظاتي` (my notes) block.

There are no columns and **no filter controls** in the Figma. The status cards are counters.

## Scope

In: the 7 cards, the list, status change, note edit, remove with confirm, loading / empty / error / edge states, optimistic updates with rollback, start-tracking wiring (hidden), flag, ar/en + RTL, 390 / 1024 / 1440.

Out: tablet-specific breakpoint work, `GET /tracked/statistics`, filters, "important dates" per application (no backend field), notifications, any mock data in runtime paths.

## Rules

- Flag `TRACKING_ENABLED`, server-only, default off, only the literal `"true"` enables it. Gate the route with `notFound()` before any fetch, and hide the nav item.
- Runtime uses only the real API through an adapter with zod validation. Fakes live only in `tests/`.
- Counts come from the real list. The `saved` card count comes from the saved list (`/api/scholarships/saved`), never from tracking. The two lists are independent.
- A card whose section failed to load shows an error/unknown state, never `0`.
- Timestamps from `/tracked` may have no timezone suffix (BE-08 pending). They are parsed defensively. See contract notes.
- The official-link icon renders only if the tracked item carries an official URL field (BE-03 pending). Otherwise it is hidden, with no placeholder.
- Start tracking uses `PUT /api/scholarships/{id}/tracking`, which does not exist before DEV on 28 Oct. It stays behind the flag and is not enabled until the endpoint answers.

## Behaviour

| Area           | Rule                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| List order     | As returned by the backend (newest first). No client re-sort.                                                                                 |
| Status change  | `PATCH /tracked/{id}/status`. Optimistic, rolled back on error. All 6 values are selectable.                                                  |
| Note           | `PUT /tracked/{id}/note` with `{ notes }`. Max 2000 characters, enforced in the form. Empty string clears it.                                 |
| Remove         | Confirm dialog, then `DELETE /tracked/{id}`. Optimistic removal, restored in its exact position on error. The bookmark is untouched.          |
| Counts         | Recomputed from the cached list, so they follow optimistic changes.                                                                           |
| Malformed item | A list item that fails validation is skipped and counted, not rendered. A response that is not an array is a contract error (error state).    |
| Error mapping  | By HTTP status (401/403/404/422/5xx/network), never by the Arabic `detail` text. 404 on a row action means the row is gone: refetch the list. |

## Phases

1. Spec and contract notes (this folder).
2. API layer, zod schemas, types, react-query hooks, error mapping. Tests with fakes.
3. Page UI per Figma.
4. Loading, empty, per-section error, edge states, optimistic updates with rollback.
5. `startTracking` wired from the scholarship card and details, hidden behind the flag.
6. Verification doc, Gate 2 checklist, Vercel flag instructions.
