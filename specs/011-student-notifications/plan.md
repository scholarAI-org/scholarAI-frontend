# Implementation Plan: Student Notifications

**Branch**: `feat/011-student-notifications` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md) | **Contract**: [contract-notes.md](./contract-notes.md)

**Input**: Feature specification from `specs/011-student-notifications/spec.md`

## Summary

A flag-gated notification center (`/[locale]/student/notifications`, `NOTIFICATIONS_ENABLED`) with an unread badge on a new sidebar item and an unread dot on the header bell. The count is read through the **existing Home notifications source** (`HomeSources.notifications`, already pointed at `GET /api/notifications/unread-count`) and polled by **one** headless driver; the badge, the bells and Home's stat card are passive readers of that one query. The list is an infinite query over `GET /api/notifications`; marking is optimistic with a targeted rollback. Backend field names live in one adapter folder; the UI sees an internal camelCase model and a registry of six notification types that owns icons, tones, and copy keys. The shell stays generic: it gains an enable boolean, a badge slot and a compact-bar slot, supplied by the route layout.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.4 App Router, React 19.2

**Primary Dependencies**: `next-intl` 4 (ar/en), `@tanstack/react-query` 5.101 (function-valued `enabled` and `refetchInterval` are available), `zod` 4, `lucide-react`, Tailwind v4

**Storage**: none. Notification data lives only in the in-memory query cache, which `useLogout` clears (`queryClient.clear()`). Nothing in `localStorage`, `sessionStorage` or cookies.

**Testing**: `node --test` with the `ts.transpileModule` loader (`tests/helpers/load-src.mjs`); Playwright e2e against `tests/e2e/fake-backend/server.mjs` (flags-on server on 3100, flags-off on 3101)

**Target Platform**: browsers; desktop 1024px and up, tablet 640 to 1023px, phone 390px

**Project Type**: web application (single Next.js app)

**Performance Goals**: first page of 20 cards renders without virtualization; one count request per minute per tab, never while hidden

**Constraints**: do not modify `src/lib/api-client.ts`, `src/proxy.ts`, `AuthProvider.tsx`, `RoleGuard.tsx`; flags server-only and never default true; `src/` never imports from `tests/`, `scripts/` or fixtures; logical CSS only and no bare `rtl:`; no hard-coded copy; no token logging or storage

**Scale/Scope**: 1 new route, 1 new feature folder (about 30 files), small generic changes to 8 shell and Home files, 2 message files, 1 fake-backend extension, 2 unit test files and 3 e2e specs

## Constitution Check

_Gate: passes. Re-checked after Phase 1 design: unchanged._

| Principle                                     | How this plan complies                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Figma informs, architecture leads          | Figma node 2481:4980 was inspected; its structure is turned into one `NotificationCard`, a type registry and normal flex layout. No generated code is copied; the only absolute positioning in the design (pill and meta) is replaced by flex.                                         |
| II. Reuse the established application system  | Home notifications source and bell, `shouldRetryScholarshipQuery`, `useUnauthorizedRedirect`'s approach, `getScholarshipDetailsHref`, `Button`, Saved/Tracking state patterns, `parseCalendarDate`, `toFormattingLocale`, card tokens. The shell stays generic (props and slots only). |
| III. Preserve the platform contract           | App Router, `next-intl`, React Query, `AuthProvider` and `RoleGuard` unchanged; the route sits under the student layout; session state comes only from the current-user query; no new auth store.                                                                                      |
| IV. Internationalization and bidirectionality | `StudentNotifications` namespace in ar and en with identical shapes; logical properties; no bare `rtl:`; Latin digits; checked in ar/en and at 390px.                                                                                                                                  |
| V. Quality is part of fidelity                | Semantic list, a real `<button>` for the unread card and a separate real link for the action, `role="alert"`/`role="status"`, 44px targets, text (not color) for unread.                                                                                                               |

## Complexity Tracking

