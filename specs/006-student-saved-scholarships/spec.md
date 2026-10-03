# Feature Specification: Student Saved Scholarships

**Feature**: `006-student-saved-scholarships`  
**Created**: 2026-10-03  
**Status**: Clarification recorded — frontend-first/contract-first; frontend planning unblocked, live backend integration acceptance remains blocked  
**Input**: Authenticated Student Saved Scholarships, reusing Feature 005, with truthful counts, removal, existing details navigation, an empty-state discovery action, Arabic/English, and responsive accessibility. Specification only; no application source changes.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View saved scholarships and their count (Priority: P1)

As an authenticated student, I can reach my saved scholarships from student navigation or a direct link, revisit bookmarked opportunities, and understand how many I have saved.

**Why this priority**: Returning to personally selected opportunities is the primary value.

**Independent Test**: Open a controlled collection containing more than three saved opportunities; verify membership, complete count, card actions, and active navigation without removing anything.

**Acceptance Scenarios**:

1. **Given** an authenticated student with saved opportunities, **When** Saved Scholarships opens, **Then** their actual saved opportunities appear with a localized collection-wide count, independent of visible cards.
2. **Given** three saved scholarships, **When** results load, **Then** the count is three; for four it is four, regardless of Figma sample content.
3. **Given** desktop or mobile navigation, **When** Saved Scholarships is activated, **Then** it is interactive and uniquely active inside the existing Student Shell; discovery is not simultaneously active.
4. **Given** nullable card metadata or unavailable images, **When** cards render, **Then** they remain usable with shared discovery fallback/omission rules and no invented facts.
5. **Given** absent authoritative match enrichment, **When** cards render, **Then** no match badge, score, compatibility label, or inferred ranking appears.
6. **Given** a complete saved collection exceeding 20 items under the required unpaged contract, **When** the page loads, **Then** every saved item is reachable without pagination and the count equals the complete returned collection length.

### User Story 2 - Remove a saved scholarship (Priority: P1)

As a student, I can remove an opportunity and immediately see membership and count change, with recovery if removal fails.

**Why this priority**: Managing bookmarks makes the collection useful and trustworthy.

**Independent Test**: Remove one of two saved opportunities successfully, then force failure on the remaining one; verify list/count recovery and bookmark agreement in discovery/details.

**Acceptance Scenarios**:

1. **Given** a saved card, **When** removal is activated, **Then** one real removal request starts with accessible pending feedback and repeated activation for the same scholarship cannot submit duplicates.
2. **Given** removal in progress, **When** optimistic feedback is applied, **Then** the card disappears and the count decreases immediately without a full-page reload; success confirms that change.
3. **Given** failed removal, **When** failure returns, **Then** the affected card and its count contribution return, localized feedback remains perceivable despite temporary card unmounting, and retry is possible.
4. **Given** exactly one saved scholarship, **When** removal succeeds, **Then** the page transitions to the empty state with zero; if removal fails, the card and count of one return.
5. **Given** overlapping removals for different IDs, **When** one succeeds and the other fails, **Then** only the failed item returns and the successful removal remains applied.
6. **Given** a removed item also appears in discovery/details, **When** either view is revisited, **Then** its bookmark agrees with the saved collection without a page reload.
7. **Given** an opportunity saved in discovery/details, **When** Saved Scholarships is revisited, **Then** its collection/count reconcile with the confirmed save without duplicate or fabricated cards.

### User Story 3 - Explore from an empty collection (Priority: P1)

As a student with no saved scholarships, I understand the empty page and can go directly to discovery.

**Why this priority**: New students and students removing their last bookmark need a useful next action.

**Independent Test**: Return a successful, confirmed empty collection; verify zero, illustration/copy, and the discovery action in each locale.

**Acceptance Scenarios**:

1. **Given** success confirming no saved scholarships, **When** the page renders, **Then** it shows the Saved Scholarships title, truthful zero, central illustration, empty heading, explanatory copy, and Explore Scholarships action.
2. **Given** either locale's empty state, **When** Explore Scholarships is activated with pointer or keyboard, **Then** the existing discovery destination opens in the same locale.
3. **Given** loading, failure, or a response whose completeness is not guaranteed, **When** page state is determined, **Then** it does not claim the complete collection is empty.

