# FE-11 / FE-12 — Scholarship details, report a problem, eligibility

Verification notes for `feat/fe-11-details`. The contract is the **live** backend
OpenAPI (`https://scholarai-tpxy.onrender.com/openapi.json`, fetched at the start
of the work and not committed).

## What was built

| Area                                                   | Where (`src/features/student/scholarship-details/`)                                                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Details contract: one zod schema + one adapter         | `schemas/details.schema.ts`, `lib/adapter.ts`                                                                                                  |
| Start tracking (`PUT /api/scholarships/{id}/tracking`) | shared `TrackScholarshipButton` from `application-tracking` (merged from 008b), passed in through `trackingSlot`; behind `TRACKING_ENABLED`    |
| Report (`POST /api/scholarships/{id}/reports`)         | `schemas/report.schema.ts`, `lib/report.ts`, `api/report.ts`, `hooks/useReportScholarship.ts`                                                  |
| Eligibility (`GET /api/scholarships/{id}/eligibility`) | `schemas/eligibility.schema.ts`, `lib/eligibility-adapter.ts`, `api/eligibility.ts`, `hooks/useScholarshipEligibility.ts`                      |
| Section visibility, page state                         | `lib/sections.ts`, `lib/view-state.ts`                                                                                                         |
| UI                                                     | `components/` (`DetailsHero`, `DetailsSections`, `DetailsActions`, `ReportDialog`, `ReportProblemCard`, `EligibilityIndicator`, page and view) |

Save/unsave reuses the existing optimistic bookmark code (`scholarship-discovery`);
its response body is not read, so it has no schema.

Feature flags (server-only, literal `"true"` enables, default off):
`SCHOLARSHIP_DETAILS_ENABLED` (existing), `SCHOLARSHIP_REPORTS_ENABLED`,
`SCHOLARSHIP_ELIGIBILITY_ENABLED` (new, documented in `.env.example`).

Real-session checklist: [`manual-test.md`](./manual-test.md).

## Mismatches: old frontend vs the live schema

1. `ScholarshipDetailsResponse` in `scholarship-discovery/types.ts` lacked six live
   fields: `application_status`, `opening_date`, `gpa_requirement`,
   `age_requirement`, `eligible_nationalities`, `academic_year`.
2. `study_level` was typed `string[] | string | null` (live: `ScholarshipStudyLevel[] | null`)
   and `funding_type` was `string` (live enum `full | partial`). Unknown values are
   still shown as received, as before.
3. The old hand-rolled validator required `ingestion_type` and `source`. The live
   schema marks them required, but the page needs only `id`, `title` and `is_saved`,
   so the new schema fails only on those three and hides the rest when missing.
4. The per-scholarship tracking endpoints (`GET`/`PUT /api/scholarships/{id}/tracking`,
   `ScholarshipTrackingResponse`) were in the live schema but not in the committed
   `docs/api/openapi.json` (refreshed in a separate commit). For details, eligibility,
   report and status schemas the committed file was identical to the live one. Start
   tracking is now the single implementation from 008b (see "Merge with 008b").
5. `GET /eligibility` returns the **scholarship's own criteria**, not a per-student
   match. The Figma "تقييم الأهلية" card (match level, per-criterion ✓/✗, "improve
   documents" button) has no backing endpoint, so it was not built. The live field
   is spelled `is_Softskills_required` (capital S).
6. `POST /reports`: the live responses are 201/401/403/404/409/422 (no 400, no 429).
   429 is handled defensively. The Figma modal has five reasons and no text box;
   the live schema also has `other` and an optional `description` (max 2000), so
   both were added. The response `message` (and the backend `detail`) are Arabic
   prose and are never shown.
7. The live DEV backend answered **401** for every scholarship id (including 564 and
   a non-existent id) without a session, so the uniform-404 behaviour could not be
   confirmed live.

## Assumptions

- No credentials were available, so end-to-end checks ran against a fake backend
  shaped like the live schemas (`scripts/fe-11-fake-backend.mjs`, dev-only, not
  imported from `src/`).
- Start tracking is the shared control from 008b (default status
  `preparing_documents`, behind `TRACKING_ENABLED`). This branch's own tracking card
  was removed; changing a status happens on the tracking page.
- An invalid id and a 404 render the same not-found state.
- The description limit counts code points (like the backend) on the raw input,
  before trimming; the body carries the trimmed text, or none when blank.
- `description_html` is never rendered (unchanged rule).
- Side column is 340px at 1024 and 449px from 1280 (Figma 1440 value); tile grids
  are two columns from 1280.
- Because eligibility shows the same facts as the main "Eligibility requirements"
  card for some fields (nationalities, levels, fields, language, GPA, age), the two
  overlap when both exist. It is behind its own flag so it can be dropped.

## Verified / not verified

Verified

- 58 new unit tests (contract 10, sections 6, state 9, report 11, report UI markup
  5, eligibility 10, flag defaults 7); the existing details/discovery tests were
  updated where the contract changed. `tsc --noEmit`, ESLint and Prettier clean on
  the touched files.
- Playwright (Edge, headless) against the fake backend: 26 behaviour checks pass —
  start tracking and status PUT, save toggle, dialog focus start, Esc, focus return,
  14 Tabs never leave the dialog, validation, 429 / 409 / 500 / success states, no
  Arabic backend text shown, sections hidden for minimal data, 404 == unknown id,
  no uncaught page errors.
- 24 screenshots reviewed by eye (below).

Not verified

- Any call against the real backend with a session (shapes follow the OpenAPI only).
- Real 409/429 behaviour; browsers other than Chromium/Edge; `next build`.
- Pixel-level comparison with Figma (compared visually: 2481:4537 and 2910:8705).
- Existing unrelated failures on Windows: `tests/google-auth.test.mjs` (does not
  run) and the image-fallback path assertion in `student-scholarship-discovery`.

## Merge with 008b

`origin/main` did not yet contain `feat/008b-tracking-finish` when this was done, so
that branch was merged into this one (a merge commit, no history rewrite) instead of
rebasing. Two conflicts (the route page and `ScholarshipDetailsPage`) were resolved by
keeping all three flags and passing 008b's `TrackScholarshipButton` to the new view
through `trackingSlot`. This branch's own start-tracking card, API, adapter, hooks and
tests were removed so there is exactly one implementation. The Playwright checks and
the screenshots below were taken **before** this merge, so the loaded-state shots still
show the removed "Application status" card.

## Screenshots

`{locale}-{width}-{state}.png`, locales `ar` / `en`, widths 1440 / 1024.

| State                                              | File suffix         |
| -------------------------------------------------- | ------------------- |
| Loaded (all fields, 3 flags on)                    | `loaded`            |
| Missing optional fields (only id, title, is_saved) | `missing-optional`  |
| 404                                                | `not-found`         |
| Error (500, with retry)                            | `error`             |
| Report modal open                                  | `report-modal`      |
| Validation errors (no reason + 2001 characters)    | `report-validation` |

Scholarship image is `null` in the fake data, so the local fallback shows.

## Reproduce

```sh
node scripts/fe-11-fake-backend.mjs            # 127.0.0.1:4111
BACKEND_URL=http://127.0.0.1:4111 SCHOLARSHIP_DETAILS_ENABLED=true \
  SCHOLARSHIP_REPORTS_ENABLED=true SCHOLARSHIP_ELIGIBILITY_ENABLED=true \
  corepack pnpm exec next dev -p 3111
# ids: 564 full, 565 minimal, 566 saved+tracked, 404 not found, 500 server error
# a report description containing force409 / force429 / force500 returns that status
```
