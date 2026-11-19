# Feature Specification: Student Notifications

**Feature Branch**: `feat/011-student-notifications`

**Created**: 2026-11-19

**Status**: Clarified. The product owner took no questions for this feature; every open point is decided in **Clarifications** (five) or **Assumptions** and repeated in the PR description.

**Input**: User description: "Student Notifications. A signed-in student sees a notification center page, an unread badge on the sidebar item, and an unread indicator on the header bell. The backend generates the notifications; the frontend only displays them. The whole feature is behind a server-only flag `NOTIFICATIONS_ENABLED` (off unless the literal string `true`)." The full brief (user stories, six notification types, the BE-13 contract, constraints, acceptance) is reproduced in the sections below.

**Design source**: Figma file `vy2q4AYXDerSsF1U8xu6Gf`, frame `2481:4980` ("notifications", 1440×1249, Arabic/RTL, desktop only). There is **no frame for mobile (390px)**, for the empty, loading or error states, or for the "load more" control. Figma is a reference only: the page is built from the repo's components and tokens (constitution I and II).

## Reuse of the Existing System _(recorded before writing requirements)_

Sources: the code on `main` at `022ea5d`, `specs/009-student-home`, `specs/010-student-settings`.

| Concern                          | What already exists                                                                                                                                                                                                                                                                                       | Decision                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unread count source              | Home's `HomeSources.notifications` (`real`, `mock` or `unavailable`), its client `getUnreadNotifications` which already calls `GET /api/notifications/unread-count`, and its schema `parseUnreadNotifications` (`{ unread_count }`). Today `HOME_API_AVAILABILITY.notifications` is a build-time `false`. | **Reused.** The count is read through this source; `NOTIFICATIONS_ENABLED` makes it `real` (read on the server, passed down as a prop). No second count client, schema or query is created. |
| Bell                             | `HomeNotificationBell` (reads the source) and `NotificationBell` (a 32px circle, an orange dot when the count is above 0, **not a link** because no page existed). Mounted only in the desktop header group and only when Home is on.                                                                     | **Reused and extended**: it becomes a link to the page when the feature is on, appears when Home is off too, and also appears in the compact top bar (FR-040 to FR-045).                    |
| Home "Unread notifications" stat | `StatCards` shows it only while a notifications source exists; the card links only when its destination exists (009 FR-018).                                                                                                                                                                              | Reused unchanged except that it now links to the page when the feature is on. It shows the same number as the bell and the badge because all three read one query.                          |
| Home activity rows               | `HomeSources.activity` (`GET /api/activity`, a different, student-produced event feed), `ActivityRow`, `RecentActivity`.                                                                                                                                                                                  | **Not reused for data.** The activity feed is a different concept and contract and stays `unavailable`. Deriving Home's activity from notifications is a follow-up (see Out of Scope).      |
| Relative time                    | `formatRelativeTime` (Latin digits via `toFormattingLocale`).                                                                                                                                                                                                                                             | Reused for the time line (FR-016).                                                                                                                                                          |
| Retry, 401 handling              | `shouldRetryScholarshipQuery` (no retry on 401, 403, 404, 422), `useUnauthorizedRedirect` (a 401 re-checks the session through the current-user query).                                                                                                                                                   | Reused.                                                                                                                                                                                     |
| Details link and its flag        | `getScholarshipDetailsHref(id, enabled)`; every student page receives `detailsEnabled` from its Server Component.                                                                                                                                                                                         | Reused: actions that open details follow `SCHOLARSHIP_DETAILS_ENABLED` (FR-023).                                                                                                            |
| Empty, error, loading            | Saved and Tracking: a white `rounded-2xl` card with heading, body and CTA (empty); an `AlertCircle` card with `role="alert"` and a Retry button (error); skeletons with an `sr-only` `role="status"` (loading).                                                                                           | Reused as the pattern (FR-050 to FR-054); the design has none of these states.                                                                                                              |
| Shell                            | `StudentShell` already takes per-feature booleans, `headerActions`, and the nav helpers `withXEnabled`. A guard test forbids the shell from importing the Home feature.                                                                                                                                   | Extended with generic props only (an enable boolean, badge and compact-action slots). The route layout supplies the feature's nodes, so the shell stays generic (constitution II).          |
| Flags                            | `featureFlags` getters read `process.env` on every access; `.env.example` documents each empty; the e2e config turns them on only in the flags-on server.                                                                                                                                                 | Followed exactly (FR-003, FR-004).                                                                                                                                                          |
| Fake backend, e2e, guard tests   | `tests/e2e/fake-backend/server.mjs`, `tests/e2e/support/*`, `tests/student-home.test.mjs` and `tests/student-settings.test.mjs` guard patterns.                                                                                                                                                           | Extended and imitated (FR-100 to FR-105).                                                                                                                                                   |

## Design Notes _(Figma is design intent, not data)_

