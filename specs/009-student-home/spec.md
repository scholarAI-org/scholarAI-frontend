# Feature Specification: Student Home

**Feature Branch**: `feat/009-student-home`

**Created**: 2026-10-24

**Status**: Approved (clarifications resolved 2026-10-24)

**Input**: User description: "Build the authenticated student Home page (Figma file vy2q4AYXDerSsF1U8xu6Gf, node 2353:5365; desktop only). Header, welcome card with today's date and profile completion, four stat cards, upcoming deadlines, recent activity, latest recommendations (locked below 70% profile completion). Sections with an existing backend API use real data; sections without one may use a flagged, contract-validated mock source that is never reachable in Production or Preview, and are hidden otherwise."

**Design source**: Figma `vy2q4AYXDerSsF1U8xu6Gf`, frame `2353:5365` ("Student-Home-null", 1440×1127, Arabic/RTL). Desktop only. Mobile is a later feature; Tablet and Admin are out of scope.

## Clarifications

### Session 2026-10-24

Status: **resolved** by the product owner on 2026-10-24. Options considered are in [clarifications.md](./clarifications.md).

- Q1: What should "Latest recommendations" show at 70% completion or higher? → A: The 3 newest published scholarships from the existing discovery list (sorted newest first) in the existing scholarship card, titled "Latest scholarships", with no match score. (FR-034)
- Q2: Which URL, and a sidebar item? → A: `/student` plus one "Home" sidebar item. (FR-002, FR-004)
- Q3: Release flag? → A: Yes. `STUDENT_HOME_ENABLED`, server-only, off by default. "Turn on `STUDENT_HOME_ENABLED`" is a launch-checklist item in verification.md. (FR-003)
- Q4: Bell and theme toggle? → A: **Changed from the recommendation.** Hide both entirely, with no disabled controls. The bell appears only when a notifications source exists. There is no theme toggle. (FR-008)
- Q5: Do accepted, rejected or closed tracked items count as upcoming deadlines? → A: No, they are excluded. (FR-020)
- Additional rules: Home MUST NOT call `GET /api/scholarships/recommendations` (it returns unpublished and closed scholarships). With the notifications card hidden, the stat-card row MUST lay out correctly with 3 cards (and with 4 when a notifications source exists). Backend asks are named by title, not by ClickUp number.

## Data Source Investigation _(recorded before writing requirements)_

Sources: `docs/api/openapi.json` (Scholar AI API 1.0.0) and the frontend code on `main` at `18c1453`.

| Home section                      | Backend source                                                                                                                                                                                                                                                                                                                                         | Status           | Behavior on Home                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Student name (greeting, welcome)  | `GET /auth/me` → `CurrentUserResponse.name`, already provided to every student page by the existing current-user source.                                                                                                                                                                                                                               | **Exists**       | Real data.                                                                                                                           |
| Profile completion %              | (a) `GET /profile` → `UserProfile.profile_completion_percentage` (number, 0–100, default 0). The frontend already reads it (Profile page summary ring). No separate frontend calculation of an _overall_ percentage exists; only per-step percentages exist.                                                                                           | **Exists**       | Real data. Never mocked.                                                                                                             |
| Saved scholarships count          | `GET /api/scholarships/saved` (unpaged array, only listings still visible: deadline today or later in UTC, or explicit no-deadline). Already used by Feature 006.                                                                                                                                                                                      | **Exists**       | Real data: length of the saved list.                                                                                                 |
| Applications in progress count    | `GET /api/scholarships/tracked` (array of tracked applications, all statuses incl. closed and expired; each embeds the scholarship card). Statuses: `preparing_documents`, `ready_to_apply`, `applied`, `accepted`, `rejected`, `closed`. Also `GET /api/scholarships/tracked/statistics` returns per-status counters.                                 | **Exists**       | Real data: tracked items whose status is not `accepted`, `rejected` or `closed`.                                                     |
| Upcoming deadlines (list + count) | Derived from the saved list and the tracked list above.                                                                                                                                                                                                                                                                                                | **Exists**       | Real data, derived on the student's device (see FR-020 to FR-027).                                                                   |
| Unread notifications count        | (b) Only `GET /admin/notifications/unread-count` and `GET /admin/notifications` exist, and they require the **admin** role. There is no student notifications endpoint.                                                                                                                                                                                | **Missing**      | Mock (flagged) or hidden. Backend ask: student notifications unread count.                                                           |
| Recent activity                   | (b) No activity or event-feed endpoint for students. The admin audit log is admin-only and is a different concept.                                                                                                                                                                                                                                     | **Missing**      | Mock (flagged) or hidden. Backend ask: student notifications unread count.                                                           |
| Latest recommendations            | (c) `GET /api/scholarships/recommendations` exists but is documented as a "public feed of all scholarships, ordered by ID, regardless of status" (it includes unpublished/closed listings and full description HTML). It is not personalized. The discovery list says "personalized match ranking is unavailable" and accepts no profile-based filter. | **Not suitable** | Locked state is real (driven by real completion). Unlocked state: see FR-034. Backend ask: personalized scholarship recommendations. |

