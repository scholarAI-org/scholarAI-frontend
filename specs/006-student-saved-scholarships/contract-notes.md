# Feature 006: Verified Contract and Reuse Constraints

**Inspected**: 2026-10-03  
**Purpose**: Preserve requested technical constraints separately from the behavior-focused [specification](spec.md). Evidence/planning input only, not an implementation plan.

## Checked-in contract

Source: `docs/api/openapi.json`.

| Operation                                        | Documented contract                                                                                                                                                                                                                                                                 | Consequence                                                                                                                                                             |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/scholarships/saved`                    | Authenticated; description claims discovery-card reuse and pagination. Optional page (default 1), page_size (default 20, max 100), skip (nonnegative), limit (1–100). 200 is an array of RecommendationScholarshipResponse with no total/page metadata. Documents 401/422, not 403. | Cannot assume complete unpaged array or invented paginated envelope. Q1 blocks backend confirmation of the required complete unpaged target and its length-based count. |
| `POST /api/scholarships/{scholarship_id}/save`   | 200 SavedScholarshipResponse; already saved safely returns existing record; 401/404/422.                                                                                                                                                                                            | Reuse existing save operation.                                                                                                                                          |
| `DELETE /api/scholarships/{scholarship_id}/save` | 200 UnsaveScholarshipResponse; already unsaved succeeds; 401/404/422.                                                                                                                                                                                                               | Real DELETE, pending guard, rollback, no double decrement.                                                                                                              |
| `GET /api/scholarships/{scholarship_id}`         | Positive integer; authenticated active account; ScholarshipDetailsResponse. 401 invalid auth, 403 account disabled, 404 missing/non-public, 422 validation.                                                                                                                         | Reuse canonical details route/query and existing truthful states.                                                                                                       |

The saved schema requires only id/title. Optional fields include title translations, university, country, deadline, funding amount, language requirements, ingestion type, slug, description, apply link, and status. It lacks documented is_saved, image_url, organization_name, study_level, funding_type, opportunity_type, no_deadline, and match enrichment. Casting it to the discovery type does not resolve the mismatch. Q2 requires backend alignment for the chosen card-compatible target; membership could establish saved state for reduced records, but a reduced-card policy is not selected.

Never call `GET /api/scholarships/recommendations`, despite the legacy response name. Do not introduce per-card detail enrichment without an agreed policy. Saved-specific 403/account-disabled meaning is not documented; handle forbidden defensively without asserting that meaning.

## Verified Feature 005 source

- `src/app/[locale]/student/layout.tsx` already owns RoleGuard and the only StudentShell mount. The saved route remains a thin Server Component by default; no nested shell.
- Reuse StudentHeader, StudentSidebar, StudentMobileNavigation, and typed navigation. Current first-prefix matching would select discovery for saved; current page-key detection treats any single scholarship segment as details. Bounded Feature 006 changes must recognize saved first and provide a unique active item and correct localized header.
- Reuse ScholarshipGridCard, ScholarshipImage, ScholarshipDeadline, ScholarshipBookmark, ScholarshipMatchBadge, ScholarshipCardModel, and existing adaptation logic. Prefer props/composition for minor presentation differences; no copied card/business logic.
- `toScholarshipCard` consumes ScholarshipDiscoveryCard; `isDiscoveryCardShape` requires boolean is_saved. Documented saved records do not satisfy it. After required backend alignment, any documented wrapper adaptation extends the shared normalization boundary; direct card output can reuse it directly. Raw description HTML is not rendered in saved cards.
- Match badge remains empty without authoritative enrichment; current normalization sets match null. No Figma high-match sample or profile inference.
- Details uses the existing `/[locale]/student/scholarships/[id]` and its query/states. No new page, full redesign, or unrelated return-navigation change.

## Query and mutation evidence

- `api/scholarships.ts` provides save/unsave/detail operations via apiClient; no saved-list fetch operation currently exists.
- `studentScholarshipKeys.savedLists()` reserves the saved family. `saved()` uses `list` and comments that the endpoint is unpaged; Feature 005 contract notes repeat this. Current OpenAPI parameters disagree. This is confirmed evidence that Feature 005 already uses an unpaged saved() key; no older paginated-key assumption is revived. Preserve that key for the required complete unpaged target, without page/page_size arguments; it does not independently prove backend completeness. Do not edit historical Feature 005 follow-ups.
- `lib/bookmark-cache.ts` updates is_saved optimistically in discovery envelopes and affected detail, cancels those queries, and rolls back only that scholarship's prior flag.
- Settlement already targets discovery, affected detail, and saved-list families. It does not remove/restore saved-array members or optimistically maintain their count. Feature 006 needs a bounded extension of the same system, not a parallel mutation implementation.
- Preserve bookmarkMutationKey(id) and per-ID pending guard across rendered copies. Current component-local failure state alone cannot guarantee feedback after optimistic card unmounting.
- Extend cancellation/snapshot/rollback/coherence to the clarified saved shape while preserving independent changes. Do not invalidate studentScholarshipKeys.all indiscriminately or unrelated filter-options/profile data. Existing 401 current-user/session recheck remains applicable.

## Design, i18n, images, and assets

- Populated Figma node 2297:3126 in file snMA3CewSOTzniE7qsGCaZ: 1440×1160 desktop, 236px sidebar, three approximately 369px cards with 24px gaps. Measurements are design intent, not fixed responsive widths or collection limits.
- Empty node 2358:7754: 200×200 illustration group 2358:7956 with concentric circles, document lines, bookmark overlay, then heading/copy/CTA. Inspect/export exact source assets during implementation under repository policy; deliver locally, never via temporary URLs. Project-native shapes/icons are allowed if no exact source asset exists.
- Both metadata structures were inspected for specification. No implementation design context/artwork was generated; final visual asset inspection belongs to implementation.
- Extend dedicated StudentSavedScholarships translations in src/messages/ar.json and en.json for page-specific copy; extend existing Student Shell page/label keys as needed. Shared card labels retain established localization.
- Reuse native lazy `<img>` for arbitrary backend hosts, stable aspect ratio, accessible real-image alt, decorative local neutral placeholder, malformed/load-error handling, and justified component-local @next/next/no-img-element suppression. No broad next.config remote-host allowlist or Figma sample-image fallback.
- Saved-page composition supplies 3/2/1 columns and scaling empty state using existing responsive shell/navigation; no separate mobile system.

## Evidence boundaries

No backend implementation/runtime response, total-count service, ordering guarantee, parameter precedence, or paging-termination behavior was verified. Contract contradictions remain explicit blockers. No application source, Feature 005 tasks, or backend contract was changed by this specification request.

## Clarification findings — 2026-10-03

### Exact current request and response

Authenticated `GET /api/scholarships/saved` has no path arguments or request body. OpenAPI declares HTTPBearer security; the frontend continues using established apiClient/session transport, not new token storage.

| Optional query parameter | Type and bounds       | Default       |
| ------------------------ | --------------------- | ------------- |
| page                     | integer ≥1            | 1             |
| page_size                | integer 1–100         | 20            |
| skip                     | integer ≥0 or null    | Not specified |
| limit                    | integer 1–100 or null | Not specified |

No parameter precedence, complete-list mode, or paging termination rule is documented. 200 is exactly `RecommendationScholarshipResponse[]`; there is no wrapper, embedded scholarship property, items envelope, total, page, page_size, or total_pages in the response. 401 and 422 are documented error responses.

**Classification**: A bare array with documented pagination/windowing inputs. It is not a paginated response object. Calling it a verified complete unpaged collection is also unsupported. The user's binary choices do not cover this current inconsistent contract; array shape alone does not establish unpaged semantics. There is no documented authoritative collection-total source. Returned array length measures returned items only until completeness is confirmed.

### Exact saved-item fields

| Field                                 | Schema                                        | Card implication                                                                                        |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| id                                    | Required integer                              | Scholarship-object identity; not the saved-record ID from the POST response.                            |
| title                                 | Required string                               | Shared title fallback.                                                                                  |
| title_ar, title_en                    | Optional string or null                       | Locale title selection.                                                                                 |
| university_name                       | Optional string or null                       | University fact available.                                                                              |
| country                               | Optional string or null                       | Country fact available.                                                                                 |
| deadline                              | Optional date string or null                  | Deadline fact available; no explicit no-deadline field.                                                 |
| ingestion_type                        | Optional enum scraped/manual; default scraped | Documented schema enum, not inferred matching data.                                                     |
| funding_amount, language_requirements | Optional string or null                       | Extra facts; funding amount is not funding_type.                                                        |
| slug, description, apply_link, status | Optional string or null                       | Not a replacement for missing grid-card metadata; description is source HTML, not rendered in the grid. |

Missing from this item schema: organization_name, study_level, funding_type, opportunity_type, image_url, no_deadline, is_saved, and match data. It is neither an embedded-scholarship wrapper nor SavedScholarshipResponse (saved-record id/user_id/scholarship_id/created_at/is_saved/message); that latter schema belongs to POST save only.

ScholarshipGridCard accepts the existing ScholarshipCardModel; its optional fields allow fallbacks/omissions, so a reduced factual card is technically possible after explicit adaptation establishing saved membership. However, the current discovery validator requires positive integer id, string title, and boolean is_saved; the saved transport is not directly compatible. Optional fields being absent does not justify fabricating them or imply the model must change. A reduced-card policy has not been chosen by the user for this feature.

### Canonical proposed target and backend obligations

Feature 006 targets a **complete unpaged array of student-visible, discovery-compatible scholarship card objects**, retaining studentScholarshipKeys.saved() and deriving header count from that array/cache length. Prefer existing ScholarshipDiscoveryCard output, including required id/title/is_saved and documented nullable card metadata. An explicitly documented wrapper containing that card would permit a small boundary adapter, but is not the chosen primary target and does not exist in the current contract.

Required before planning:

1. Align saved collection completeness and request documentation: remove or disambiguate pagination/default-window semantics and guarantee that the plain saved request returns the complete collection. No invented browser pagination or fetch-all traversal.
2. Align saved response schema with discovery-card data, and explicitly document visibility for deleted, expired, hidden/non-approved, and otherwise unavailable scholarships. No implicit per-item details enrichment. It may be considered only if product/backend explicitly chooses it as a temporary constraint in a later clarification.

This states the required product/API direction, not an already implemented backend contract. Current OpenAPI and runtime were not changed or runtime-verified.

### Saved-list cache and optimistic removal

Under the required aligned contract, saved cache data is the complete scholarship-card array, not saved-record metadata and not a paginated envelope. Header count is that same array's length; count is unknown before successful load. Removal follows the existing bookmark operation and real DELETE.

- Preserve the shared per-ID pending guard. Cancel affected in-flight saved/discovery/detail requests before optimistic changes so stale responses cannot overwrite them.
- Retain exact removed item, original index/order information, and that scholarship's discovery/detail prior is_saved flags. Remove only the matching item from saved cache, then derive count from its new length; do not decrement a separate guessed total.
- Failure restores that exact item at its original relative position among surviving items and its prior flags; preserve concurrent successful removals and prevent duplicate restoration. Original index alone is insufficient if other removals have shifted positions, so rollback must retain enough ordering context.
- Last-item optimistic removal shows zero/empty; failure restores one/populated. Mutation feedback survives card unmounting.
- Settlement invalidates only the existing discovery family, affected detail(id), and saved-list family; never studentScholarshipKeys.all. Settlement/refetch must not undo another pending optimistic operation.
- Save from other views uses the same architecture; reconcile saved membership with authoritative saved results without fabricating an incomplete new card.

These are bounded extensions needed in existing bookmark-cache logic; it currently updates discovery/detail flags optimistically and invalidates saved lists on settlement, but does not optimistically remove/restore saved-array membership.

### Visibility semantics

Discovery explicitly requires approved/published opportunities with deadline today or later (UTC), or explicit no-deadline with no date. Details explicitly shares availability rules and returns the same 404 for missing/non-public opportunities. Saved does not explicitly promise those rules, explain deleted joins, or define expired/hidden/non-approved handling. Its claim to reuse a card schema is not a visibility guarantee.

Preferred required saved behavior is backend filtering using the same current student visibility policy as discovery. The count consequently describes returned **viewable saved scholarships**, not all historical save records. No local status/deadline filtering, inaccessible-card rendering policy, or N+1 visibility checking is invented. The backend must confirm this semantic requirement within Q2 before planning. If an item becomes unavailable after a successful saved load, keep the existing Details 404 behavior for that race.

## Frontend-first / contract-first decision — 2026-10-03

The remaining backend contract gap is reclassified: it blocks only final production API integration and live acceptance, not the frontend implementation of Feature 006. Frontend planning and implementation proceed against the approved TARGET contract already described above; this is a scope reclassification, not a resolution of the backend obligations.

### Target frontend boundary

- Query: `GET /api/scholarships/saved` → authenticated, complete unpaged collection, every item discovery-card-compatible with `is_saved=true`, deterministic ordering, `response.length` is the authoritative saved count.
- Type boundary: `ScholarshipDiscoveryCard[]` through the shared `ScholarshipCardModel` + `toScholarshipCard` normalization and `ScholarshipGridCard`. No parallel `SavedScholarshipCard` domain model is created.
- Cache key: `studentScholarshipKeys.saved()` retained.
- Mutation: Feature 005 bookmark cache + mutation architecture (`ScholarshipBookmark`, `bookmarkMutationKey`, shared pending guard, discovery/detail/saved-list coherence). No second mutation system.

### Permitted frontend scope

Route, Student Shell navigation integration, Saved Scholarships page composition, populated/empty/loading/error states, saved count presentation, shared `ScholarshipGridCard` reuse, Details navigation, optimistic unsave with rollback, last-item→empty transition, i18n (ar/en), RTL/LTR, accessibility, responsive behavior (3/2/1 columns), Figma convergence, unit/integration tests, browser verification against controlled local target-contract fixtures.

### Prohibited production workarounds

- No N+1 `GET /api/scholarships/{id}` enrichment to synthesize card fields.
- No client-side reconstruction from the current legacy `RecommendationScholarshipResponse[]`.
- No invented image/funding/study-level data; no fake production saved scholarships.
- No hidden browser-side pagination assumptions.
- No mapping recommendation data into discovery data without an authoritative contract.
- No user-visible messaging that reveals internal backend-contract details.

### Response-validation boundary (live backend)

A narrow validator sits at the saved query. If the live `/api/scholarships/saved` response does not satisfy the target saved-card contract, the query fails as an integration/contract error and the page renders the localized retryable error state — never masquerading as confirmed empty, fabricating missing fields, or starting enrichment. This is the explicit, temporary live behavior until the backend contract is aligned.

### Local fixture policy (dev/test only)

Fixtures model the TARGET contract, not the current legacy one. Required scenarios:

1. populated saved collection
2. empty `[]`
3. one item
4. multiple items
5. last-item unsave
6. unsave failure + rollback
7. loading
8. 401
9. 403
10. generic 500
11. malformed/incompatible response
12. nullable card fields

Fixtures remain in test/dev infrastructure and are never shipped as production fallback data.

### Saved count

Target: `savedCount = saved collection length`. Fully implementable and testable against local fixtures now. Live acceptance of this count remains blocked until backend completeness semantics are aligned.

### Unsave

Fully implementable now using the Feature 005 bookmark mutation architecture:

- Remove the exact item from `studentScholarshipKeys.saved()` cache; count derives from new length.
- Discovery and affected detail `is_saved` remain coherent.
- Last item → empty state; failure restores the exact removed item at its original relative position.
- Accessible failure feedback survives card unmounting.
- Targeted invalidation on settlement only (`studentScholarshipKeys.saved*()`, discovery family, affected `detail(id)`); never `studentScholarshipKeys.all`.

### Figma

- Populated: `2297:3126` (file `snMA3CewSOTzniE7qsGCaZ`).
- Empty: `2358:7754`.
- Sample counts/content (including “4 saved scholarships” on the empty design) are visual examples only. Never render static runtime state from Figma, and never render fabricated match badges.

### Completion semantics

Feature 006 is dual-tracked:

- `FRONTEND IMPLEMENTATION COMPLETE` — reachable now against the target contract and local fixtures.
- `BACKEND INTEGRATION ACCEPTANCE BLOCKED` — remains blocked until the two backend obligations above are satisfied (complete unpaged response with authoritative total via array length; schema aligned to discovery-card data with discovery-equivalent visibility).

Tasks and the requirements checklist MUST preserve this distinction. Reaching the frontend-complete tier does not retire the backend obligations and does not permit any of the prohibited production workarounds above.

**FRONTEND PLANNING UNBLOCKED — READY FOR /speckit.plan (FRONTEND IMPLEMENTATION ONLY). LIVE BACKEND INTEGRATION ACCEPTANCE REMAINS BLOCKED UNTIL BACKEND CONTRACT IS ALIGNED.**