| Exception                                                 | Why needed                                                                                                                                        | Simpler alternative rejected because                                                                                                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Five type icons are `lucide-react` glyphs, not Figma SVGs | The design's icons are Font Awesome characters (font text); there is no SVG source asset to export, so "reuse the exact asset" (II) cannot apply. | Importing Font Awesome adds a font and a second icon system to a repo that uses lucide everywhere. The one real asset (alarm clock) is reused as is. Scope: this feature. Rollback: swap a registry entry's icon. |
| Notifications feature has 3 allow-listed imports of Home  | The brief says to reuse the Home source and bell instead of creating a second one.                                                                | Copying them is the "second abstraction" the brief forbids; moving them rewrites Home imports and tests. A guard test pins the allow-list so the coupling cannot grow.                                            |

## Project Structure

### Documentation

```text
specs/011-student-notifications/
├── spec.md
├── plan.md              # this file
├── research.md          # decisions and alternatives
├── data-model.md        # entities, states, cache shapes
├── contract-notes.md    # BE-13 as consumed, adapter swap procedure
├── contracts/
│   └── notifications.openapi.yaml   # the four endpoints, as the fake backend implements them
├── quickstart.md        # how to run and verify
├── tasks.md
├── analysis.md          # /speckit.analyze report
└── checklists/requirements.md
```

### Source code