Other findings:

- **Tracking feature types**: the Tracking feature is not on `main` (another session is building it in a separate worktree). Home uses a minimal local type for a tracked application and records it for later consolidation.
- **Saved count definitions differ**: `tracked/statistics.saved_scholarships` counts _all_ saved records including expired listings, while `GET /api/scholarships/saved` returns only listings still visible. Per product decision Home uses the saved list, so the Home count always equals the number of items the student sees on the Saved page.
- **No student theme system**: the app has no dark/light theme. The landing page shows its theme button disabled with "Theme switching is currently unavailable".
- **Post-login landing**: students currently land on `/student/profile` after login (set by the auth module). Changing it is out of scope for this feature, because auth must not be modified.

## Design Notes _(Figma is design intent, not data)_

- **Placeholder names disagree across the frame**: header greeting "أحمد الحجار", user chip "أحمد العمري", sidebar "أحمد النجار", welcome card "أحمد". All are placeholders; the page shows the real name of the signed-in student.
- **Notification count inconsistency (flagged)**: the "unread notifications" stat card shows **10**, while the sidebar "Notifications" item badge shows **2**. Both represent the same fact. When a real source exists, every place that shows the unread count MUST show the same number from the same source.
- **Static date**: "اليوم: ٢٣ أغسطس ٢٠٢٦" is static text. The page shows _today's_ date. The design uses Arabic-Indic digits there, while the project pins Latin digits in every locale; the project rule wins.
- **Example deadlines exceed the default window**: the design's deadline rows show 11, 50 and 196 days remaining, with red, amber and green badges. These are sample values. The window and thresholds are defined in FR-022 and FR-024.
- **Stray element**: a "90%" ring (`2353:5383`, Group 23) sits behind the content area at x=402, y=494 and is not visible in the composed frame. It is treated as a leftover and not built.
- **Avatar initials**: the welcome avatar shows two letters ("أح"). The rest of the app (sidebar, header chip) shows one initial derived from the display name.
- **Sidebar**: the design's sidebar shows a "Home" item (active) and items that do not exist yet (Application tracking, Document improvement, Notifications, Settings). The existing sidebar is reused and not rebuilt. "Document improvement" is out of scope.
- **Header**: the Home header shows a greeting, a subtitle, a notification bell, a theme toggle (sun icon), a language toggle ("En") and the user chip. The current shared student header has only the page title and subtitle, the language toggle and the user chip.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See my personal overview at a glance (Priority: P1)

A signed-in student opens Home and immediately sees a personal greeting with their real first name, today's date in their language, and how complete their profile is (percentage and progress bar).

**Why this priority**: It is the entry point of the student area and the first thing the student sees. It works with real data that exists today.

**Independent Test**: Sign in as a student with a known name and profile completion, open Home in Arabic and English, and confirm the greeting, today's date and the percentage match the account.

**Acceptance Scenarios**:

1. **Given** a student named "Ahmad Hajjar" with 40% profile completion, **When** they open Home in English, **Then** the header greets "Hello, Ahmad Hajjar", the welcome card says "Welcome back, Ahmad", shows today's date in English, and shows 40% with a bar filled to 40%.
2. **Given** the same student, **When** they switch to Arabic, **Then** the same content appears in Arabic, right-to-left, with today's date in Arabic and Latin digits.
3. **Given** the profile completion cannot be loaded, **When** Home renders, **Then** only the completion area shows an error with a retry action, and the greeting and date still show.
4. **Given** a student whose name is empty, **When** Home renders, **Then** the greeting falls back to a generic greeting without a name, with no broken punctuation.

---

