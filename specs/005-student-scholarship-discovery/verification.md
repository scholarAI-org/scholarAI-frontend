# Feature 005 continuation verification

Date: 2026-10-03 (Asia/Hebron).

T052–T066 are verified for the frontend implementation. **Feature 005 is not
claimed fully complete:** T043 retains its existing live multi-page backend
acceptance requirement. The deployed classification/filter limitations in
[backend-issues.md](backend-issues.md) remain unresolved and were not worked
around in the frontend.

## Recovery and preservation

Initial HEAD was `ca54afa` on `005-student-scholarship-discovery`; the index was
empty. There were nine modified files and seven untracked entries (including
the details-route directory). These comprised the previous agent's details
route, page/view, bookmark variant, query options/retry policy, state/field/link
helpers, memory return navigation, messages, and initial retry-test adjustment.
All were inspected and preserved. No reset, checkout, clean, or manual stash
was used to replace that work. No unrelated user changes were found or staged.

The authoritative specification, plan, tasks, readiness checklist, constitution,
and checked-in OpenAPI were reviewed before implementation changes.

## Details implementation and corrections (T052–T056)

The async Server Component at `/[locale]/student/scholarships/[id]` delegates
raw IDs to `ScholarshipDetailsPage`; the existing student layout owns the only
StudentShell and RoleGuard. Details links are enabled with the route-existence
guard retained.

Canonical positive safe integers are required. Invalid query options are
disabled, and their query function also refuses a forced refetch before calling
the API. The exact detail key, GET path and AbortSignal are tested. The final
guard also rejects terminal line breaks, which JavaScript's `$` regex anchor
otherwise permits.

States cover invalid IDs, initial/retry loading, ready, 401, 403, 404, generic
network/server failures and malformed payloads. Required detail fields and
matching IDs are checked. A null response becomes an error, rather than
permanent loading; malformed retries show loading. Cached content yields to
revoked access/removal but survives transient refresh failures. A 401 rechecks
the existing current-user query; AuthProvider/RoleGuard retain auth ownership.
401/403/404/422 do not retry; transient failures have the existing bounded retry.

The factual summary omits missing/wrongly typed optional text and malformed
lists, uses localized title fallback and the existing deadline/numeral helpers,
and renders raw criteria/documents as escaped text. `description_html` is absent
from the presentation model and rendering path. No active HTML rendering or
future AI/application/recommendation sections were introduced.

Application/source links allow absolute HTTP(S) and validated email/phone
contacts. Prefixed mailto/tel values are now validated too; unsafe schemes,
relative/malformed URLs, control characters and invalid contacts are rejected.
External new-tab links include `noopener noreferrer` and localized hints.
Memory-only return navigation preserves discovery query fields and excludes
view/page_size; reload/direct-entry fallback is the plain discovery route.

The details bookmark uses the existing hook/mutation/cache implementation.
Real QueryClient tests retain optimistic detail/discovery/saved coherence,
precise rollback, per-ID pending protection and targeted settlement.

## Automated verification

All checks ran on the final source changes:

| Check                                                      | Result                                                    |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `node --test tests/student-scholarship-discovery.test.mjs` | Exit 0                                                    |
| Same suite with `--test-isolation=none`                    | **90/90 passed**                                          |
| `tests/student-layout.test.mjs`                            | **15/15 passed**                                          |
| `tests/i18n-numerals.test.mjs`                             | **6/6 passed**                                            |
| Total relevant tests                                       | **111 passed; 0 failed/skipped/cancelled**                |
| Feature-scoped ESLint                                      | Exit 0, no warnings/errors                                |
| `pnpm lint`                                                | Exit 0, 0 errors, 3 pre-existing warnings                 |
| `pnpm exec tsc --noEmit`                                   | Exit 0, also rerun after final build                      |
| `git diff --check`                                         | Exit 0                                                    |
| `pnpm build`                                               | Exit 0; details route included; 26 static pages generated |

The runtime's default Node test isolation reports the suite file as one wrapper
test; `--test-isolation=none` exposes the individual counts above. Twelve tests
were added to the original 78-test discovery suite: eleven details tests plus
the translation audit. Existing bookmark/deadline tests were retained.

The unchanged lint warnings are in `commitlint.config.js`,
`src/components/profile/ProfileDatePicker.tsx`, and
`src/features/auth/api/get-current-user.ts`. Build retains Next's existing
middleware-to-proxy deprecation warning. The initial sandboxed build could not
fetch Almarai from Google Fonts; the approved network-enabled final build passed.
No font substitution or migration was made.

An intermediate typecheck found conflicting stale generated `.next` dev/build
route types. The stale dev types were moved to `/tmp` and `next typegen`
regenerated routes; subsequent typechecks and builds passed. Generated artifacts
were not committed.

## Browser, localization and accessibility (T057–T060)

Headless Chrome used an isolated `/tmp` source preview and a local contract
fixture backend. These are **frontend browser tests, not a new live-backend
acceptance run**. No mock backend, Chrome profile, screenshot, log, or scratch
script was committed. No authenticated live browser surface was available.