- **Copy that the contract cannot support.** The design's sentences contain facts the backend does not send. They are not invented on the client: "(IELTS 6.5)" and "(recommendation letters and country preferences)" in the update and profile cards, "درجة التوافق: عالية" (match level) in the match card, "archived automatically after its deadline, removed from your recommendations" in the archive card, "(8 suggestions: language, structure, fit with DAAD)" in the document card, and "(قبل 7 أيام)" in the reminder line. The copy built here uses only the fields of the contract (see FR-020 to FR-029).
- **Reminder line contradicts itself.** The design shows "17 days left" in the body and "reminder 1 of 2 (7 days before)" under it. The contract has no "days before" value, so only "Reminder {reminder_index} of {reminder_total}" is shown (FR-021).
- **Mixed time formats.** The design mixes "2 hours ago", "Today · 9:15 AM", "Yesterday", "2 days ago" and "a week ago" for items of the same day or week. One deterministic rule is used (FR-016); the exact date and time is in the `title` and `dateTime` of the time element.
- **Subtitle mentions AI.** The header subtitle says "track updates and **AI improvements** for your academic files". The AI document page does not exist in this release, so the subtitle is adapted (FR-012).
- **The unread card has a "New" pill where other cards have an action.** The design shows the pill in the action slot. Because an unread card can also have an action, the end side of a card stacks the pill above the action (FR-014).
- **Direction.** The design is Arabic/RTL: the icon box is at the reading start (right), the pill and action at the end (left), and "Mark all as read" aligns with that end column. Logical properties reproduce this in both directions.
- **Icons.** The glyphs are Font Awesome characters, which are font text, not assets. The repo's student shell uses `lucide-react`, so the closest equivalents are used (map in the plan). The deadline card's red alarm-clock icon is a real SVG asset, downloaded to `public/images/student/notifications/time-circle.svg` and used as is. The Hicon bell and the sidebar glyph use the same `Bell` icon the shell and `NotificationBell` already use.
- **Not built from the frame.** The sun (theme) button, the user chip's placeholder name and the design's other sidebar entries (Home, Document improvement, Settings in the list). The existing shell is reused; Settings stays the footer link from 010.
- **Placeholder numbers.** "2" on the sidebar badge, the 17-day reminder and "4 of 5 criteria" are sample values; real values come from the backend.

## Clarifications

### Session 2026-11-19

Status: **resolved by the author.** The brief says to take no questions, so `/speckit.clarify` scanned the spec, picked the five points with the most impact on behavior and tests, and answered each with the most reasonable default. Every answer is applied to the requirement it changes. Smaller decisions stay in **Assumptions**.

- Q1: When the unread count has stopped (401, 403 or 404) or never loaded, what do the sidebar item and "Mark all as read" do? → A: The sidebar item stays (the flag is on and the page is reachable) but shows no badge. An optimistic mark leaves the count alone when there is no count to change. "Mark all as read" is offered while a loaded card is unread, whatever the count says. (FR-033, FR-041, FR-045)
- Q2: How do background count polling and optimistic marking avoid flipping the number back? → A: Starting a mark cancels any count request in flight, polling ticks and focus refetches are skipped while any mark request is pending, and one reconcile request runs after the last pending mark settles. (FR-036, FR-039, FR-043)
- Q3: What does "refetch on window focus" mean when a tab can be visible but unfocused? → A: The count is requested again when the tab becomes visible or the window fires `focus`, whichever comes first, and never while a count request is already in flight. A visible but unfocused window keeps its 60-second rhythm. (FR-043)
- Q4: What happens to the loaded list when the student leaves the page and comes back? → A: Leaving discards the loaded pages; every visit starts with a fresh request for page 1 and a skeleton. A mark made just before navigating through an action still updates the count at once, and a failure of that mark restores the count (there is no list left to restore). (FR-035, FR-050)
- Q5: How is the deadline date written in a reminder? → A: Day and long month in the active language with Latin digits (as in the design, "15 September"), plus the year only when it is not the current year on the student's device. It is a calendar date and is never shifted by the time zone. (FR-020)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View my notifications (Priority: P1)

A signed-in student opens the notification center and sees the notifications the platform generated for them, newest first. Each card shows the type's icon and color, a title, a body, how long ago it happened, an action button when there is somewhere useful to go, and an orange border with a "New" pill when it is unread.

**Why this priority**: It is the core of the feature: without the list there is nothing to read, mark or count.

**Independent Test**: Seed a student with one notification of each of the six types (some read, some unread) in the fake backend, open `/en/student/notifications` and `/ar/student/notifications`, and compare each card with the design.

**Acceptance Scenarios**:

1. **Given** the flag is on and the student has notifications, **When** they open the page, **Then** the cards appear in the order the backend returned them (newest first) and the header reads "Notifications center".
2. **Given** an unread notification, **When** the list renders, **Then** its card has an orange border and a "New" pill; a read card has the grey border and no pill.
3. **Given** one notification of each of the six types, **When** the list renders in Arabic and in English, **Then** each shows its own icon, color, title and body built from translated messages, with Latin digits and no server-provided sentence.
4. **Given** a type this version does not know, **When** the list renders, **Then** that item is not shown and nothing else is affected.
5. **Given** a known type whose parameters are malformed, **When** the list renders, **Then** that item is skipped (and counted), the page does not fail, and the other items render.

---

### User Story 2 - Mark notifications as read (Priority: P1)

The student clicks a notification or its action and it becomes read immediately. A "Mark all as read" button reads everything at once. If the server refuses, the page goes back to what it was and says so.

**Why this priority**: Without it the unread count can never go down and the badge would be permanent noise.

**Independent Test**: With a delayed fake backend, click an unread card and assert the card and the count change before the PATCH answers; make the next PATCH fail and assert both roll back.

**Acceptance Scenarios**:

1. **Given** an unread card, **When** the student clicks it (or presses Enter or Space on it), **Then** it turns read and the unread count drops by one at once, and exactly one `PATCH /api/notifications/{id}/read` is sent.
2. **Given** an unread card with an action, **When** the student clicks the action, **Then** the notification is marked read the same way and the student is taken to the destination without waiting for the PATCH.
3. **Given** a read card, **When** the student clicks it, **Then** nothing is sent.
4. **Given** the PATCH fails, **When** the failure arrives, **Then** only that card goes back to unread, its share of the count is restored, and an error message tells the student it could not be marked.
5. **Given** several unread cards, **When** the student presses "Mark all as read", **Then** all loaded cards turn read, the count becomes 0 at once, and one `PATCH /api/notifications/read-all` is sent; if it fails, everything goes back and an error shows.
6. **Given** there is nothing unread, **When** the page renders, **Then** "Mark all as read" is not offered.

---

### User Story 3 - See what is unread without opening the page (Priority: P1)

Wherever the student is in the student area, the sidebar's Notifications item shows how many notifications are unread and the header bell shows a dot. Both follow the backend without a reload: the count refreshes about once a minute, not while the tab is hidden, and straight away when the student comes back to the tab.

**Why this priority**: It is how a student learns that something needs attention.

**Independent Test**: Seed 3 unread notifications, open any student page and see "3" on the sidebar item and a dot on the bell; add one in the fake backend, advance the clock by 60 seconds, and see "4" with no reload.

**Acceptance Scenarios**:

1. **Given** 3 unread notifications, **When** any student page renders with the flag on, **Then** the sidebar item shows 3, the bell shows a dot and links to the page, and the Home stat card (if Home is on) shows 3.
2. **Given** 0 unread, **When** the shell renders, **Then** there is no badge and no dot.
3. **Given** the tab stays visible, **When** about 60 seconds pass, **Then** the count is requested again; **given** the tab is hidden, **then** no request is made until it is visible again.
4. **Given** the tab was hidden, **When** it becomes visible or the window regains focus, **Then** the count is requested at once.
5. **Given** the count request answers 401, 403 or 404, **When** the answer arrives, **Then** polling stops, no further automatic request is made, and no badge or dot is shown (a 401 also re-checks the session).
6. **Given** a network error or a 5xx, **When** it happens, **Then** the last known count stays and polling continues at the normal rhythm.

---

### User Story 4 - The feature does not exist while the flag is off (Priority: P1)

**Why this priority**: The backend contract (BE-13) does not exist yet. Shipping the code dark must be provably harmless.

**Acceptance Scenarios**:

1. **Given** `NOTIFICATIONS_ENABLED` is unset or anything other than `"true"`, **When** anyone opens `/{locale}/student/notifications`, **Then** the localized 404 renders and no notification request is made.
2. **Given** the flag is off, **When** the student uses any page, **Then** there is no Notifications sidebar item, no bell indicator or link, no account-menu link, no compact-bar bell and no request to any `/api/notifications` path.
3. **Given** the flag is on, **When** the server is asked again later, **Then** the flag is read again on that request (it is never frozen at build time).

---

### User Story 5 - Load more, and clear loading, empty and error states (Priority: P2)

**Acceptance Scenarios**:

1. **Given** more notifications exist than one page holds, **When** the student presses "Load more", **Then** the next page is added below the loaded ones, without duplicates, and the control disappears after the last page.
2. **Given** the first page is loading, **Then** skeleton cards show and a status message is announced.
3. **Given** the student has no notifications, **Then** an empty state explains what will appear here and offers a way forward (search scholarships).
4. **Given** the first page fails, **Then** an alert with a Retry button shows; **given** a later page fails, **Then** the loaded notifications stay and a retry control appears under them.

---