### User Story 2 - Know what needs my attention: counts and upcoming deadlines (Priority: P1)

The student sees how many scholarships they saved, how many applications are in progress, how many deadlines are coming soon, and a short list of the three nearest deadlines, each with a "days remaining" badge colored by urgency.

**Why this priority**: Missed deadlines are the core problem the platform solves. All the data exists in the backend today.

**Independent Test**: Seed a student with saved and tracked scholarships at known deadlines (including one that is both saved and tracked, one expired, one beyond the window, one without a deadline). Open Home and check the three counts, the three rows, their order and badge colors.

**Acceptance Scenarios**:

1. **Given** 3 saved scholarships, **When** Home loads, **Then** the "Saved scholarships" card shows 3.
2. **Given** tracked applications with statuses preparing documents, ready to apply, applied, accepted, rejected and closed, **When** Home loads, **Then** "Applications in progress" shows 3.
3. **Given** a scholarship that is both saved and tracked with a deadline in 5 days, **When** Home loads, **Then** it appears once in the deadline list and counts once in "Upcoming deadlines".
4. **Given** deadlines in 2, 9, 20 and 45 days, **When** Home loads, **Then** the list shows the 2-, 9- and 20-day items in that order, with red, amber and green badges respectively, and the card shows 3 (the 45-day item is outside the window).
5. **Given** no saved or tracked scholarship has a deadline in the window, **When** Home loads, **Then** the deadlines list shows an empty state with a link to search scholarships, and the card shows 0.
6. **Given** the saved list fails to load but the tracked list succeeds, **When** Home renders, **Then** the saved card and the deadlines section show an error with retry, and the in-progress card still shows its real number. Retrying refetches only the failed source.

---

### User Story 3 - Understand why recommendations are locked and fix it (Priority: P2)

A student whose profile is below 70% complete sees the "Latest scholarships" section in a locked state that explains the requirement and offers a "Complete profile" button that opens the profile page.

**Why this priority**: It drives profile completion, which improves every matching feature. The lock is driven by real data.

**Independent Test**: Open Home as a student at 10% and at 75% completion and compare.

**Acceptance Scenarios**:

1. **Given** profile completion 10%, **When** Home loads, **Then** the recommendations section shows the lock icon, the "This section is locked" title, the text asking to complete at least 70%, and a "Complete profile" button that opens the profile page.
2. **Given** profile completion exactly 70%, **When** Home loads, **Then** the section is unlocked and shows "Latest scholarships" (FR-034).
3. **Given** profile completion 69.6%, **When** Home loads, **Then** the section is locked (no rounding up to unlock).

---

### User Story 4 - See notifications and recent activity (Priority: P3)

The student sees how many unread notifications they have and their four most recent activities (new recommendation, deadline reminder, saved scholarship, application status update), each with a relative time such as "3 hours ago".

**Why this priority**: Useful context, but the backend APIs do not exist yet. Until they do, these sections are hidden in every deployed environment.

**Independent Test**: With the demo flag off, confirm both sections are absent and no invented numbers appear. With the flag on in local development, confirm the sections render demo data marked with a "Demo data" badge.

**Acceptance Scenarios**:

1. **Given** no notifications/activity API and the demo flag off, **When** Home loads, **Then** the unread-notifications card and the recent-activity section are not shown, and no placeholder number appears anywhere.
2. **Given** local development with the demo flag listing `activity`, **When** Home loads, **Then** recent activity shows four demo rows with relative times and a visible "Demo data" badge on the section.
3. **Given** a Production or Preview build with the demo flag set, **When** Home loads, **Then** the demo sources are not used and the sections behave as in scenario 1.

---

### Edge Cases