```text
.env.example                                           # + NOTIFICATIONS_ENABLED (empty)
playwright.config.ts                                   # + NOTIFICATIONS_ENABLED on flags-on only
package.json                                           # + test:student-notifications
src/lib/feature-flags.ts                               # + notificationsEnabled getter
src/app/[locale]/student/notifications/page.tsx        # Server gate -> notFound() | <NotificationsPage detailsEnabled/>
src/app/[locale]/student/layout.tsx                    # + flag -> shell props, driver, bell, badge
src/app/[locale]/student/page.tsx                      # Home route: + notificationsEnabled -> StudentHomePage

# Shell (generic; never imports Home or notifications)
src/features/student/layout/types.ts                   # + 'notifications' in StudentNavigationItemId and StudentPageKey
src/features/student/layout/student-navigation.ts      # + item (personal group, before profile, enabled false), withNotificationsEnabled, page key
src/features/student/layout/navigation-icons.ts        # + notifications: Bell
src/features/student/layout/StudentShell.tsx           # + notificationsEnabled, navigationBadges, compactHeaderActions
src/features/student/layout/StudentHeader.tsx          # + compactHeaderActions in the compact bar; + notificationsEnabled to the menu
src/features/student/layout/StudentSidebar.tsx         # + renders navigationBadges[item.id] inside the item link
src/features/student/layout/StudentMobileNavigation.tsx# + navigationBadges to the drawer's sidebar
src/features/student/layout/StudentUserMenu.tsx        # + Notifications menuitem (flag on)

# Home (small, backwards-compatible)
src/features/student/home/hooks/useHomeSources.ts      # + optional { notificationsEnabled } -> availability override
src/features/student/home/components/NotificationBell.tsx   # + optional href, size, current (default output unchanged)
src/features/student/home/components/StudentHomePage.tsx    # + notificationsEnabled prop -> useHomeSources, stat card href
src/features/student/home/components/StatCard(s).tsx   # stat card gets a link for notifications when href is set (existing mechanism)

# New feature
src/features/student/notifications/
├── index.ts                         # public surface: NotificationsPage, NotificationsCountDriver, NotificationsBell, NotificationsNavBadge
├── query-keys.ts                    # studentNotificationsKeys.list(), .mark(id|'all')
├── adapter/                         # THE ONLY place with backend field names (FR-090)
│   ├── wire.ts                      # zod: list envelope, item envelope, mark-read answer, read-all answer
│   ├── params.ts                    # zod per type: wire params -> internal params
│   ├── parse-page.ts                # parseNotificationPage(raw) -> { items, page, pageSize, total, totalPages, skipped }
│   └── api.ts                       # fetchNotificationPage, markNotificationRead, markAllNotificationsRead (apiClient)
├── model/types.ts                   # StudentNotification (discriminated union), NotificationPage, NotificationAction
├── registry/
│   ├── registry.ts                  # six entries: wire params, icon, tone, copy key
│   ├── copy.ts                      # buildNotificationCopy(notification, ctx) -> { title, body, meta }
│   └── actions.ts                   # resolveAction(notification, { detailsEnabled }) -> { href, labelKey } | null
├── lib/
│   ├── unread-source.ts             # allow-listed Home import #1: source, query key, availability override
│   ├── relative-time.ts             # allow-listed Home import #3: delegates to formatRelativeTime
│   ├── deadline-date.ts             # day + long month (+ year if not current), from a CalendarDate
│   ├── badge.ts                     # formatBadge(count) -> '' | '1'..'99' | '99+'
│   ├── polling.ts                   # pure: interval, stop statuses, retry
│   ├── cache-updates.ts             # pure: markReadInPages, markAllInPages, restore, adjustCount
│   └── errors.ts                    # classify ApiError -> 'unauthorized' | 'forbidden' | 'generic'
├── hooks/
│   ├── useUnreadCount.ts            # passive reader (count | null, stopped)
│   ├── useUnreadCountDriver.ts      # the ONE poller: interval, focus, stop rules, pause while marking
│   ├── useNotificationsList.ts      # useInfiniteQuery, gcTime 0, page 1 every visit
│   ├── useMarkRead.ts               # optimistic, targeted rollback, one PATCH per id
│   ├── useMarkAllRead.ts
│   └── useMinuteClock.ts            # "now" refreshed every 60 s while visible
└── components/
    ├── NotificationsPage.tsx        # header-less page body: toolbar, list, states
    ├── NotificationCard.tsx         # unread button, action link, pill, meta
    ├── NotificationIcon.tsx         # tinted box + lucide icon or the alarm-clock asset
    ├── MarkAllReadButton.tsx
    ├── NotificationStates.tsx       # loading, empty, error, load-more error
    ├── LoadMoreButton.tsx
    ├── NotificationsCountDriver.tsx # renders null; mounts useUnreadCountDriver
    ├── NotificationsBell.tsx        # allow-listed Home import #2: wraps Home's NotificationBell as a link
    └── NotificationsNavBadge.tsx    # sidebar pill with sr-only text

src/messages/{en,ar}.json                              # + StudentNotifications, StudentLayout.nav/pages/userMenu.notifications
public/images/student/notifications/time-circle.svg    # already committed (design asset)

tests/student-notifications.test.mjs                   # adapter, registry, copy, actions, time, polling, cache updates, flag
tests/student-notifications-ui.test.mjs                # rendered markup, shell wiring, states, 390px structure, i18n, guards
tests/e2e/fake-backend/server.mjs                      # + 4 endpoints, control API
tests/e2e/support/backend.ts                           # + seed and fault helpers
tests/e2e/specs/notifications.spec.ts                  # list, mark, mark all, states, load more, mobile
tests/e2e/specs/notifications-count.spec.ts            # badge, bell, Home agreement, polling, hidden tab, stop rules
tests/e2e/specs/flags-off.spec.ts                      # + notifications cases
tests/student-layout.test.mjs, student-mobile-shell.test.mjs   # updated: the item list and the "everything on" sections
docs/e2e/README.md                                     # + fake endpoints and the new flag
```

**Structure Decision**: one feature folder under `src/features/student/notifications/`, split by role (adapter, registry, lib, hooks, components) so that field names, type knowledge and side effects each have one home. Shell and Home get the smallest generic changes that let the route layout inject the feature.

## Key Design Decisions