### User Story 6 - Use it on a phone (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a 390px viewport and the flag on, **When** the student looks at the compact top bar, **Then** a bell (with the unread dot) opens the notification center.
2. **Given** the account menu is open, **Then** it has a "Notifications" link.
3. **Given** the bottom tab bar, **Then** it still has the same five items (Home, Search, Saved, Tracking, Profile).
4. **Given** the page at 390px, **Then** it is a single column, an action button spans the full width under its text, every control is at least 44×44px, and nothing scrolls horizontally, in Arabic and in English.

### Edge Cases

- **Unknown type**: skipped silently. A newer backend must never break an older frontend.
- **Known type, bad parameters** (missing field, wrong type, negative number, date that is not a calendar date): skipped and counted; never an error state, never a half-rendered card.
- **Unread count and skipped items**: the badge counts what the backend counts; an unread item the frontend skips is still in that number. "Mark all as read" brings it to 0.
- **A page whose items are all skipped**: it still counts as a page. If more pages exist the "Load more" control stays; the empty state shows only when the last page is loaded and nothing is renderable.
- **Duplicates across pages** (new items shift the pages): an `id` is shown once; the first copy wins.
- **Unknown `change` code or unknown `missing_documents` code**: the notification is valid. It falls back to the generic sentence for that type; it is not skipped.
- **`days_left` is 0** reads "Due today"; **1** reads "1 day left"; Arabic uses every plural form.
- **Deadline is a calendar date**: never shifted by the time zone (`2026-09-15` always reads as 15 September).
- **`created_at` in the future** (clock skew) or unreadable reads as "Just now" for the future case; an unreadable date shows no time text.
- **Marking the same card twice quickly**: one request. Marking two different cards quickly: two independent requests; one failing restores only its own card.
- **Mark all while a single mark is in flight**: allowed; if either fails only its own change is restored.
- **Action destination unavailable** (details flag off, destination not built, scholarship id invalid): no action is rendered; the card and its read behavior are unchanged.
- **Student signs out or the session expires**: the existing session handling runs; no notification text stays in browser storage or in the cache.
- **Very long scholarship titles**: wrap and clamp within the card, never overflow at 390px.
- **Locale switch**: the page re-renders in the new language from the same data (text is built from type and parameters, so it follows the language).
- **Direction**: titles inside Arabic sentences are isolated so mixed-direction text stays in order.

## Requirements _(mandatory)_

### Functional Requirements

**Flag, route and access**

- **FR-001**: The route `/[locale]/student/notifications` exists and is a Server Component that reads `featureFlags.notificationsEnabled` before rendering anything. It sits beneath the student layout and its existing `RoleGuard` (students only).
- **FR-002**: With the flag off the route calls `notFound()` (the localized 404) before any client render or request.
- **FR-003**: `featureFlags.notificationsEnabled` is `process.env.NOTIFICATIONS_ENABLED === 'true'`, read through a getter on every access. It is server-only: there is no `NEXT_PUBLIC_` variant and no code path that defaults it to `true`. It reaches client components only as a prop from a Server Component.
- **FR-004**: `NOTIFICATIONS_ENABLED` is documented, empty, in `.env.example`, and set to `"true"` only in the e2e flags-on server (`playwright.config.ts`); the flags-off server sets it empty.
- **FR-005**: With the flag off there is no Notifications sidebar item, no bell indicator or link, no account-menu link, no compact-bar bell, no Home notifications stat card driven by the real source, and no request to any `/api/notifications` path.

**Notification center page**

- **FR-010**: The page lists notifications in the order the backend returns them (newest first). The frontend does not re-sort them (the order is part of the contract, see Open Questions).
- **FR-011**: The list is a semantic list with an accessible name; each notification is one list item.
- **FR-012**: The student header shows the title "Notifications center" and the description "Follow updates about your scholarships, deadlines and profile as they happen" (`StudentLayout.pages.notifications`).
- **FR-013**: A card, from the reading start: a 42px rounded tinted icon box with the type's icon; the text block (title 14px medium, body 12px, time line 12px); the end column with the "New" pill (unread only) and the action button (when there is one). Colors and icons per type are in FR-020 to FR-029.
- **FR-014**: An unread card has an orange border and a "New" pill (text, not color alone); a read card has the grey border and no pill. When a card has both a pill and an action, the pill stacks above the action in the end column.
- **FR-015**: "Mark all as read" is an outlined pill button (check-double icon, 12px text) at the end side above the list. It is shown only while something is unread (FR-033).
- **FR-016**: The time line is computed on the student's device from `created_at` (UTC, `Z`) with one rule: under 1 minute "Just now"; under 1 hour "N minutes ago"; under 24 hours "N hours ago"; 1 day "Yesterday"; 2 to 6 days "N days ago"; 7 to 29 days "N weeks ago"; 30 days or more the date. Digits are Latin in both languages. The `<time>` element carries `dateTime` and a `title` with the full local date and time. Labels are recomputed about once a minute while the page is visible.
- **FR-017**: Server-provided text (scholarship titles) is rendered as plain text, wrapped in `<bdi>`, clamped to two lines and never inserted as markup.

