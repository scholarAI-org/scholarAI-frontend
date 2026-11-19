# Research: Student Notifications

Phase 0 of `/speckit.plan`. Nothing in the Technical Context was left as "NEEDS CLARIFICATION"; this file records the decisions that needed a look at the code or the library, with the alternatives that were rejected.

## R1. How to reuse the Home notifications source without a second abstraction

- **Finding**: `HomeSources.notifications` already exists (`real`, `mock`, `unavailable`). Its `real` loader `getUnreadNotifications` calls `GET /api/notifications/unread-count`, the same path BE-13 names, and `parseUnreadNotifications` validates `{ unread_count }`. `HOME_API_AVAILABILITY.notifications` is a build-time `false`. `createHomeSources` already accepts an `availability` argument (a test seam).
- **Decision**: pass `availability: { ...HOME_API_AVAILABILITY, notifications: notificationsEnabled }` from a new optional argument of `useHomeSources`. The flag stays server-only and per-request; the static table and its tests are untouched.
- **Alternatives**: edit the static table to `true` (a build-time constant, cannot follow a per-request flag, would turn the feature on everywhere); read `process.env` in the client (the flag would have to be `NEXT_PUBLIC_`, forbidden); create `notifications/api/unread-count.ts` (a second count client and schema, forbidden by the brief).

## R2. One poller for many readers

- **Finding**: in TanStack Query, `refetchInterval` and `refetchOnWindowFocus` are observer options. Five mounted observers (desktop bell, compact bell, sidebar badge, drawer badge, Home stat) with an interval each would schedule five timers at different phases; a fetch in flight is not duplicated, but a tick after it finishes is a new request.
- **Decision**: one headless driver component mounted once under `RoleGuard` owns the interval, the focus handling and the stop rules. Everything else is `useQuery({ ..., enabled: false })` on the same key: it renders from the cache and re-renders when the driver updates it.
- **Alternatives**: a global `QueryClient` default (affects every query); a `setInterval` in a context provider that calls `refetchQueries` (works, but loses the library's hidden-tab pause and function-valued stop rules); one observer per consumer and accept N requests (violates "about every 60 seconds").

## R3. Pause while hidden, refetch on focus

- **Finding**: `refetchIntervalInBackground` is `false` by default, and the library's focus manager treats `document.visibilityState === 'hidden'` as "not focused". In v5 the default focus listener listens to `visibilitychange` only, not to the window's `focus` event.
- **Decision**: rely on the library for the interval pause and the visibility refetch; add a `window` `focus` listener in the driver that calls `refetchQueries(..., { cancelRefetch: false })`, so a visibility change and a focus event in the same moment make one request. Both are skipped while a mark is pending or the query is terminal.
- **Alternatives**: override `focusManager.setEventListener` globally (changes every query in the app).

## R4. Stop on 401, 403 and 404

- **Finding**: v5 accepts a function for `enabled` and for `refetchInterval`, both receiving the query. `shouldRetryScholarshipQuery` already refuses to retry 401, 403, 404 and 422.
- **Decision**: `enabled(query)` is false for a terminal `ApiError` status; `refetch()` still works on a disabled query, so the list's Retry can resume polling by succeeding once. A 401 also invalidates the current-user query (the Home pattern), so a lost session ends in the existing login redirect.
- **Alternatives**: component state that remembers "stopped" (a second source of truth that can disagree with the cache).

## R5. Optimistic update and rollback

- **Finding**: the usual snapshot-and-restore of the whole cache would undo other optimistic changes when two marks overlap or when a poll lands in between.
- **Decision**: record only what this mutation changed (`flippedIds`, `countDelta`) and invert exactly that on error; cancel the count query on start so a response requested before the PATCH cannot overwrite the optimistic number; refetch the count once after the last pending mark settles; skip interval and focus refetches while any mark is pending (`useIsMutating` makes the option re-evaluate).
- **Alternatives**: `onSettled` invalidation of the whole list (a refetch of every loaded page would reshuffle cards under the student); trusting the PATCH response alone (a visible delay, which the brief rules out).

## R6. Leaving the page

- **Decision**: the list query has `gcTime: 0` and refetches on mount, so each visit starts at page 1 with a skeleton (clarification Q4). Updaters tolerate a missing cache entry, because an action can navigate away while its PATCH is pending.
- **Alternatives**: keep pages cached (stale cards, and a refetch of every loaded page on return).

## R7. Registry and copy

- **Decision**: one registry entry per type; copy is built from ICU messages by key convention `types.<type>.title|body`; document codes map to the seven document keys the profile feature already defines; unknown `change` or document codes fall back to a generic sentence instead of skipping the item.
- **Alternatives**: a `switch` per component (every new type edits several files); sentences from the server (rejected by the brief).

## R8. Relative time

- **Finding**: Home's `formatRelativeTime` is numeric-always and runs up to months; the design wants "Yesterday" and an absolute date for old items.
- **Decision**: a feature-local function that delegates to `formatRelativeTime` for under a day and for 2 to 29 days, returns `Intl.RelativeTimeFormat(..., { numeric: 'auto' })` for exactly one day, and formats the date from 30 days. It is one of the three allow-listed Home imports.
- **Alternatives**: change Home's function (shared by Home's tests); a second full formatter.

## R9. Where the bell, badge and compact bell come from

- **Decision**: the shell gets slots; `NotificationsBell` wraps Home's presentational `NotificationBell`, which gains optional `href`, `size` and `current` props with unchanged defaults, so there is one bell design. `NotificationsNavBadge` is new (the sidebar pill has no Home counterpart).
- **Alternatives**: a second bell component (duplicates the circle and the dot); making the shell import the feature (breaks the guard that keeps the shell generic).

## R10. Fake-backend ordering, ids and faults

- **Decision**: the fake sorts by `created_at` descending then `id` descending, serves ids as integers, and exposes a control API for seeding, adding items mid-test, delaying and failing the next N answers of one endpoint. The real id type is unknown, so the adapter accepts a positive integer or a non-empty string and encodes it in the path.
- **Alternatives**: static JSON fixtures (cannot express delays or failures).

## R11. Time labels that do not go stale

- **Decision**: a 60-second "now" in state, paused while hidden, feeds the relative labels; no extra network use.
- **Alternatives**: recompute only on render (labels freeze at "Just now" for an open page).