- **Today's deadline**: a deadline equal to the student's local calendar day is "due today", counts as upcoming, and uses the most urgent color.
- **Timezone**: deadlines are calendar dates, not instants. Days remaining are computed against the student's local calendar day, so a student in UTC+3 just after midnight sees the new day's count. A deadline is never shifted by parsing it as UTC midnight.
- **Expired items**: tracked scholarships whose deadline has passed are excluded from deadlines (the tracked list includes expired listings).
- **No deadline / invalid date**: items with the no-deadline flag, no date, or an invalid date are excluded from the deadlines list and count.
- **Duplicates**: a scholarship that is both saved and tracked appears once (matched by scholarship ID).
- **Ties**: equal deadlines are ordered by scholarship ID ascending, so the order is stable across reloads.
- **Fewer than 3**: the list shows only the available items (1 or 2 rows), with no empty placeholder rows.
- **Large numbers**: counts of 100+ fit in the stat cards without overflow in both languages.
- **Long titles**: long scholarship titles truncate within the row (max two lines) and never cause horizontal scroll, in Arabic and English.
- **Session expiry**: if any section request returns "not authenticated", the student is sent to the login page and returns to Home after signing in.
- **Wrong role**: an admin who opens the student Home is redirected to the admin area by the existing role guard.
- **Partial failure**: each section loads, fails and retries independently. One failed section never blanks the page.
- **Completion unknown**: if profile completion fails to load, the recommendations section stays locked (it never unlocks on unknown data) and the welcome card shows the completion error with retry.
- **Completion out of range**: values below 0 or above 100 are clamped for display; a non-number is treated as a contract error (error state), not as 0.
- **Malformed response**: a response that does not match the expected shape shows the section's error state, never an empty state.

## Requirements _(mandatory)_

### Functional Requirements

**Page, access and shell**

- **FR-001**: The Home page MUST be available only to signed-in users with the student role, through the existing student layout and role guard. Unauthenticated visitors MUST be sent to login with a return path to Home.
- **FR-002**: Home MUST be served at `/student`, the index of the student area, with one new "Home" item at the top of the sidebar's first group. The Home item is active only on `/student` itself, and exactly one sidebar item is active on every student page.
- **FR-003**: Home MUST be released behind a server-only feature flag `STUDENT_HOME_ENABLED`, off by default (only the literal value `true` enables it). While it is off, `/student` MUST return "not found" and the sidebar MUST NOT show the Home item. Turning the flag on is an explicit item of the launch checklist.
- **FR-004**: The existing sidebar MUST be reused, not rebuilt. Only a "Home" navigation entry is added, and exactly one navigation item is active on Home. "Document improvement" MUST NOT be wired.
- **FR-005**: The students' post-login landing page MUST NOT change in this feature, because auth is out of bounds. Making Home the landing page is recorded as a follow-up.

**Header (section 1)**

- **FR-006**: The header MUST show a greeting with the student's real display name ("Hello, {name}") and the subtitle "Here's a quick look at your opportunities and upcoming deadlines." in the active language.
- **FR-007**: The header MUST keep the existing language toggle and user chip, which show the real name and initial.
- **FR-008**: The header MUST NOT show a theme toggle (no theme system exists), and MUST NOT show any disabled placeholder control. The notification bell MUST appear only while a notifications source exists (real, or demo in local development), and then it MUST show an unread dot driven by the same count as the stat card. With no source, the header shows no bell.

**Welcome card (section 2)**

- **FR-009**: The welcome card MUST show "Welcome back, {first name} 👋", where the first name is the first word of the signed-in student's name. With no name, it MUST show "Welcome back 👋".
- **FR-010**: The welcome card MUST show today's date (the student's local calendar day) formatted for the active language with Latin digits, e.g. "Today: 24 October 2026" / "اليوم: 24 أكتوبر 2026". The date MUST be computed when the page renders on the device, never taken from static text, and MUST update after midnight if the page stays open or is refocused.
- **FR-011**: The welcome card MUST show the avatar with the student's initial, using the same initial rule as the sidebar and header.
- **FR-012**: The welcome card MUST show "Profile completion" with the real percentage (rounded to a whole number for display) and a progress bar filled to that percentage, with an accessible progress value.

**Stat cards (section 3)**

- **FR-013**: Home MUST show stat cards in this order (reading direction): unread notifications, saved scholarships, applications in progress, upcoming deadlines, each with its icon, number and label as in the design. The unread-notifications card is shown only while a notifications source exists. The row MUST fill the full width evenly with 3 cards (no notifications source) and with 4 cards, and MUST NOT leave an empty slot or overflow.
- **FR-014**: "Saved scholarships" MUST equal the number of items in the student's saved list.
- **FR-015**: "Applications in progress" MUST equal the number of tracked applications whose status is not accepted, rejected or closed (that is, preparing documents, ready to apply, or applied).
- **FR-016**: "Upcoming deadlines" MUST equal the count defined in FR-023.
- **FR-017**: "Unread notifications" MUST come from a notifications source. With no active source the card MUST NOT be shown and the remaining cards fill the row. No number is ever invented.
- **FR-018**: A stat card MUST link to its destination only when that destination exists and is enabled (Saved page only when the Saved feature is enabled; the Tracking page only once it exists). Otherwise the card is not interactive.
- **FR-019**: Each stat card MUST show its own loading, error-with-retry and value states. A failure in one source affects only the cards and sections that depend on it.

