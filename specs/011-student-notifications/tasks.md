---
description: 'Task list for 011 Student Notifications'
---

# Tasks: Student Notifications

**Input**: `specs/011-student-notifications/` (spec.md, plan.md, research.md, data-model.md, contract-notes.md, contracts/, quickstart.md)

**Prerequisites**: spec and plan are done. The BE-13 backend does not exist and is not needed: everything is built and tested against the fake backend.

**Tests**: REQUESTED (spec FR-100 to FR-104). Unit tests: `tests/student-notifications.test.mjs` (pure logic, adapter, copy, flag, guards) and `tests/student-notifications-ui.test.mjs` (rendered markup, shell wiring, states). e2e: `tests/e2e/specs/notifications.spec.ts`, `notifications-count.spec.ts`, `flags-off.spec.ts`. Each story writes its tests first where practical.

**Commits**: Conventional Commits, scope `notifications`; explicit paths only (never `git add -A`); the husky hook needs `pnpm` on PATH. Only `package-lock.json` is untracked on `main` and is never committed.

Run commands as `corepack pnpm …` when `pnpm` is not on PATH.

## Format: `- [ ] T### [P?] [Story?] Description with file path`

- **[P]**: parallelizable (different files, no dependency on an unfinished task)
- **[Story]**: US1 view the list · US2 mark as read · US3 badge, bell and polling · US4 flag off · US5 load more and states · US6 mobile

## Constraints that apply to every task

- Do not modify `src/lib/api-client.ts`, `src/proxy.ts`, `src/features/auth/providers/AuthProvider.tsx`, `src/features/auth/components/RoleGuard.tsx`.
- Backend field names (`unread_count`, `is_read`, `created_at`, `page_size`, `total_pages`, `target_id`, params names) only inside `src/features/student/notifications/adapter/`.
- Logical CSS properties only (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `start-`, `end-`, `border-s`); never the bare `rtl:` variant; mirror a directional icon from the active locale.
- No hard-coded user-facing text outside `src/messages`; Latin digits in Arabic; ICU messages never use `#` (use `{n, number, integer}`); every plural defines every category its locale needs (ar: `zero` or `=0`, `one`, `two`, `few`, `many`, `other`; en: `one`, `other`, plus `=0` where the sentence differs); ar and en keys have identical shapes.
- No `NEXT_PUBLIC_` flag. `NOTIFICATIONS_ENABLED` is read server-side on every access, documented empty in `.env.example`, set to `true` only in the e2e flags-on server.
- Production code never imports from `tests/`, `scripts/` or fixtures. Never log or store tokens; no notification content in `localStorage`, `sessionStorage`, cookies or the console.
- The shell (`src/features/student/layout/`) never imports from `student/home` or `student/notifications`. Only `lib/unread-source.ts`, `components/NotificationsBell.tsx` and `lib/relative-time.ts` in the notifications feature may import from `student/home`.
- Edit with explicit paths; run `prettier --write` only on the files you touched (never on a whole directory).

---

## Phase 1: Setup (flag and configuration)

- [x] T001 [P] `src/lib/feature-flags.ts`: add the getter `notificationsEnabled` returning `process.env.NOTIFICATIONS_ENABLED === 'true'` (a getter, so it is read on every access), with the same style of comment as the other flags.
- [x] T002 [P] `.env.example`: document `NOTIFICATIONS_ENABLED=` empty (server-only, never `NEXT_PUBLIC_`, turn on in Production only after the BE-13 endpoints are verified against a real session).
- [x] T003 [P] `playwright.config.ts`: add `NOTIFICATIONS_ENABLED: flags ? 'true' : ''` to `appEnv`.
- [x] T004 [P] `package.json`: add `"test:student-notifications": "node --test tests/student-notifications.test.mjs tests/student-notifications-ui.test.mjs"`.
- [x] T005 Create `tests/student-notifications.test.mjs` with the flag tests: off unless the literal `"true"` (unset, empty, `"1"`, `"TRUE"` are off), flipping `process.env` between reads changes the value, no `NEXT_PUBLIC_NOTIFICATIONS` anywhere in `src/` or the env files, `.env.example` declares it empty, and `playwright.config.ts` sets it to `'true'` only on the flags-on branch. Commit: `feat(notifications): add the NOTIFICATIONS_ENABLED flag` (T001 to T005).

**Checkpoint**: the flag exists and is guarded; nothing reads it yet.

---

## Phase 2: Foundational (adapter, model, registry, copy, Home source, fake backend)

**⚠️ No user story starts before this phase is done.** Tests are written with the code they cover.

### Model, adapter, registry (pure, no UI)