1. **One count, one query, one poller.** All consumers read the Home source query (`studentHomeKeys.source('notifications', 'real')`). TanStack runs `refetchInterval` per observer, so five observers with an interval would fire up to five requests a minute at different phases. Only `useUnreadCountDriver` (mounted once, as a child of `RoleGuard` in the route layout, so it starts only after the student is authenticated) sets an interval and focus refetching. Everyone else (`useUnreadCount`: badge, both bells, drawer badge) is a passive observer (`enabled: false`) that re-renders when the cache changes. Home's own stat-card observer keeps its default options; its mount and focus refetches coalesce with the driver's because a fetch already in flight is not duplicated (`cancelRefetch: false`).
2. **Availability comes from the server flag, not from the static table.** `useHomeSources(mockSections, { notificationsEnabled })` passes `availability: { ...HOME_API_AVAILABILITY, notifications: notificationsEnabled }` to `createHomeSources`. The static `HOME_API_AVAILABILITY` and its tests are untouched. The three call sites (driver, bells/badge, Home page) all receive the same prop from a Server Component, so they always resolve the same source kind and therefore the same key.
3. **Stop rules live in query options.** `enabled: (query) => source.kind !== 'unavailable' && !isTerminal(query.state.error)` with `isTerminal` = `ApiError` status 401, 403 or 404; `refetchInterval` is `false` when terminal, while a mark is pending (via `useIsMutating`, so the option is re-evaluated) or while hidden (`refetchIntervalInBackground: false`), else 60 000. A disabled query still answers `refetch()`, which is how the list's Retry resumes polling (FR-053). A 401 also invalidates the current-user query, like Home's `useUnauthorizedRedirect`.
4. **Window focus.** TanStack v5 listens only to `visibilitychange`. The driver adds a `window` `focus` listener that calls `refetchQueries({ queryKey, type: 'active' }, { cancelRefetch: false })` unless terminal or marking, so tab-visible and focus coalesce into one request (Q3).
5. **Optimistic marking with a targeted inverse.** `onMutate`: cancel the count query, flip the item in the loaded pages (if present), decrement the count only if it is loaded and the item was unread, and return `{ flippedIds, countDelta }`. `onError`: flip only those ids back and add back only `countDelta`; other pending changes stay (spec FR-037). `onSettled`: if no other mark is pending, refetch the count once (FR-039). The mutation key is `['student-notifications','mark', id | 'all']`; a mutation for an id already pending or already read is skipped before any request. Updaters tolerate missing cache entries, because the list uses `gcTime: 0` and may be gone when an action navigated away.
6. **List query.** `useInfiniteQuery`, `initialPageParam: 1`, `getNextPageParam` from `page < totalPages`, `staleTime: 0`, `gcTime: 0`, `refetchOnMount: 'always'`, `refetchOnWindowFocus: false`, retry from `shouldRetryScholarshipQuery`. Pages are merged by `id` (first copy wins); order is the server's.
7. **Adapter boundary.** `adapter/` holds every backend name and returns the internal model. Item parsing is per item: unknown `type` is counted as `unknownType`, a known type with invalid params or a bad envelope field as `malformed`; neither throws. A bad envelope (not an array, bad page numbers) throws a contract error and shows the error state (FR-054). Wire schemas strip unknown keys, so extra fields never fail a page.
8. **Registry is the only place that knows the six types.** An entry has: wire params schema, internal mapper, icon (lucide component or the asset path), tone classes, copy key prefix. `copy.ts` turns an internal notification into title, body and meta using `useTranslations('StudentNotifications')` values; `Intl.ListFormat` with the pinned locale joins document names; document codes come from the profile feature's seven document keys (`cv`, `transcript`, `graduation_certificate`, `passport`, `recommendation_letters`, `english_test`, `university_admission_letter`), anything else gets the generic sentence. A test fails if a registered type lacks messages in either language.
9. **Actions.** `resolveAction` reads only the backend `action` (owner decision, A4): `null` gives nothing; `open_scholarship` gives the details link through `getScholarshipDetailsHref(targetId, detailsEnabled)`; `open_profile` gives `/student/profile`; `open_document_analysis` and unknown types give nothing. The link's `onClick` calls the mark mutation and does not prevent default (navigation is not delayed).
10. **Unread card semantics.** An unread card's text block is a `<button type="button">` containing `<span>` blocks only, with `aria-describedby` pointing at a visually hidden "Mark as read" hint; the action is a sibling `<Link>`. A read card renders the same text without a button. Unread is conveyed by the "New" pill text and `aria-label` context, not by color alone.
11. **Shell slots.** `StudentShell` gets `notificationsEnabled`, `navigationBadges` (`Partial<Record<StudentNavigationItemId, ReactNode>>`) and `compactHeaderActions`. The route layout builds the nodes (`<NotificationsNavBadge/>`, `<NotificationsBell/>`), so the shell never imports a feature. `studentTabBarOrder` is not touched, so the tab bar keeps five items.
12. **Layout wiring** (`src/app/[locale]/student/layout.tsx`): when `notificationsEnabled`, render `<NotificationsCountDriver mockSections=…/>` inside `RoleGuard` beside the shell, pass `headerActions` and `compactHeaderActions` as `<NotificationsBell/>` (sizes differ), and `navigationBadges={{ notifications: <NotificationsNavBadge/> }}`. When it is off and Home is on, the layout keeps today's `HomeNotificationBell` (Home's demo mode). The flag only crosses the server/client boundary as props.
13. **Fake backend.** Per-user list, strict newest-first order with `id` tie-break, `page`/`page_size`/`is_read`, `PATCH` semantics, and a control API: seed items, add an item mid-test, set the next N answers of an endpoint to a status, add latency, read the request log (already present). Rejects the admin paths with 403 to prove they are never used.
14. **Test strategy.** Pure functions (adapter, registry, actions, time, badge, polling, cache updates) get unit tests; rendered markup tests (`renderToStaticMarkup` as in 009/010) cover cards, states and the shell; e2e covers the browser behaviors (optimistic timing with latency, rollback, polling with `page.clock`, hidden tab via `visibilitychange`, stop rules, 390px geometry). Guards are static scans like Home's.