**Upcoming deadlines (section 4)**

- **FR-020**: The candidate set MUST be the union of the student's saved scholarships and tracked scholarships, de-duplicated by scholarship ID. Tracked scholarships whose application status is accepted, rejected or closed MUST be excluded from the tracked side; if such a scholarship is also saved, it still counts through the saved list.
- **FR-021**: A candidate is eligible only if it has a valid calendar deadline (not flagged as having no deadline) that is today or later on the student's local calendar.
- **FR-022**: The upcoming window MUST be **30 days**: eligible items with 0 ≤ days remaining ≤ 30.
- **FR-023**: The "Upcoming deadlines" count MUST be the number of distinct scholarships in the window.
- **FR-024**: The days-remaining badge MUST be colored by urgency: **red (urgent)** for 0–7 days, **amber (soon)** for 8–14 days, **green (comfortable)** for 15–30 days. The badge text is "Due today" for 0, and "{n} days left" otherwise, with correct Arabic plural forms.
- **FR-025**: The list MUST show at most 3 items, sorted by deadline ascending, then by scholarship ID ascending.
- **FR-026**: Each row MUST show the scholarship title in the active language (falling back to the default title), and a secondary line with the funding type and academic level labels joined by " • ". A missing part is omitted; if both are missing the line is hidden. Each row MUST link to the scholarship details page when that page is enabled.
- **FR-027**: With no items in the window, the section MUST show an empty state ("No deadlines in the next 30 days") with a link to search scholarships.

**Recent activity (section 5)**

- **FR-028**: Recent activity MUST show at most 4 items, newest first. Each has an icon by type (new recommendation, deadline reminder, saved, status update), a localized message built from the activity type and its data (never a server-provided sentence), and a relative time ("3 hours ago", "1 day ago") in the active language with Latin digits.
- **FR-029**: With no active activity source, the section MUST NOT be shown.
- **FR-030**: With an active source that returns no items, the section MUST show an empty state ("No activity yet").

**Latest recommendations (section 6)**

- **FR-031**: The lock threshold MUST be 70% profile completion. The section is locked when completion is below 70 or unknown.
- **FR-032**: The locked state MUST show the icon, the title "This section is locked", the text "Complete at least 70% of your profile to see the latest scholarships here.", and a primary "Complete profile" button that opens the profile page. The copy MUST NOT promise personalized recommendations, smart matching or match scores, because the unlocked state shows the newest published scholarships without scores. (Changed from the Figma wording on 2026-10-24 by the product owner.)
- **FR-033**: The "View all" header link MUST open scholarship search. It is shown only when the section is unlocked.
- **FR-034**: When profile completion is 70% or higher, the recommendations section MUST be titled "Latest scholarships" and MUST show the 3 newest published scholarships from the student discovery list (sorted newest first), using the existing scholarship card, with no match score and no personalization claim. "View all" opens scholarship search. The unfiltered recommendations feed MUST NOT be used.

**States, data integrity and demo data**

- **FR-035**: Every section MUST have its own loading skeleton, empty state, and error state with a retry action. Retry refetches only that section's failed sources.
- **FR-036**: A "not authenticated" response from any Home request MUST send the student to login (through the existing session mechanism), not show a section error.
- **FR-037**: Every response MUST be validated against the expected shape. A mismatch MUST show the error state, never an empty or zero state.
- **FR-038**: Sections without a backend API (notifications, activity, and recommendations only if Q1 selects Option B) MAY use a demo data source only when **all** of these hold: (1) the demo source sits behind the same interface as the future real source, so connecting the real API changes only the source; (2) demo payloads follow the requested backend contract in `contract-notes.md` and pass the same validation as real responses; (3) the section is listed in the server-side setting `HOME_MOCK_SECTIONS` (comma-separated: `notifications`, `activity`, `recommendations`), which is off by default; (4) the build is not Production and not Preview.
- **FR-039**: A section running on demo data MUST show a small "Demo data" badge.
- **FR-040**: An automated test MUST fail if a demo source can be reached when the environment is production, when the deployment is Production or Preview, or when `HOME_MOCK_SECTIONS` is unset.