### User Story 4 - Open existing scholarship details (Priority: P2)

As a student, I can inspect a saved opportunity through the existing details experience.

**Why this priority**: Provides a useful next step while reusing a working destination.

**Independent Test**: Activate Details on a saved card and verify the existing details page receives its real identifier and current locale.

**Acceptance Scenarios**:

1. **Given** a saved card, **When** Details is activated, **Then** the existing details route opens for the real scholarship ID in the current locale.
2. **Given** a now-unavailable/non-public saved scholarship, **When** Details opens, **Then** the existing not-found experience appears rather than fabricated details.
3. **Given** keyboard navigation, **When** Details receives focus, **Then** it is a meaningful, visibly focused link distinct from the bookmark button.

### User Story 5 - Understand page states accessibly in either language (Priority: P1)

As a student, I can distinguish empty data from unavailable data and use the page in my language on my device.

**Why this priority**: Truthful, accessible states underpin every journey.

**Independent Test**: Exercise loading, refresh, invalid session, forbidden access, retryable failure, and removal failure in Arabic/English at desktop/tablet/mobile widths.

**Acceptance Scenarios**:

1. **Given** no loaded data, **When** the initial request is pending, **Then** loading is announced with appropriate placeholders; count is unknown, not sample content or a fabricated zero.
2. **Given** previously loaded results, **When** background refresh runs, **Then** usable prior results/count remain with refresh feedback; failed refresh shows an error without replacing results with the empty state.
3. **Given** an invalid/expired session, **When** access is rejected, **Then** the established session recheck and localized login flow applies; protected data is not presented as current authenticated results.
4. **Given** forbidden access, **When** a forbidden response arrives, **Then** localized access-unavailable feedback appears without empty-state substitution or automatic retry loops; account-disabled wording applies only where the contract establishes that meaning.
5. **Given** generic request failure, **When** results cannot load, **Then** localized error and keyboard-accessible Retry appear; successful retry recovers authentic results or confirmed emptiness.
6. **Given** Arabic or English, **When** the page is used, **Then** title, plural count, empty copy, actions, feedback, and accessible labels use that language with RTL/LTR logical ordering.
7. **Given** available desktop/tablet/mobile content space, **When** the page renders, **Then** cards adapt to three/two/one columns and empty content/CTA fit without horizontal overflow inside existing student navigation.

### Edge Cases