- [x] T010 [P] `src/features/student/notifications/model/types.ts`: `NotificationType` (the six), the discriminated union `StudentNotification` (`id: number`, `type`, typed `params`, `createdAt`, `isRead`, `action: null | { type: string; targetId: number | null }` (the type is checked against the closed list in `actions.ts`)), `NotificationPage` (`items`, `page`, `pageSize`, `total`, `totalPages`, `skipped: { unknownType; malformed }`), `NotificationAction` (`{ href; labelKey }`).
- [x] T011 [P] `src/features/student/notifications/adapter/params.ts`: one zod schema per type that maps wire params to the internal camelCase params, with these constraints verbatim from data-model.md: `deadline_reminder`: ids positive; title non-empty; `daysLeft` int at least 0; `deadline` must pass `parseCalendarDate`; `1 <= index <= total`; documents are strings, default `[]`. `scholarship_match`: counts are integers, `0 <= matched <= total`, `total >= 1`. `saved_scholarship_updated`: `change` non-empty string, unknown codes are valid. `scholarship_archived`: ids positive, title non-empty. `profile_incomplete`: finite numbers from 0 to 100. `document_analysis_ready`: integer at least 0, title nullable. Unknown keys are stripped, never rejected.
- [x] T012 [P] `src/features/student/notifications/adapter/wire.ts`: zod schemas for the list envelope (`items` is an array of unknown; `page` and `page_size` integers at least 1; `total` and `total_pages` integers at least 0), the item shell (`id` positive integer; `created_at` ISO 8601 with offset; `is_read` boolean; `action` null, undefined or `{ type: string, target_id: integer | null }`; an unknown action type is not a malformed item), the mark-read answer (`{ id, is_read, read_at }`) and the read-all answer (`{ updated }` integer at least 0). Wire names live only here and in `params.ts`.
- [x] T013 `src/features/student/notifications/adapter/parse-page.ts`: `parseNotificationPage(raw)`: a bad envelope throws a contract error (reuse the pattern of `home/schemas/contract-error.ts`; the error state, never an empty state); per item: unknown `type` counts `skipped.unknownType`, a known type with a bad shell or bad params counts `skipped.malformed`; neither throws; returns only renderable items in the server's order; never puts values into the counts.
- [x] T014 `src/features/student/notifications/adapter/api.ts`: `fetchNotificationPage(page, signal)` (`GET /api/notifications?page=…&page_size=20`, no `is_read`), `markNotificationRead(id)` (`PATCH /api/notifications/${id}/read` (the id is an integer)), `markAllNotificationsRead()` (`PATCH /api/notifications/read-all`), all through `apiClient`; validate answers with `wire.ts`; never call `/admin/notifications`.
- [x] T015 `src/features/student/notifications/registry/registry.ts`: the single registry, one entry per type: icon (`/images/student/notifications/time-circle.svg` for `deadline_reminder`; `WandSparkles`, `CircleCheck`, `Archive`, `CircleAlert`, `FilePen` for the others), tone classes (box `rgba(255,141,40,0.1)`; `#f1f1fb` with `#274383`; `rgba(22,193,114,0.06)` with `#16c172`; `rgba(255,56,60,0.1)` with `rgba(220,38,38,0.6)`; `rgba(255,141,40,0.1)` with `#f97316`; `rgba(0,136,255,0.1)` with `#8b5cf6`), copy key prefix `types.<type>` and the wire params schema from T011. The registry has no action rule: the backend `action` decides (T016).
- [x] T016 [P] `src/features/student/notifications/registry/actions.ts`: `resolveAction(notification, { detailsEnabled })` decides from the backend `action` only: `null` gives `null`; `open_scholarship` gives `getScholarshipDetailsHref(targetId, detailsEnabled)` (hidden when the flag is off or `targetId` is not a positive safe integer) with label `actions.viewScholarship`; `open_profile` gives `/student/profile` with label `actions.completeProfile`; `open_document_analysis` and any unknown type give `null`; no URL from the backend is ever followed.
- [x] T017 [P] `src/features/student/notifications/lib/deadline-date.ts`: day and long month from a `CalendarDate`, plus the year only when it differs from the student's current local year; `timeZone: 'UTC'` anchoring like `formatCalendarDate`; pinned Latin-digit locale.
- [x] T018 [P] `src/features/student/notifications/lib/relative-time.ts` (allow-listed Home import): under 1 day and 2 to 29 days delegate to Home's `formatRelativeTime`; exactly one day uses `Intl.RelativeTimeFormat(toFormattingLocale(locale), { numeric: 'auto' })`; 30 days or more returns the date; a future `created_at` reads as "Just now"; an unreadable date returns an empty string.
- [x] T019 [P] `src/features/student/notifications/lib/badge.ts`: `formatBadge(count)` returns `''` for null, 0 or negative, `'1'` to `'99'`, `'99+'` above.
- [x] T020 [P] `src/features/student/notifications/lib/errors.ts`: `classifyListError(error)` returns `'unauthorized'` for 401, `'forbidden'` for 403, otherwise `'generic'` (404 included).
- [x] T021 [P] `src/features/student/notifications/lib/polling.ts`: pure helpers `POLL_INTERVAL_MS = 60_000`, `isTerminalStatus(error)` (an `ApiError` with status 401, 403 or 404), `pollingInterval({ terminal, marking })` (false when terminal or marking, else 60 000), `shouldFocusRefetch({ terminal, marking })`.
- [x] T022 [P] `src/features/student/notifications/lib/cache-updates.ts`: pure updaters on `InfiniteData<NotificationPage>` and on `{ unreadCount } | undefined`: `markReadInPages(data, id)` returns `{ data, flipped }`, `markAllInPages(data)` returns `{ data, flippedIds }`, `restoreUnread(data, ids)`, `adjustCount(count, delta)` (never below 0, a no-op for `undefined`); all tolerate `undefined` data.
- [x] T023 [P] `src/features/student/notifications/query-keys.ts`: `studentNotificationsKeys.list()` is `['student-notifications','list']`, `.mark(id)` is `['student-notifications','mark', id]` and `.markAll()` is `['student-notifications','mark','all']`.