**Localization, direction and layout**

- **FR-041**: All visible text MUST exist in Arabic and English, with identical message keys in both languages, enforced by an automated check.
- **FR-042**: The page MUST render right-to-left in Arabic and left-to-right in English, with directional icons mirrored, and MUST NOT scroll horizontally at desktop widths (1024px–1440px) in either language.
- **FR-043**: The page MUST reuse existing project components, tokens, icons and identity helpers where the concept already exists (scholarship card, deadline calculation, funding/level labels, error and skeleton patterns, initials).

### Key Entities

- **Student identity**: the signed-in student's display name, first name, initial, role. From the existing current-user source.
- **Profile completion**: a percentage from 0 to 100 from the student's profile. Drives the welcome bar and the recommendations lock.
- **Saved scholarship**: a scholarship card the student bookmarked: ID, title (default/Arabic/English), deadline, no-deadline flag, funding type, academic level.
- **Tracked application**: the student's application record: ID, status (preparing documents, ready to apply, applied, accepted, rejected, closed), status change time, and the embedded scholarship card.
- **Upcoming deadline item** (derived): scholarship ID, display title, deadline date, days remaining, urgency level (urgent/soon/comfortable), secondary label parts, origin (saved, tracked or both).
- **Home summary** (derived): saved count, in-progress count, upcoming-deadline count, unread-notification count (when a source is active).
- **Activity item** (requested from backend): ID, type, time it happened, related scholarship (ID and titles), and type-specific data (e.g. new status, days left).
- **Notification summary** (requested from backend): unread count.
- **Recommendation item** (requested from backend): a scholarship card plus an optional match score.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A student can see their profile completion, saved count, in-progress count and nearest deadline within 3 seconds of opening Home on a typical connection.
- **SC-002**: For any seeded data set, the in-progress count, saved count, upcoming count and the three listed deadlines match a manual calculation from the student's saved and tracked records in 100% of test cases, including duplicates, ties, today's deadline and items beyond the window.
- **SC-003**: In every deployed environment (Preview and Production), 0 numbers or rows on Home come from demo data. This is verified by the automated guard and by the pre-launch checklist.
- **SC-004**: When one data source fails, all other sections still show correct content, and retrying the failed section recovers it without reloading the page.
- **SC-005**: 100% of Home text is available in both Arabic and English, and the page has no horizontal scroll at 1024, 1280 and 1440 px wide in both languages.
- **SC-006**: A student below 70% completion can reach the profile page from Home in one click.

## Assumptions

- Desktop layout only (≥1024px). Below that, sections stack in a single column without broken layout, but the mobile design is a later feature.
- The existing current-user source provides the name; no new user-data source is introduced.
- Profile completion is 0–100 (as the Profile page already uses it), not 0–1.
- The 30-day window and the 7/14-day urgency thresholds are product defaults chosen per the brief and can be tuned later without design changes.
- "Applications in progress" uses the tracked list directly, as the brief decides. The tracked statistics endpoint stays an option if load becomes a concern.
- The Tracking feature's shared types are not on `main`. Home defines a minimal local tracked-application type and records it for consolidation when Tracking merges.
- Demo data exists only to build and review the UI before the backend ships. It is not a fallback for real API failures.
- The welcome avatar shows one initial (matching the sidebar and chip) instead of the design's two letters, for consistency across the shell.
- Stray or hidden design layers (the 90% ring) are not built.

## Dependencies

- Backend: `GET /auth/me`, `GET /profile`, `GET /api/scholarships/saved`, `GET /api/scholarships/tracked`, `GET /api/scholarships/` (only if Q1 selects Option A).
- Backend asks (not blocking release, because sections are hidden without them): student notifications unread count, student activity feed, personalized scholarship recommendations, and a security fix for the public recommendations feed. See `contract-notes.md`.
- Existing frontend: student layout, sidebar, header, role guard, current-user source, saved scholarships data access, scholarship card and deadline helpers.

## Out of Scope

- Mobile and tablet layouts; admin pages.
- Rebuilding the sidebar; wiring "Document improvement"; Notifications, Settings and Application tracking pages.
- Changes to auth, the middleware proxy, or the Tracking feature's files.
- A dark theme or theme system.
- Personalized recommendation logic on the client (no client-side match scores).
- Changing the post-login landing page.