- Unknown count during loading is not zero; an empty response does not prove an empty collection until the required complete-list contract is guaranteed.
- Deleted, expired, hidden/non-approved, and otherwise non-visible scholarships require backend visibility filtering; the current saved contract does not establish their treatment. This is a backend semantic gap within Q2, not permission for frontend filtering or per-item details checks.
- Failed optimistic last-item removal restores the card and one count; failure feedback must survive card removal.
- Concurrent removals must restore only the failed item, not a stale whole-list snapshot that undoes other successes.
- In-flight refresh must not resurrect successful removals or double-decrement totals; repeated removal of already-unsaved membership must not produce negative count.
- Nullable image/provider/country/level/funding/deadline fields follow shared rules. Missing deadline data is not proof of no deadline; missing funding is not proof of funding type.
- Malformed records are reported through established malformed-card behavior, not silently converted to collection-wide emptiness; non-array responses are data errors.
- Duplicate identities must not produce duplicate cards or silently corrupt total: reconcile or report inconsistent data. A count must not silently become the number of renderable cards.
- Saved items can become unavailable in details; preserve existing indistinguishable missing/non-public not-found behavior.
- Authorization, not-found, or validation failure during removal restores optimistic membership unless authoritative reconciliation confirms otherwise.
- Saved-route detection must precede treating the path segment `saved` as a details identifier; nested route matching must not leave discovery active too.
- Focus on a removed card moves to a sensible surviving action or empty-state CTA, with the change announced.
- Count pluralization supports zero/one/two/few/many/other as required per locale; long titles/translations wrap safely.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Provide `/[locale]/student/scholarships/saved` for authenticated students, inheriting existing protection and exactly one shared Student Shell.
- **FR-002**: Enable Saved Scholarships in existing typed desktop/mobile navigation with Arabic/English labels and unique correct active-route state; leave unrelated future destinations unavailable.
- **FR-003**: Show only the current student's real saved collection from the authenticated saved service; never substitute discovery, recommendations, Figma samples, or browser-persisted bookmarks.
- **FR-004**: Under the required complete unpaged contract, display a localized plural-aware count equal to the successfully returned saved collection length. During optimistic removal use the length of that same updated collection; rollback restores the item and thereby the count. Never maintain an unrelated guessed count or substitute Figma samples or renderable-card count.
- **FR-005**: Feature 006 targets one complete unpaged array against the approved TARGET contract `GET /api/scholarships/saved`, without browser pagination state, pagination controls, or page/page_size query-key arguments. Frontend implementation proceeds against this target contract; if the live backend response does not satisfy the target saved-card contract, the saved query MUST fail safely as an integration/contract error and render the localized retryable error state without masquerading as empty, fabricating fields, or starting N+1 enrichment. Live-backend acceptance of complete-collection semantics remains blocked until the backend is aligned.
- **FR-006**: Saved results MUST be rendered through the existing discovery card type boundary (`ScholarshipDiscoveryCard[]` via the shared `ScholarshipCardModel` / `toScholarshipCard` normalization and `ScholarshipGridCard`), without per-item detail fetching, client-side reconstruction, or recommendation-to-discovery mapping without authority. The frontend defines a narrow response-validation boundary at the saved query: responses that do not satisfy the discovery-card contract are treated as contract errors (FR-005), never silently coerced. Live-backend acceptance of schema compatibility and discovery-equivalent visibility semantics (deleted/expired/hidden/non-approved) remains blocked until the backend is aligned.
- **FR-007**: Removal MUST use the real removal operation through the existing bookmark system, with per-scholarship pending guards and accessible pending feedback.
- **FR-008**: Optimistically update membership/count, confirm success without reload, and roll back failure without overwriting independent changes. Rollback MUST restore the exact removed item to its original relative position, preserving independent successful removals and count accuracy. Announced localized failures MUST remain perceivable after temporary card unmounting and allow retry.
- **FR-009**: Last successful removal MUST yield the empty state and zero; failed last-item removal restores card/count. Emptiness MUST derive from the complete saved collection, not an undocumented response window.
- **FR-010**: Saved/discovery/affected-details bookmark state MUST remain coherent after save, removal, failure, and refresh; reconciliation targets affected data with targeted invalidation after settlement only; never invalidate `studentScholarshipKeys.all` or unrelated data.
- **FR-011**: Details MUST use the existing `/[locale]/student/scholarships/[id]` with the real scholarship ID and current locale, without a second details page.
- **FR-012**: Confirmed zero results MUST show the supplied empty design's title, central illustration, heading, explanatory copy, and Explore Scholarships action with truthful zero.
- **FR-013**: Explore Scholarships MUST navigate to `/[locale]/student/scholarships` in the current locale through an accessible, visibly focused action.
- **FR-014**: Initial loading, populated, confirmed empty, refresh, refresh failure, auth/access rejection, generic retryable error, malformed data, and removal failure MUST be distinguishable. Errors MUST never masquerade as empty saved results.
- **FR-015**: Invalid authentication MUST use the existing auth flow; forbidden responses show access-unavailable feedback consistent with their documented meaning without empty-state substitution or automatic retries.
- **FR-016**: Reuse the established light Student Shell/card system with three desktop columns where space allows, adaptive two-column tablet layout, one-column mobile cards, approximately 24px desktop gaps, and fitting empty content/CTA.
- **FR-017**: Support Arabic RTL/English LTR from the start. Localize title, plural count, empty copy/CTA, loading/refresh, errors/retry, removal feedback, and accessible labels; do not embed single-language visible copy in components.
- **FR-018**: Provide meaningful page heading, logical reading order, keyboard-operable bookmark buttons, meaningful Details links, loading/error announcements, appropriate polite count-change feedback, visible focus, and existing mobile-navigation compatibility. Decorative illustration content MUST not add redundant spoken descriptions.
- **FR-019**: Absent authoritative match enrichment MUST yield no match badge/score/label. Do not fabricate compatibility or infer it from profiles.
- **FR-020**: Reuse established scholarship image handling: lazy loading, accessible real-image alt, stable aspect ratio, malformed/load-error fallback, stable local neutral placeholder; never Figma sample-image fallbacks.
- **FR-021**: Empty artwork MUST use stable local/project assets or project-native shapes/icons under the repository/Figma policy; retain an exact available source asset rather than inventing a replacement, and leave no temporary Figma runtime URLs.
- **FR-022**: Reuse Feature 005 shell/navigation, normalized model/adaptation, card primitives, details route, bookmark behavior, query architecture, localization, and image policy. Necessary extensions MUST be bounded to saved-page behavior, not duplicated business logic.
- **FR-023**: The saved route (`/[locale]/student/scholarships/saved`) and its `nav.saved` ("المحفوظات" / "Saved") nav item MUST sit behind a single feature flag that is OFF by default. While OFF, no nav item appears for saved in either sidebar or mobile navigation, and the saved route itself MUST return `notFound()` from the server component before any data fetch or client render. The flag MUST be a server-readable, build-time or environment-driven value — never a client/browser toggle, cookie, or query parameter. Local dev and automated tests MAY enable the flag against target-contract fixtures. The flag flips ON only after live backend contract acceptance passes; the flip MUST be a reviewable, auditable change (environment-variable or committed constant), not an implicit effect of the frontend merging. A guard test MUST fail if any committed source enables the flag by default or embeds an unconditional `true` default.