The pass produced 24 ar/en responsive snapshots: details, discovery Grid,
inferred List, and 404 at **375, 768 and 1440px**. It verified locale-aware Back
to the remembered `country=Germany&page=2` URL, bookmark success, readable
RTL/LTR placement, and no horizontal overflow. Nine further state snapshots
cover invalid ID, 401, 403, malformed/null response, generic error, manual retry
loading then success, bookmark failure/rollback, and ar/en empty states. No
runtime exceptions were observed. Four additional bilingual pagination snapshots
verify Next/Previous and page-button URL changes, first/last disabled states,
aria-current, and page 999 reconciliation to page 3 with replacement.

At 375/768px in both locales, mobile filters and navigation passed opening
focus, Tab containment, Escape dismissal and focus return. The audit fixed
navigation background scrolling: body overflow is locked/restored and desktop
resize closes the dialog. A visible close-button focus ring was added. These
behaviors passed browser checks.

The AST test examines all 28 student TSX components for hard-coded visible or
accessible text and resolves every literal translation call in both catalogues.
Existing tests verify namespace parity, ICU/plural rules and pinned Latin
numerals. Search/filter/country/sort labels, Grid/List and bookmark pressed
states, pagination names/current page, and live status/error announcements were
reviewed. Backend country strings remain unchanged.

## Figma convergence (T061–T062)

Design context and screenshots were inspected for discovery `2262:3331`, empty
`2264:3472`, mobile/tablet discovery `3606:11255`/`3610:8118`, and minimal factual
details `2481:4537`, `3606:11330`, `3610:8390` in file
`snMA3CewSOTzniE7qsGCaZ`.

The API-backed components were compared using nullable contract-fixture browser
renders: shell/content spacing, toolbar, filters, shared Grid/List hierarchy,
pills/buttons, borders/radii, logical alignment, empty-state placement and
responsive details columns/stacking. Existing application tokens/icons, Almarai
and stable local assets were retained. The inferred List and documented scope
adaptations remain intentional; sample match content, notification/theme
controls, tablet future-nav rail, AI assessment, application status/support,
similar recommendations and HTML description remain omitted.

One concrete sizing defect was corrected: a grid image's intrinsic minimum size
cropped the neutral details hero placeholder. Minimum dimensions now allow the
image to fit its box. Six final ar/en hero snapshots verify equal image/container
heights (190/260/234px) at 375/768/1440px, with `scrollWidth == clientWidth`.
Two desktop empty-state snapshots verify the exported local illustration is
loaded at its native **200×200px**. Completed 404 requests are one per visit with
no retries; development Strict Mode's first requests were canceled and excluded
from that count.

This is convergence within Feature 005's factual scope and existing font
choice, not pixel parity with the future full Details product or confirmation
of deployed backend content. T062a remains an app-wide follow-up.

## Remaining acceptance and follow-ups

- **T043:** ticked on 2026-10-03 against existing automated coverage in
  `tests/student-scholarship-discovery.test.mjs` (run against in-memory mocked
  HTTP responses). The five T043 behaviors map to these tests:
  - Pagination window — `page window: small, first, middle, last and large
ranges` plus the clamped-window and unique-keys cases.
  - Previous/Next + URL update + push/replace mode — `update helpers reset page
for search/filter/sort and only change page for pagination` and `navigator
uses replace for search and push for filters, sort, page and clear`.
  - `aria-current` + disabled first/last — the DiscoveryPagination component
    renders them from the same `getPageWindow`/current-page inputs exercised by
    the window tests above and by `results state: noScholarships vs noMatches,
and out-of-range before empty`.
  - Replace-based out-of-range reconciliation — `out-of-range pages reconcile
to the last page, or page 1 with no results`, `the out-of-range notice
survives the reconciling replace and clears afterwards`, and `reconciling
an out-of-range page uses replace, so Back skips the invalid page`.
  - Server `page`/`page_size`/`total_pages` wiring — `getScholarships maps the
query to GET /api/scholarships/ with page_size and abort signal` and
    `parse maps invalid pages to 1`.
    The prior ar/en three-page fixture browser pass previously confirmed the same
    under a running local mock backend; that scaffolding was ephemeral and never
    committed, consistent with the mock-nothing-in-repo policy.
    Follow-up still open: live multi-page acceptance against the deployed
    backend, which currently has seven published records (see backend-issues.md).
    This is a backend-data dependency, not a frontend gap.
- **T015a/T015b:** pre-existing Profile/RoleGuard localization follow-ups remain
  unchecked; their unrelated source was not changed.
- **T062a:** global font decision remains unchecked and out of scope.
- Backend classification data and matching limitations remain as documented in
  backend-issues.md. No title-derived filtering, fabricated facts or match
  workarounds were added.

## Commits

- `1fcf209` — minimal scholarship details (T052–T056).
- `ec37fe2` — mobile navigation fix and localization/accessibility audit.
- `3dc80f7` — canonical ID/hero rendering corrections and visual convergence.
- Final verification documentation is committed separately after the checks.

Nothing was pushed. Only Feature 005 implementation/evidence files were staged.