### Messages and copy

- [x] T024 `src/messages/en.json` and `src/messages/ar.json`: add the `StudentNotifications` namespace with identical key shapes (page, markAll, markRead, new, time, types for the six with title and body variants, documents for the seven codes `cv`, `transcript`, `graduation_certificate`, `passport`, `recommendation_letters`, `english_test`, `university_admission_letter`, actions, empty, errors, loadMore, badge) and `StudentLayout.nav.notifications`, `StudentLayout.pages.notifications.{title,description}`, `StudentLayout.userMenu.notifications`. Copy per spec FR-012 and FR-020 to FR-026. Deadline body is a plural with a full sentence per category (no `#`). Titles never contain apostrophes (ICU quoting).
- [x] T025 `src/features/student/notifications/registry/copy.ts`: `buildNotificationCopy(notification, { t, locale, now })` returns `{ title, body, meta }` from messages only: deadline body with the formatted date and, when `missingDocuments` has known codes, a second sentence listing them through `Intl.ListFormat(toFormattingLocale(locale))`, otherwise the "some documents are missing" sentence when only unknown codes exist; meta is the relative time plus "Reminder {index} of {total}" for reminders (never "(N days before)"); `saved_scholarship_updated` uses a per-code sentence for `language_requirement_added` and the generic sentence otherwise; `document_analysis_ready` names the target when present.
- [x] T026 Tests in `tests/student-notifications.test.mjs` for T010 to T025: parser (unknown type skipped and counted, malformed skipped and counted, each constraint from T011 has a passing and a failing case, extra fields ignored, bad envelope throws, a missing or non-integer `id` is malformed, `action` undefined read as null, values never in `skipped`), `resolveAction` (null action, each of the three action types, an unknown type, details flag on and off, invalid `targetId`, profile always, document analysis always hidden), deadline date (no UTC shift, year only when not current), relative time (all buckets, `Yesterday`, 30 days gives a date, future gives "Just now", Latin digits in `ar`), `formatBadge`, `classifyListError`, `polling.ts`, `cache-updates.ts` (undefined-safe, never below 0), copy for each type in en and ar (no server sentence, Latin digits, unknown `change` and unknown documents fall back), and i18n (key parity, valid ICU, no `#`, every plural defines its locale's categories, Arabic plurals render for 0, 1, 2, 3, 11 and 100, every registry type has messages and a parser in both languages).
- [x] T027 Commit: `feat(notifications): add the adapter, type registry and copy` (T010 to T026).

### Home source and fake backend

- [x] T028 `src/features/student/home/hooks/useHomeSources.ts`: add an optional second argument `{ notificationsEnabled?: boolean }`; when true pass `availability: { ...HOME_API_AVAILABILITY, notifications: true }` to `createHomeSources`. `HOME_API_AVAILABILITY` and its tests are untouched; the default behavior is unchanged.
- [x] T029 `src/features/student/notifications/lib/unread-source.ts` (allow-listed Home import): the only file that imports `useHomeSources`, `sourceQueryOptions` and `studentHomeKeys`; exports `useUnreadSource({ notificationsEnabled, mockSections })`, `unreadCountQueryKey()` (the real kind's key) and the option builder shared by the driver and the readers.
- [x] T030 Tests in `tests/student-notifications.test.mjs`: with the flag the source is `real` and its key is `['student-home','notifications','real']`; without it Home's behavior (unavailable, or demo when listed in non-production) is unchanged; real wins over demo; the same key for the driver, the readers and Home's page.
- [x] T031 `tests/e2e/fake-backend/server.mjs`: implement `GET /api/notifications` (per-user list sorted `created_at` descending then `id` descending, `page`, `page_size`, optional `is_read`, the exact envelope), `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read` (idempotent: re-marking a read row answers 200 too; 404 for a missing id or another user's id; answers `{ id, is_read, read_at }`), `PATCH /api/notifications/read-all` (answers `{ updated }`), 401 without a session, and 403 for every `/admin/notifications...` path. Control API: seed items per user (also through `/__e2e/users`), add an item mid-test, set a delay and the next N answers of one endpoint to a status, and include notification state in `/__e2e/state`. The request log already records every call.
- [x] T032 [P] `tests/e2e/support/backend.ts`: extend `SeedOptions` and add helpers `seedNotifications`, `addNotification`, `failNext(endpoint, status, times)`, `delayEndpoint(endpoint, ms)`, `notificationRequests(email)`; add a `notification(type, overrides)` factory for the six types with valid params.
- [x] T033 Commit: `feat(notifications): read the unread count through the Home source and extend the fake backend` (T028 to T032).

**Checkpoint**: adapter, registry, copy, Home source override and the fake backend are tested. No UI yet.

---

## Phase 3: User Story 1 - View my notifications (Priority: P1) 🎯 MVP

**Goal**: `/[locale]/student/notifications` lists notifications newest first with the type icon and color, title, body, relative time, optional action and the unread style.

**Independent Test**: seed one notification of each type (some unread) and open the page in `en` and `ar`; compare with the design. Unknown and malformed items are absent.

### Tests for User Story 1

- [x] T040 [P] [US1] `tests/student-notifications-ui.test.mjs`: server-render `NotificationCard` for each of the six types in en and ar (title, body, icon box and tone, "New" pill and orange border only when unread, `<time dateTime title>`, no server text), the action link only when resolved from the backend `action` (`open_scholarship` shows `View` with details on and nothing with it off, `open_profile` shows `Complete profile`, `open_document_analysis`, an unknown type and `null` show nothing), unread card renders a button with the "Mark as read" description while a read card does not, titles wrapped in `<bdi>`, logical properties only; the list is an `<ol>` with an accessible name (FR-011); every interactive element has a `focus-visible` class and an accessible name (FR-074).
- [x] T041 [P] [US1] `tests/student-notifications-ui.test.mjs`: the route file is a Server Component that checks `featureFlags.notificationsEnabled` and calls `notFound()` before returning the page, passes `detailsEnabled={featureFlags.scholarshipDetailsEnabled}`; the header has a page key `notifications` with the title and description from messages.
- [x] T042 [P] [US1] `tests/e2e/specs/notifications.spec.ts` (en and ar): all six types render with title, body and time; unread has the orange border and "New"; order is newest first; unknown and malformed items are skipped; the header title is "Notifications center". The flags-on e2e server keeps `SCHOLARSHIP_DETAILS_ENABLED` empty (assumption A14), so assert that "View" is absent on the three scholarship types and "Complete profile" is present on `profile_incomplete`.

### Implementation for User Story 1

- [x] T043 [US1] `src/features/student/layout/types.ts` and `student-navigation.ts`: add `'notifications'` to `StudentPageKey` and `getStudentPageKey` (`/student/notifications` and its sub-routes). Do not add the nav item yet (US3).
- [x] T044 [P] [US1] `src/features/student/notifications/hooks/useMinuteClock.ts`: a `now` in state refreshed every 60 s while the page is visible (paused when hidden).
- [x] T045 [P] [US1] `src/features/student/notifications/hooks/useNotificationsList.ts`: `useInfiniteQuery` with `queryKey: studentNotificationsKeys.list()`, `initialPageParam: 1`, `getNextPageParam` from `page < totalPages`, `staleTime: 0`, `gcTime: 0`, `refetchOnMount: 'always'`, `refetchOnWindowFocus: false`, retry from `shouldRetryScholarshipQuery`, `queryFn` through `fetchNotificationPage`; merges pages by `id` (first copy wins) and keeps the server's order; logs one non-production warning with the two skip counts only.
- [x] T046 [P] [US1] `src/features/student/notifications/components/NotificationIcon.tsx`: the 42px rounded tinted box; renders the alarm-clock asset with `next/image` (`alt=""`, from `public/images/student/notifications/time-circle.svg`) or the registry's lucide icon (`aria-hidden`).
- [x] T047 [US1] `src/features/student/notifications/components/NotificationCard.tsx`: from the reading start: icon box, text block (title 14px medium, body 12px, time line 12px with a `Clock` icon, `<time>`), end column with the "New" pill and the action link; unread gets `border-orange-500`, read the grey border; the unread text block is a `<button type="button">` of `<span>` blocks with `aria-describedby` to a hidden "Mark as read" hint (wired in US2); titles in `<bdi>` and clamped to two lines; `min-w-0` and `break-words` so nothing overflows.
- [x] T048 [US1] `src/features/student/notifications/components/NotificationStates.tsx`: `NotificationsLoading` (skeleton cards and an `sr-only` `role="status"`), `NotificationsEmpty` (heading, body, "Search scholarships" link, from the Tracking pattern), `NotificationsError` (`role="alert"`, reasons `unauthorized`, `forbidden`, `generic`, Retry except for 403). Built here because the page cannot render without them; US5 verifies them in depth.
- [x] T049 [US1] `src/features/student/notifications/components/NotificationsPage.tsx`: `<ol aria-label>` of cards, states from T048, `detailsEnabled` prop, `now` from `useMinuteClock`, a 401 re-checks the session (invalidate `currentUserQueryKey`, the Home pattern); `src/features/student/notifications/index.ts` exports it.
- [x] T050 [US1] `src/app/[locale]/student/notifications/page.tsx`: Server Component gate (same shape as `settings/page.tsx`).
- [x] T051 [US1] Run the T040 to T042 tests, fix, format only the touched files. Commit: `feat(notifications): add the notification center page` (T043 to T051).

**Checkpoint**: with the flag on, the page lists notifications in both languages; marking and counts do not exist yet.

---

## Phase 4: User Story 2 - Mark notifications as read (Priority: P1)

**Goal**: optimistic mark-read for a card or its action, "Mark all as read", targeted rollback.

**Independent Test**: with a delayed fake backend, click an unread card and see the card and the count change before the PATCH answers; make the next PATCH fail and see both roll back.

### Tests for User Story 2

- [x] T060 [P] [US2] `tests/student-notifications.test.mjs`: hook logic with a stub `QueryClient`: marking flips the card and decrements the count once (never below 0, untouched when no count is loaded); one PATCH per id; none for a read item; none while one is pending for that id; failure restores only that id and only its delta while another pending mark's change stays; mark-all flips every loaded card, sets the count to 0, restores exactly `flippedIds` and the previous count on failure; starting a mark cancels the count query; one reconcile refetch after the last pending mark settles; a 404 on a single mark drops the card from the loaded list, refetches the count and does not roll back (no message); any other failure rolls back; updaters tolerate a missing list cache.
- [x] T061 [P] [US2] `tests/student-notifications-ui.test.mjs`: `MarkAllReadButton` renders only while a loaded card is unread or the count is above 0 (and does not depend on the count having loaded), is disabled while pending, has the check-double icon and `min-h-11`; the error message uses `role="alert"`, the success message `role="status"` with the count-free sentence; the failure alert stays until the next mark attempt on the page (FR-037).
- [x] T062 [P] [US2] `tests/e2e/specs/notifications.spec.ts` (en, ar): click flips the card and the count before a delayed PATCH answers; Enter and Space on the unread button do the same; exactly one PATCH; a read card sends nothing; a failed PATCH restores only that card and shows the alert; clicking the action marks it read and navigates without waiting; "Mark all as read" sends one PATCH, clears the badge and cards, and a failed one restores everything.

### Implementation for User Story 2

- [x] T063 [US2] `src/features/student/notifications/hooks/useMarkRead.ts`: `useMutation` keyed `studentNotificationsKeys.mark(id)`; `onMutate` cancels `unreadCountQueryKey()`, flips the item in the list cache (if present), decrements the count only if loaded and the item was unread, returns `{ flippedIds, countDelta }`; `onError`: a 404 (`ApiError.status === 404`) removes the item from the list cache and refetches the count, with no rollback and no message; any other failure restores only those; `onSettled` refetches the count once when no other mark is pending; skips before any request for a read item or one already pending.
- [x] T064 [P] [US2] `src/features/student/notifications/hooks/useMarkAllRead.ts`: same pattern for `markAll()`; records `flippedIds` and the previous count; success validates `{ updated }`.
- [x] T065 [US2] `src/features/student/notifications/components/MarkAllReadButton.tsx`: outlined pill (`rounded-full border`, 12px text, `CheckCheck` icon), end-aligned above the list, disabled while pending, `min-h-11`; success `role="status"` message and failure `role="alert"` message from messages.
- [x] T066 [US2] Wire `NotificationCard` and `NotificationsPage`: the unread button calls `markRead(id)`; the action `<Link>` has `onClick` that calls `markRead(id)` without `preventDefault`; the error message region; hide the mark-all button per FR-033.
- [x] T067 [US2] Run T060 to T062, fix, format touched files. Commit: `feat(notifications): mark notifications as read optimistically` (T063 to T067).

**Checkpoint**: the list is interactive; counts are updated in the cache even though no badge shows yet.

---

## Phase 5: User Story 3 - Unread badge, bell and polling (Priority: P1)

**Goal**: sidebar item with the count, bell with a dot linking to the page, one poller with the stop rules, Home's stat card agreeing.

**Independent Test**: seed 3 unread, open any student page: sidebar "3", bell dot, Home card "3"; add one in the fake, advance the clock 60 s, see "4"; hide the tab and see no requests.

### Tests for User Story 3

- [ ] T070 [P] [US3] `tests/student-layout.test.mjs` and `tests/student-mobile-shell.test.mjs`, plus every other test that enumerates the navigation (`student-application-tracking-ui`, `student-home`, `student-saved-scholarships`, `student-scholarship-details`, `student-settings`; find them with `grep -l "studentNavigation\|navigationIcons\|StudentNavigationItemId" tests/*.mjs`): update the exact navigation list (`notifications`, `/student/notifications`, `personal` placed before `profile`) and the "everything on" sections (`personal` becomes `notifications`, `profile`); keep the assertions that the tab bar has the same five items and that `studentTabBarOrder` is unchanged.
- [ ] T071 [P] [US3] `tests/student-notifications-ui.test.mjs`: shell wiring: the item is hidden when `notificationsEnabled` is false and visible with the flag, active on `/student/notifications` and sub-routes, the badge slot renders inside the link, the accessible name includes the count, the tablet drawer has the same item, `StudentShell` and the layout feature never import from `student/home` or `student/notifications`; `NotificationsBell` is a link to `/student/notifications` with the dot only above 0, `aria-current="page"` on the page; `NotificationsNavBadge` shows nothing at 0 or null, `1` to `99`, `99+` above; Home's `NotificationBell` default output is unchanged when no `href` is given.
- [ ] T072 [P] [US3] `tests/student-notifications.test.mjs`: driver behavior with a fake timer and a counting `fetch` stub: one request on mount, one per 60 s while visible, none while hidden, one on visibility and one on `focus` coalesce into one request, none while a mark or a count request is pending, a 401, 403 or 404 stops interval and focus and hides the count, other errors keep the last count and the rhythm, a manual `refetch()` that succeeds resumes polling, a 401 invalidates the current-user query, and with five passive readers mounted the request count stays at one per minute.
- [ ] T073 [P] [US3] `tests/e2e/specs/notifications-count.spec.ts`: sidebar, bell and Home stat agree (3); adding an item and advancing `page.clock` by 60 s shows 4 with no reload; a hidden tab (`visibilitychange`) makes no request and a visible one requests at once; stops after 401, 403 and 404 (no further `unread-count` calls, no badge or dot); a 5xx keeps the last value; counts the `unread-count` requests across a minute with desktop sidebar, bell and Home mounted (one per tick).

### Implementation for User Story 3

- [ ] T074 [US3] Shell, generic only: `src/features/student/layout/types.ts` (`'notifications'` in `StudentNavigationItemId`), `student-navigation.ts` (item `{ id: 'notifications', labelKey: 'nav.notifications', href: '/student/notifications', enabled: false, group: 'personal' }` placed before `profile`, plus `withNotificationsEnabled`), `navigation-icons.ts` (`Bell`).
- [ ] T075 [US3] `StudentShell.tsx`: props `notificationsEnabled`, `navigationBadges?: Partial<Record<StudentNavigationItemId, ReactNode>>`; compose `withNotificationsEnabled`; pass `navigationBadges` to `StudentSidebar` and `StudentMobileNavigation`. `StudentSidebar.tsx` renders `navigationBadges[item.id]` at the end of the item's link, outside the label text, with the badge providing its own accessible text. `StudentMobileNavigation.tsx` forwards the prop. `StudentTabBar.tsx` and `studentTabBarOrder` are not touched.
- [ ] T076 [P] [US3] `src/features/student/home/components/NotificationBell.tsx`: add optional `href` (renders a `next-intl` `Link`, keeps the same circle and dot), `size` (`'default' | 'compact'`, compact is `size-11` below `sm:size-8` like the language button) and `current`; with none of them the output is identical to today's.
- [ ] T077 [US3] `src/features/student/notifications/hooks/useUnreadCount.ts` (passive reader: `enabled: false` on the shared key, returns `{ count: number | null, stopped: boolean }`) and `useUnreadCountDriver.ts` (the one poller: `enabled` and `refetchInterval` as functions per T021, `refetchIntervalInBackground: false`, `useIsMutating` for the marking pause, the `window` `focus` listener calling `refetchQueries(..., { cancelRefetch: false })`, 401 invalidates `currentUserQueryKey`).
- [ ] T078 [P] [US3] `src/features/student/notifications/components/NotificationsCountDriver.tsx` (renders `null`), `NotificationsBell.tsx` (allow-listed Home import: wraps Home's `NotificationBell` with `href="/student/notifications"` and the `bell.label` message; `aria-current` on the page), `NotificationsNavBadge.tsx` (orange pill, `formatBadge`, `sr-only` text from the plural `badge.unread` message, `min-w-[18px]`, logical padding). Export all from `index.ts`.
- [ ] T079 [US3] `src/app/[locale]/student/layout.tsx`: read `featureFlags.notificationsEnabled`; when on, render `<NotificationsCountDriver mockSections=… notificationsEnabled />` inside `RoleGuard` beside the shell, pass `notificationsEnabled`, `navigationBadges={{ notifications: <NotificationsNavBadge/> }}`, and `headerActions={<NotificationsBell/>}`; when off and Home is on keep today's `HomeNotificationBell` (Home's demo mode is unchanged). Keep the `shellProps` object with its `headerActions:` key, the `<HomeNotificationBell` element and `<StudentShell {...shellProps}>`: `tests/student-home.test.mjs` ("shell layout: the route layout wires the flag and the bell…") asserts that text.
- [ ] T080 [US3] Home: `src/app/[locale]/student/page.tsx` passes `notificationsEnabled`; `StudentHomePage.tsx` forwards it to `useHomeSources(mockSections, { notificationsEnabled })` and gives the notifications stat card `href="/student/notifications"` when it is on (009 FR-018: a card links only when its destination exists and is enabled); `StatCards.tsx` and `StatCard.tsx` use their existing link mechanism. `tests/e2e/specs/home.spec.ts`: one added assertion that the fourth card shows the same number as the badge.
- [ ] T081 [US3] Run T070 to T073 and the whole `corepack pnpm test` (a navigation change can break any of the seven navigation tests), fix, format touched files. Commit: `feat(notifications): show the unread count in the sidebar, the bell and Home` (T074 to T081).

**Checkpoint**: P1 behavior is complete with the flag on.

---

## Phase 6: User Story 4 - The feature does not exist while the flag is off (Priority: P1)

**Goal**: with the flag off: localized 404, nothing visible, zero notification requests.

**Independent Test**: open the flags-off server (port 3101): `/en/student/notifications` and `/ar/student/notifications` are the localized 404 and the fake's request log has no `/api/notifications` entry.

- [ ] T090 [P] [US4] `tests/student-notifications-ui.test.mjs`: with the flag off the layout passes no driver, no badge, no compact bell and no `notificationsEnabled`; the route returns `notFound()` before `<NotificationsPage>`; the flag is read through the getter on each render (flip `process.env` between two renders).
- [ ] T091 [US4] `tests/e2e/specs/flags-off.spec.ts`: add (en and ar) `/student/notifications` is the localized 404; the sidebar, the tablet drawer, the 390px account menu and the compact bar show no Notifications item, bell or badge; the fake's request log has no `/api/notifications` path (only `/auth/login` and `/auth/me` besides the page); the existing sidebar assertion (only search and profile) still holds.
- [ ] T092 [US4] Run T090 and T091; commit: `test(notifications): cover the flag-off behavior` (T090 to T092).

**Checkpoint**: shipping the code dark is proven harmless.

---

## Phase 7: User Story 5 - Load more and clear states (Priority: P2)

**Goal**: pagination without duplicates, and verified loading, empty and error states.

**Independent Test**: seed 45 notifications; "Load more" shows 20, then 40, then 45 and disappears; force a failure on page 2 and see the inline retry with the loaded cards intact.

- [ ] T100 [P] [US5] `tests/student-notifications.test.mjs`: page merging (first copy wins on duplicate ids, order kept), `getNextPageParam` stops at `page >= totalPages`, a page whose items are all skipped still counts and keeps "Load more" until the last page, empty shows only after the last page with nothing renderable.
- [ ] T101 [P] [US5] `tests/student-notifications-ui.test.mjs`: loading (skeleton and `role="status"`), empty (heading, body, link), first-page error reasons (session expired, access unavailable without Retry, generic with Retry), later-page error keeps the cards and shows an inline alert with Retry, a bad envelope shows the error state and never the empty state, all controls `min-h-11`; a 401 from the list invalidates `currentUserQueryKey` (FR-052).
- [ ] T102 [US5] `src/features/student/notifications/components/LoadMoreButton.tsx` and the later-page error in `NotificationStates.tsx`; wire `fetchNextPage`, `hasNextPage`, `isFetchingNextPage` in `NotificationsPage.tsx`. Retry on the first-page error also calls the count query's `refetch()` so polling can resume (FR-053).
- [ ] T103 [US5] `tests/e2e/specs/notifications.spec.ts` (en, ar): load more with 45 items, no duplicates when an item is added between pages, the control disappears after the last page; loading skeleton under a delayed list; empty state with the search link; first-page failure with Retry; page-2 failure keeps the loaded cards; Retry after a count 404 resumes polling.
- [ ] T104 [US5] Run T100 to T103; commit: `feat(notifications): load more and the loading, empty and error states` (T100 to T104).

---

## Phase 8: User Story 6 - Use it on a phone (Priority: P2)

**Goal**: bell in the compact top bar, a menu link, single column, 44px targets, five-item tab bar.

**Independent Test**: at 390px open the page: bell in the top bar with the dot, account menu link, full-width action buttons, no horizontal scroll, five tabs.

- [ ] T110 [P] [US6] `tests/student-notifications-ui.test.mjs`: `StudentHeader` renders `compactHeaderActions` in the compact bar between the language button and the account menu (below `lg`) and not elsewhere; `StudentUserMenu` shows the "Notifications" link only with `notificationsEnabled`; card classes are single-column below `sm` with the "New" pill on the title row and a full-width action under the text; every control is `min-h-11` or `size-11`; no `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-` and no bare `rtl:` in the feature; the bell, the menu link and the card controls have accessible names (FR-074).
- [ ] T111 [US6] `src/features/student/layout/StudentHeader.tsx`: new prop `compactHeaderActions` rendered in the compact bar before the account menu; pass `notificationsEnabled` to `StudentUserMenu`; `StudentShell.tsx` forwards both. `src/features/student/layout/StudentUserMenu.tsx`: a `role="menuitem"` link "Notifications" (min height 44px) when enabled. `src/app/[locale]/student/layout.tsx`: `compactHeaderActions={<NotificationsBell size="compact"/>}`.
- [ ] T112 [US6] Card layout at 390px in `NotificationCard.tsx`: icon and text on one row, the "New" pill stays on the title row at the inline end, the action button moves under the text at full width, `min-w-0` everywhere, long titles clamp.
- [ ] T113 [US6] `tests/e2e/specs/notifications.spec.ts` at 390px (en, ar): the bell is in the top bar with the dot and opens the page; the account menu has the link; the tab bar still has the same five items; `scrollWidth <= clientWidth` on the page; every interactive element measures at least 44x44; actions are full width; the tablet drawer shows the item and its badge.
- [ ] T114 [US6] Run T110 to T113; commit: `feat(notifications): phone layout, top-bar bell and menu link` (T110 to T114).

---

## Phase 9: Guards, docs and verification

- [ ] T120 [P] Guard tests in `tests/student-notifications-ui.test.mjs` (like 009 and 010): logical properties only and no bare `rtl:` across `src/features/student/notifications/**` and the files the feature edits; directional icons (`Chevron*`, `Arrow*`, `LogOut`) in the feature are flipped from the locale, never `rtl:`; no hard-coded copy (no Arabic letters in code, no quoted English sentences or JSX text outside `src/messages`); Latin digits in the Arabic render; no `localStorage`, `sessionStorage`, `document.cookie`, `Authorization`, `token` or `console.` calls that print params in the feature; backend field names appear only under `adapter/`; imports from `student/home` come only from the three allow-listed files; the shell never imports the feature; `src` never imports `tests/`, `scripts/` or fixtures; no `/admin/notifications` string in `src`.
- [ ] T121 [P] `docs/e2e/README.md`: document `NOTIFICATIONS_ENABLED` in the flags table, the four fake endpoints, the control API and the polling test's use of `page.clock`.
- [ ] T122 [P] `specs/011-student-notifications/verification.md`: results table (filled at the end), the launch checklist from quickstart.md, the assumptions and open questions copied for the PR, the list of design-vs-contract differences.
- [ ] T123 Run `corepack pnpm lint`, `corepack pnpm exec tsc --noEmit`, `corepack pnpm test`, `corepack pnpm build`, `E2E_REBUILD=1 corepack pnpm test:e2e` (use the `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` workaround from the repo notes if fonts.googleapis.com is unreachable); fix what fails; record results in verification.md.
- [ ] T124 Manual pass in `en`, `ar` and at 390px against the Figma frame 2481:4980 (screenshots are attached to the PR by hand and not committed); fix mismatches in scope.
- [ ] T125 Commit: `docs(notifications): record verification`. Push `feat/011-student-notifications`; give the compare URL and the PR description. Do not open the PR and do not merge.

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)** has no dependencies.
- **Phase 2 (Foundational)** needs Phase 1 and blocks every story.
- **Phase 3 (US1)** needs Phase 2. It is the MVP: with the flag on the page works.
- **Phase 4 (US2)** needs US1 (the card and the list cache). **Phase 5 (US3)** needs Phase 2 and the page key from US1; it does not need US2 (the mark hooks only adjust the shared count key).
- **Phase 6 (US4)** needs US1 and US3 (so it can assert that every entry point is absent).
- **Phase 7 (US5)** needs US1 (it extends the page). **Phase 8 (US6)** needs US3 (it reuses the bell) and US1.
- **Phase 9** needs everything.

### Within a story

Tests first (they fail), then pure logic, then hooks, then components, then wiring; commit at the end of the story.

### Parallel opportunities

- Phase 1: T001 to T004 touch different files.
- Phase 2: T010 to T012 and T016 to T023 are different files; T031 and T032 (fake backend) run alongside the adapter work.
- US1: T040 to T042 (tests) together; T044 to T046 together.
- US3: T070 to T073 (tests) together; T076 and T078 together after T074.
- Phase 9: T120 to T122 together.

### Parallel example: User Story 1

```text
T040 card render tests          T041 route and header tests        T042 e2e list spec
T044 useMinuteClock             T045 useNotificationsList          T046 NotificationIcon
```

## Implementation strategy

1. **MVP** = Phases 1 to 3: the flagged page with the list, in both languages. Demoable against the fake backend.
2. **P1 complete** = Phases 4 to 6: marking, badge, bell, polling, flag-off proof. This is the release candidate behind the flag.
3. **P2** = Phases 7 and 8: pagination, states, phone layout. Phase 9 closes with the guards, docs and the full run.
4. Each phase ends in its own commit, so a stop at the 90-minute time box leaves a coherent branch.
5. The BE-13 endpoints are not required for any task. The flag stays off in Production and Preview until the open questions in the spec are answered and the contract is verified against a real session.