### Key Entities _(include if feature involves data)_

- **Saved collection**: Current student's bookmarked opportunities and complete count, authoritative from backend with provisional removal changes awaiting confirmation.
- **Scholarship card**: Authentic identity/localized title, available nullable facts, saved membership, and optional authoritative match enrichment; the same card concept as discovery.
- **Bookmark operation**: Per-scholarship save/removal with pending/confirmed/failed status and recovery preserving independent operations.
- **Saved-page state**: Loading, populated, confirmed empty, refreshing, error, or access unavailable; count is unknown until trustworthy collection data exists.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For controlled collections of zero, one, three, four, and more than 20 saved scholarships under the required complete unpaged contract, 100% of saved opportunities are reachable and displayed total matches the confirmed complete collection.
- **SC-002**: Every successful membership removal decreases count by exactly one without page reload; last-item success yields zero and the empty-state discovery action.
- **SC-003**: Every forced removal failure restores only affected membership/count, including overlapping independent operations, and exposes perceivable localized feedback.
- **SC-004**: Loading failures, refresh failures, unauthorized/forbidden access, and malformed data produce zero false empty-state outcomes in acceptance testing.
- **SC-005**: Desktop/mobile navigation, Details, and empty-state discovery are usable by keyboard/pointer in both locales; every action has visible focus and a meaningful accessible name.
- **SC-006**: At representative 1440px, 768px, and 375px widths, both locales have no horizontal page overflow and use three/two/one columns respectively where content space permits.
- **SC-007**: All specified visible/accessibility copy exists in both languages with correct direction/plurals; zero fabricated match values or Figma sample counts appear.

## Assumptions

- Feature 005's implemented source is the reuse baseline; historical documentation does not prove described capabilities are implemented. Exact inspected evidence and integration constraints are in [contract notes](contract-notes.md).
- Figma file `snMA3CewSOTzniE7qsGCaZ`, populated node `2297:3126` and empty node `2358:7754`, supplies desktop intent. Both node structures were inspected. Tablet/mobile follow Feature 005.
- Three visible Figma cards and sample “4 saved scholarships,” including four on the empty design, are illustrative only.
- Order remains backend-provided; no local sorting/search/filter requirement is assumed.
- Usable last-known data can remain during ordinary refresh with status/error feedback; access rejection supersedes that presentation.
- Immediate bookmark removal and failure recovery are sufficient; no confirmation dialog or separate re-save workflow on this page is required.
- OpenAPI establishes a bare array with documented pagination arguments, not a paginated response object or a verified complete unpaged response. The required unpaged, card-compatible, visibility-filtered target remains a backend contract change, not a claim about current runtime behavior.

## Explicit Out of Scope