## Risks

| Risk                                                                                                               | Mitigation                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE-13 differs from the contract in `contract-notes.md` (field names, the list envelope, `missing_documents` codes) | Everything is behind `adapter/` and the registry; wire names appear nowhere else (guard test). The owner fixed the rest on 2026-11-19: integer ids, `action.type` closed list, order, page size, count and PATCH semantics. |
| Unread count includes types the frontend skips, so badge and visible unread cards can disagree                     | Accepted and documented (spec edge case, A19). "Mark all as read" clears both.                                                                                                                                              |
| Several observers polling would multiply requests                                                                  | One driver; every other observer is passive; an e2e test counts `unread-count` requests across one minute with desktop, drawer and Home mounted.                                                                            |
| Existing tests enumerate the navigation and the "everything on" sections                                           | `tests/student-layout.test.mjs` and `student-mobile-shell.test.mjs` are updated in the same commit as the new item (`personal` becomes `notifications`, `profile`); the tab bar assertions stay as they are.                |
| Turning the flag on in e2e adds Home's "Unread notifications" card (4 cards)                                       | The fake serves the count; `home.spec.ts` assertions only read the three named stats; the grid already handles 4 cards (009 FR-013). One assertion is added for the fourth card.                                            |
| `page.clock` and the app's timers                                                                                  | The count e2e installs the clock after sign-in and fast-forwards in whole minutes; if it proves flaky the polling decision is also covered by the pure `polling.ts` tests.                                                  |
| Mobile has no design                                                                                               | Follows the shell's compact-bar patterns (44px buttons, `size-11 sm:size-8`) and the Saved/Tracking card patterns; assumptions A-list in the spec are repeated in the PR for review.                                        |
| `StudentTabBar`/`studentTabLabelKey` accept every nav id                                                           | The tab bar only reads ids in `studentTabBarOrder`; a unit test asserts the order is unchanged and has five entries.                                                                                                        |
| Time budget                                                                                                        | Implementation order in `tasks.md` is by user story, so P1 ships first if the work has to be split.                                                                                                                         |