**Types and copy** (all copy is built from `type` and `params` with next-intl messages in `ar` and `en`; the backend never sends a sentence)

- **FR-020 `deadline_reminder`**: icon: the downloaded red alarm-clock SVG in an orange-tinted box (`rgba(255,141,40,0.1)`). Params: `scholarship_id`, `scholarship_title`, `days_left`, `deadline` (`YYYY-MM-DD`), `reminder_index`, `reminder_total`, `missing_documents` (optional string codes). Title: "Deadline approaching: {scholarship_title}". Body: the days left ("Due today", "1 day left", "N days left", with every Arabic plural form) and the deadline as a calendar date (day and long month, plus the year only when it is not the current year on the student's device; never shifted by the time zone); when `missing_documents` has known codes, a second sentence lists them ("Review your documents: {list} not uploaded yet"), and with only unknown codes it says "Some of your documents are still missing". Time line adds "Reminder {reminder_index} of {reminder_total}" after the time. Action: open the scholarship details.
- **FR-021**: The reminder line never shows "(N days before)", because the contract has no such value.
- **FR-022 `scholarship_match`**: icon `WandSparkles`, navy `#274383` on `#f1f1fb`. Params: `scholarship_id`, `scholarship_title`, `matched_count`, `total_count`. Title: "A new scholarship matches your profile". Body: "«{scholarship_title}» was added: it matches {matched_count} of {total_count} criteria." No match level (high, medium, low) is derived. Action: open the scholarship details.
- **FR-023 `saved_scholarship_updated`**: icon `CircleCheck`, green `#16c172` on `rgba(22,193,114,0.06)`. Params: `scholarship_id`, `scholarship_title`, `change` (a stable code). Title: "A saved scholarship was updated". Body: a sentence per known `change` code (`language_requirement_added` is the one the contract names), otherwise "The details of «{scholarship_title}» were updated". Action: open the scholarship details.
- **FR-024 `scholarship_archived`**: icon `Archive`, `rgba(220,38,38,0.6)` on `rgba(255,56,60,0.1)`. Params: `scholarship_id`, `scholarship_title`. Title: "Scholarship archived". Body: "«{scholarship_title}» has been archived and is no longer available." No action.
- **FR-025 `profile_incomplete`**: icon `CircleAlert`, orange `#f97316` on `rgba(255,141,40,0.1)`. Params: `remaining_percent`, `threshold_percent` (numbers from 0 to 100). Title: "Your profile is incomplete". Body: "Complete the remaining {remaining_percent}% of your profile for more accurate recommendations. A profile that is {threshold_percent}% complete is needed for match scores." Percentages are rounded to whole numbers for display. Action: go to the profile page.
- **FR-026 `document_analysis_ready`**: icon `FilePen`, purple `#8b5cf6` on `rgba(0,136,255,0.1)`. Params: `suggestions_count`, `target_scholarship_title` (nullable). Title: "Your document analysis is ready". Body: a plural sentence on `suggestions_count`, naming the scholarship when `target_scholarship_title` is present. **No action in this release** (the AI document page does not exist).
- **FR-027**: Every notification type has exactly one entry in a single registry (type, params parser, icon, tone, copy keys, action rule). Adding a type means adding one entry and its messages; a test fails if a registered type lacks messages in either language or a parser.
- **FR-028**: An unknown `type` is skipped, never an error. A known type whose `params` fail validation is skipped and counted. The parse result reports how many items were skipped for each reason; the counts never include parameter values, and in non-production builds a single warning with the two numbers is logged.
- **FR-029**: A notification missing `id`, `created_at` (unreadable) or `is_read` (not a boolean) is malformed and skipped under FR-028.

**Actions**

- **FR-030**: An action is rendered only when (a) the backend `action` field is not `null`, (b) the type has an action rule in the registry, and (c) the destination exists and is enabled. Otherwise no action is shown and the card is otherwise unchanged.
- **FR-031**: Destinations: `deadline_reminder`, `scholarship_match`, `saved_scholarship_updated` open `/student/scholarships/{id}` through `getScholarshipDetailsHref(id, detailsEnabled)` (`detailsEnabled` is `SCHOLARSHIP_DETAILS_ENABLED`, passed from the Server Component); the id is `action.target_id`, falling back to `params.scholarship_id`, and must be a positive safe integer. `profile_incomplete` opens `/student/profile`. `scholarship_archived` and `document_analysis_ready` have none in this release.
- **FR-032**: Action labels are translated: "View" (scholarship details) and "Complete profile". Links are built from fixed routes and integer ids only; a URL coming from the backend is never followed. An action link is a real link (keyboard and middle-click work).

**Mark as read**

- **FR-033**: "Mark all as read" is offered only while a loaded card is unread or the unread count is above 0, and is disabled while its request is pending. It does not depend on the count having loaded.
- **FR-034**: Clicking an unread card, or pressing Enter or Space on it, marks it read. An unread card's text block is a button whose accessible description is "Mark as read"; the action control is a separate sibling, never nested in it. A read card has no button.
- **FR-035**: Clicking an action marks the notification read (same as FR-034) and navigates immediately; it does not wait for the PATCH.
- **FR-036**: Marking is optimistic: the card turns read and the unread count decreases by one (never below 0, and not at all when no count is loaded) before the server answers. One `PATCH /api/notifications/{id}/read` is sent per notification at a time; none for a read item and none while one is in flight for that id.
- **FR-037**: On failure only that notification returns to unread, only its share of the count is restored, and a message with `role="alert"` says it could not be marked as read. Other optimistic changes stay.
- **FR-038**: "Mark all as read" is optimistic: every loaded card turns read and the count becomes 0; one `PATCH /api/notifications/read-all` is sent. On success the answer `{ updated }` is validated, the count is re-requested to reconcile, and a `role="status"` message says that all notifications were marked as read (no number, because the server's `updated` can differ from the loaded cards). On failure everything the action changed is restored and an alert shows.
- **FR-039**: Starting a mark cancels any count request in flight. After the last pending mark settles (success or failure) the unread count is re-requested once to reconcile with the server. A mark does not change the count when there is no count loaded.

**Unread count, badge and bell**

- **FR-040**: The count comes from the existing Home notifications source with kind `real` when the flag is on. One query feeds the sidebar badge, the bell, the compact-bar bell and the Home stat card, so they always show the same number.
- **FR-041**: The sidebar has a "Notifications" item (bell icon) in the "Personal" group, before Profile, shown only when the flag is on. It is active on `/student/notifications` and its sub-routes. It shows the count in an orange pill: nothing at 0, the number from 1 to 99, "99+" above. The accessible name includes the count ("Notifications, 3 unread"). The tablet drawer renders the same sidebar, so it has the item too. The bottom tab bar is unchanged (five items).
- **FR-042**: The desktop header bell and the compact-bar bell link to `/student/notifications`, show the dot only while the count is above 0, have an accessible name with the count, and have `aria-current="page"` on the page itself. The compact bell is at least 44×44px.
- **FR-043**: The count is requested on mount, then about every 60 seconds while the tab is visible, with no request while the tab is hidden, and requested again when the tab becomes visible or the window fires `focus`. No automatic request is made while another count request or any mark request is in flight (the skipped tick is not queued).
- **FR-044**: A 401, 403 or 404 from the count request stops all automatic requests for it (interval and focus) and hides the badge and dots. A 401 also re-checks the session through the existing current-user query. Automatic requests resume only after a reload or after a manual retry (FR-053) succeeds. Other failures keep the last known count and the normal rhythm.
- **FR-045**: While the count has not loaded, or never loaded, or has stopped (FR-044), no badge and no dot show, but the sidebar item and the bell links stay (the page is still reachable and shows its own state). A number is never invented, defaulted or cached across sessions.
- **FR-046**: The account menu (below 640px) has a "Notifications" link, only when the flag is on.

**List data, pagination and states**

- **FR-050**: The list is requested with `GET /api/notifications?page=1&page_size=20`. "Load more" requests the next page and appends it; the control is hidden when `page >= total_pages`. No `is_read` filter is sent (filters are out of scope). Leaving the page discards the loaded pages: every visit requests page 1 again and shows the loading state first.
- **FR-051**: Loading shows skeleton cards and an `sr-only` `role="status"` message; empty shows a card with a heading, a body and a "Search scholarships" link; first-page error shows a card with `role="alert"`, a reason-specific message (session expired, access unavailable, generic) and a Retry button (none for 403); a later-page error keeps the loaded items and shows an inline alert with Retry.
- **FR-052**: A 401 from the list re-checks the session through the existing current-user query (the student is sent to login with a return path if the session is gone).
- **FR-053**: Retry on the list also re-requests the count; if that succeeds, polling resumes.
- **FR-054**: A response that does not match the list envelope (`items` not an array, bad `page` or `total_pages`) is a contract error: the error state, not an empty state.

**Mobile**

- **FR-060**: Below 1024px the compact top bar shows the bell between the language button and the account menu; below 640px the account menu also links to the page.
- **FR-061**: At 390px the page is one column; the end column moves under the text and the action button spans the full width; "Mark all as read", the card text button, the action, "Load more" and Retry are at least 44px tall; the page never scrolls horizontally.

**Localization, direction and accessibility**

- **FR-070**: All visible text is in `src/messages/ar.json` and `src/messages/en.json` (a new `StudentNotifications` namespace, plus `StudentLayout.nav.notifications`, `StudentLayout.pages.notifications`, `StudentLayout.userMenu.notifications`). The two files have identical key shapes.
- **FR-071**: ICU messages never use `#`; numbers use `{n, number, integer}` so Arabic keeps Latin digits; every plural message defines every category its locale needs (Arabic: `zero` or `=0`, `one`, `two`, `few`, `many`, `other`; English: `one`, `other`, plus `=0` where the sentence differs).
- **FR-072**: Layout uses logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `start-`, `end-`, `border-s`). The bare `rtl:` variant is never used (the root `<html dir>` is always `rtl`). A directional icon, if any is added, is mirrored explicitly from the active locale.
- **FR-073**: No user-facing text is hard-coded outside `src/messages`.
- **FR-074**: Controls have visible focus, accessible names and keyboard behavior; unread state is conveyed by text, not color alone.

**Privacy and security**

- **FR-080**: No token is ever logged or stored by this feature, and no notification content is written to `localStorage`, `sessionStorage`, cookies or the console.
- **FR-081**: Production code never imports from `tests/`, `scripts/` or fixtures.
- **FR-082**: Requests go through `apiClient` and the `/backend` proxy. The admin endpoints (`/admin/notifications...`) are never called.

**Backend contract adapter**

- **FR-090**: Backend field names (`unread_count`, `is_read`, `created_at`, `page_size`, `total_pages`, `target_id`, params names) appear only in the feature's adapter (wire schemas and clients). The rest of the code uses an internal model in camelCase. Changing a wire name touches only the adapter files and the fake backend.
- **FR-091**: The wire schemas accept extra fields (a newer backend must not break the page) and are covered by tests that parse real-shaped payloads.

**Tests and guards**

- **FR-100**: Unit tests cover the flag, the registry, every type's copy in both languages, parsing (unknown, malformed, duplicates), the action rules, the relative-time rule, optimistic update and rollback, mark-all, polling decisions and stop rules, the unread-count formatting, and the shell wiring.
- **FR-101**: Guard tests (like those of 009 and 010): flag semantics and no `NEXT_PUBLIC_`; the flag is set only in the e2e config; no import from tests, scripts or fixtures; logical properties only and no bare `rtl:`; directional icons mirrored; ICU validity, no `#`, plural completeness, key parity; Latin digits in Arabic; no hard-coded copy; no storage or token access; backend field names only in the adapter; only one file in the feature touches the Home source abstraction; the shell never imports from the notifications or Home features; the tab bar still has five items.
- **FR-102**: The fake backend implements the four endpoints with per-user state, ordering, pagination, and a way to make the next PATCH fail or be slow.
- **FR-103**: e2e covers, in `en` and `ar`: the list with all six types; mark read (optimistic, delayed, rolled back); mark all; badge, bell and Home stat agreement; polling and hidden-tab pause with a controlled clock; stop on 401, 403 and 404; unknown and malformed items; empty, error and loading; load more; 390px layout (no overflow, 44px targets, five tabs, bell, menu link); flags-off (404, nothing visible, zero requests).
- **FR-104**: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` and `pnpm test:e2e` pass.
- **FR-105**: `docs/e2e/README.md` and the feature's `verification.md` record the new flag, the fake endpoints and the launch checklist.

### Key Entities

- **StudentNotification** (internal model): `id`, `type` (one of the six), a typed `params` object per type, `createdAt`, `isRead`, `action` (`null` or `{ type, targetId }`).
- **NotificationPage**: the items that were renderable, `page`, `pageSize`, `total`, `totalPages`, and `skipped` counts (`unknownType`, `malformed`).
- **UnreadCount**: the Home source's `{ unreadCount }`.
- **NotificationAction** (derived): `{ href, labelKey }` or nothing.
- **Wire shapes**: exactly the BE-13 contract in `contract-notes.md`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: With one notification of each of the six types, 100% render with the right icon, color, title and body in Arabic and in English (e2e and unit), with no server-provided sentence anywhere.
- **SC-002**: Marking read changes the card and the count before the server answers, even when the answer is delayed by several seconds; a refused request restores exactly the changed state (e2e).
- **SC-003**: The sidebar badge, the bell dot and the Home stat card show the same number in 100% of the tested states.
- **SC-004**: With the flag off the backend receives 0 requests to `/api/notifications*`, the route returns the localized 404, and no notification control is visible, in `en`, `ar` and at 390px (e2e).
- **SC-005**: The count is requested again within 60 seconds (±5) while visible, 0 times while hidden, immediately on return, and 0 more times after a 401, 403 or 404 (e2e with a controlled clock).
- **SC-006**: At 390px the page has no horizontal scroll and every interactive control measures at least 44×44 CSS pixels, in both languages.
- **SC-007**: Renaming a backend field is a change confined to the adapter files and the fake backend (checked by the guard test and the swap procedure in `contract-notes.md`).
- **SC-008**: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` and `pnpm test:e2e` all pass.

## Assumptions

Made without asking, as the brief requires; each is repeated in the PR description.

- **A1 (one count, one query)**: the sidebar badge, the bells and the Home stat read one query through the Home notifications source. Making `HOME_API_AVAILABILITY.notifications` depend on the flag is done by passing an availability override from the server flag, not by editing the static table, so Home's own tests and defaults keep their meaning.
- **A2 (Home changes when the flag is on)**: with `NOTIFICATIONS_ENABLED=true` and Home on, Home's "Unread notifications" card appears (real count) and links to the page. This is the intended effect of reusing the source. Home's activity section is untouched.
- **A3 (Home's demo source)**: Home's local-development demo notifications (`HOME_MOCK_SECTIONS`) keep working when this flag is off; they make no requests and never exist in production or Preview. With the flag on, real data wins (existing rule). The bell is only a link when the flag is on.
- **A4 (action rule)**: the backend `action` field decides whether an action exists (`null` hides it); the notification type decides its destination and label. `action.type` is validated as a string but not interpreted, because its values are not yet published (BE-13). `action.target_id` is the scholarship id, with `params.scholarship_id` as the fallback.
- **A5 (copy limited to the contract)**: sentences only use contract fields. Known `change` codes are `language_requirement_added` only; known `missing_documents` codes start with the document kinds the profile feature already knows (listed in the plan). Unknown codes get the generic sentence. The backend should publish the closed lists (Open Questions).
- **A6 (page size 20)**: the first request uses `page_size=20`; the backend's maximum is not documented.
- **A7 (order)**: the backend returns newest first (`created_at` descending, `id` descending as the tie-break); the frontend preserves that order.
- **A8 (list freshness)**: only the count is polled. The list is requested when the page opens (page 1, every visit) and is not refreshed in the background, so cards never move under the student's cursor. A "new notifications available" prompt is a follow-up.
- **A9 (60 seconds, 99+)**: the cadence is a product default ("about every 60 seconds"); the badge caps at "99+".
- **A10 (time labels)**: one deterministic relative rule replaces the design's mixed formats (Design Notes); "Yesterday" uses the language's natural form.
- **A11 (icons)**: Font Awesome glyphs map to `lucide-react` equivalents, the only static asset is the alarm-clock SVG, and the bell and sidebar item reuse `Bell` as the rest of the student shell does.
- **A12 (empty state wording)**: "No notifications yet" with a short explanation and a "Search scholarships" link; it is also shown when every renderable item is absent after the last page.
- **A13 (error reasons)**: the first-page error follows the Saved and Tracking reasons: session expired (401), access unavailable (403, no Retry), generic (everything else, including 404).
- **A14 (e2e details flag)**: the e2e flags-on server keeps `SCHOLARSHIP_DETAILS_ENABLED` empty (changing it would alter other specs), so e2e asserts the "View" action is absent there and the "Complete profile" action is present; the details link with the flag on is covered by unit render tests.
- **A15 (tab bar)**: Notifications is a sidebar and drawer item only; the five-item tab bar is unchanged (the brief).
- **A16 (session scope)**: nothing persists across sign-out: the in-memory cache is cleared by the existing logout.
- **A17 (flag-on without Home)**: the bell, badge and page work with `STUDENT_HOME_ENABLED` off; the bell is injected whenever either flag needs it.

## Open Questions (for the BE-13 ticket)

The frontend is built against the fake backend, and these are the points where the real backend could differ. Each is isolated in the adapter or the registry so that answering it later is a small change.

- **Q-ORDER**: is the list `created_at` descending with an `id` tie-break, stable across pages?
- **Q-ACTION**: the closed list of `action.type` values and whether `target_id` is always the scholarship id.
- **Q-CODES**: the closed lists of `change` codes and `missing_documents` codes.
- **Q-PAGE**: the default and the maximum `page_size`.
- **Q-COUNT**: whether `unread_count` includes notification types the client skips (it will, by definition).
- **Q-STATUS**: the status codes for an unknown id and for an already-read id on `PATCH /{id}/read`, and whether `403` is returned for a disabled account.
- **Q-READALL**: whether `read-all` is limited to the current student and returns `{ updated }` as an integer.

## Dependencies

- Backend (ticket BE-13, not built): `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all`. The frontend is built and tested against the fake backend only. The flag stays off in Production and Preview until the endpoints are verified against a real session.
- Existing frontend: the student layout, `RoleGuard`, `AuthProvider`, the Home notifications source and bell, `apiClient`, the details-link helper and the current-user query.

## Out of Scope

- Notification preferences, deleting, filtering, push or email delivery, websockets or server-sent events, admin notifications, generating notifications on the frontend, the AI Enhance page.
- Making Home's "Recent activity" read from notifications (a different concept and contract; follow-up).
- Refreshing the list in the background; a "new notifications" prompt (follow-up).
- Multi-tab synchronization of the count.
- Changes to `src/lib/api-client.ts`, `src/proxy.ts`, `AuthProvider.tsx` and `RoleGuard.tsx`.