- Application source changes during specification/clarification; implementation plan/tasks generation or deployment.
- Dark mode, recommendations integration, AI matching, profile-based compatibility, fabricated scores/labels, highest-match sorting.
- Search, filters, sorting, saved folders/categories, browser pagination state, pagination UI, or invented paging semantics.
- Application tracking, document enhancement, notifications backend, admin work.
- A new details page or full details redesign.
- Global font migration, unrelated Student Shell redesign, duplicated shell/auth/card/business logic.
- Broad remote-image allowlists, temporary Figma runtime assets, sample-image fallbacks.
- Closing/modifying unrelated Feature 005 follow-ups including T043, T015a, T015b, and T062a.

## Clarifications

### Session 2026-10-03

- Q: Can current saved results provide a verified complete collection count? → A: OpenAPI returns an array but documents page/page_size and skip/limit, with no total. The existing unpaged saved() key is confirmed evidence of frontend intent, not proof of backend completeness. Feature 006's canonical target is a complete unpaged array and count from the same saved cache length, without pagination state/keys; backend contract alignment is required before planning.
- Q: Are current saved items directly compatible with discovery cards and guaranteed student-visible? → A: They are limited scholarship objects, not wrappers or save-record metadata, and lack required is_saved plus several card fields. Require card-compatible saved output and explicit discovery-equivalent visibility semantics; reuse shared normalization after alignment. No implicit N+1 details enrichment is accepted.
- Q: Does the unresolved backend contract gap continue to block Feature 006 planning as a whole, or can frontend implementation proceed independently against the approved target contract? → A: Reclassify as frontend-first / contract-first. The backend contract gap is real but blocks only final production API integration and live acceptance, not the frontend implementation of route, Student Shell navigation, page composition, populated/empty/loading/error states, saved count, shared `ScholarshipGridCard` reuse, Details navigation, optimistic unsave + rollback, last-item→empty, i18n, RTL/LTR, accessibility, responsive behavior, Figma convergence, unit/integration tests, and browser verification against controlled local target-contract fixtures. Frontend code is written to the approved TARGET boundary (`GET /api/scholarships/saved` → authenticated, complete unpaged, discovery-card-compatible, `is_saved=true` on every item, deterministic ordering, `response.length` as authoritative saved count), reusing `ScholarshipDiscoveryCard`, `ScholarshipCardModel`, `toScholarshipCard`, `ScholarshipGridCard`, `ScholarshipBookmark`, `studentScholarshipKeys.saved()`, and the Feature 005 bookmark cache/mutation architecture — no parallel saved-card domain model and no second mutation system. No production workaround is permitted: no N+1 `GET /api/scholarships/{id}` enrichment, no client-side reconstruction from `RecommendationScholarshipResponse`, no invented image/funding/study-level data, no fake production saved scholarships, no hidden pagination assumptions, no mapping recommendation data into discovery data without authority. A narrow response-validation boundary at the saved query treats any live response that does not satisfy the target saved-card contract as an integration/contract error and renders the localized retryable error state — never masquerading as empty, fabricating fields, or starting enrichment. User-visible messaging MUST NOT reveal internal backend-contract details. Local target-contract fixtures (populated, empty `[]`, one item, multiple items, last-item unsave, unsave failure + rollback, loading, 401, 403, 500, malformed/incompatible response, nullable card fields) are test/dev infrastructure only — never shipped as production fallback data. Figma populated `2297:3126` and empty `2358:7754` sample counts/content (including “4 saved scholarships”) are visual examples only, never static runtime state, and fabricated match badges are not rendered. Completion is explicitly dual-tracked: Feature 006 may reach FRONTEND IMPLEMENTATION COMPLETE while BACKEND INTEGRATION ACCEPTANCE remains BLOCKED, and this distinction MUST be preserved in tasks/checklist.

Current facts, the proposed target, and remaining backend obligations are distinguished in [contract notes](contract-notes.md). These findings are evidence-based; no interactive questions were asked or backend answers invented. The original two backend obligations remain pending alignment for live acceptance; frontend planning and implementation are unblocked against the target contract.

**FRONTEND PLANNING UNBLOCKED — READY FOR /speckit.plan (FRONTEND IMPLEMENTATION ONLY). LIVE BACKEND INTEGRATION ACCEPTANCE REMAINS BLOCKED UNTIL BACKEND CONTRACT IS ALIGNED.**
