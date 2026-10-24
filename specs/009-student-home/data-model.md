# Data Model: 009 Student Home

Frontend-only models. "Wire" types are validated payloads, "derived" types are computed on the client, and "view" types are what components receive. Source contracts are in [contract-notes.md](./contract-notes.md) and [contracts/](./contracts/).

## Constants (`home/constants.ts`)

| Name                             | Value                                              | Spec                  |
| -------------------------------- | -------------------------------------------------- | --------------------- |
| `UPCOMING_WINDOW_DAYS`           | 30                                                 | FR-022                |
| `URGENCY_URGENT_MAX`             | 7                                                  | FR-024                |
| `URGENCY_SOON_MAX`               | 14                                                 | FR-024                |
| `DEADLINE_LIST_LIMIT`            | 3                                                  | FR-025                |
| `ACTIVITY_LIST_LIMIT`            | 4                                                  | FR-028                |
| `RECOMMENDATIONS_UNLOCK_PERCENT` | 70                                                 | FR-031                |
| `RECOMMENDATIONS_LIST_LIMIT`     | 3                                                  | FR-034                |
| `IN_PROGRESS_STATUSES`           | `preparing_documents`, `ready_to_apply`, `applied` | FR-015                |
| `TERMINAL_TRACKING_STATUSES`     | `accepted`, `rejected`, `closed`                   | FR-015, FR-020 (Q5-A) |

## Wire types (validated)

### ProfileCompletionWire — `GET /profile` (subset)

| Field                           | Type           | Rule                                                                                            |
| ------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `profile_completion_percentage` | number, finite | Missing → 0 (OpenAPI default). Non-number → `HomeContractError`. HTTP 404 → 0 (no profile yet). |

The UI value is `clamp(round(value), 0, 100)`. The unlock test uses the **unrounded** value: `value >= 70`, so 69.6 stays locked (spec US3-3).

### SavedCard — `GET /api/scholarships/saved`

This is the existing `ScholarshipDiscoveryCard[]`, validated by `validateSavedResponse` (Feature 006). Fields Home reads: `id`, `title`, `title_ar`, `title_en`, `deadline`, `no_deadline`, `funding_type`, `study_level`.

### TrackedApplicationWire — `GET /api/scholarships/tracked` (minimal local schema)

| Field                                     | Type                                                                                             | Rule                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `id`                                      | int                                                                                              | required                                                            |
| `status`                                  | `'preparing_documents' \| 'ready_to_apply' \| 'applied' \| 'accepted' \| 'rejected' \| 'closed'` | required; an unknown value → contract error                         |
| `scholarship.id`                          | int                                                                                              | required                                                            |
| `scholarship.title`                       | string                                                                                           | required                                                            |
| `scholarship.title_ar`, `title_en`        | string \| null                                                                                   | optional                                                            |
| `scholarship.deadline`                    | string \| null                                                                                   | optional; `YYYY-MM-DD` (or a date-time, normalized per research R3) |
| `scholarship.no_deadline`                 | boolean \| null                                                                                  | optional                                                            |
| `scholarship.funding_type`, `study_level` | string \| null                                                                                   | optional                                                            |
| other fields                              | any                                                                                              | passed through, ignored                                             |

Superseded by the Tracking feature's types when it merges (research R15).

### Requested contracts (backend asks): validated identically for real and mock

See [contracts/requested-backend.openapi.yaml](./contracts/requested-backend.openapi.yaml).

- **UnreadNotificationsWire**: `{ unread_count: int ≥ 0 }`
- **ActivityFeedWire**: `{ items: ActivityItemWire[] }`, newest first, `limit` 1–20
  - `ActivityItemWire`: `id: int`, `type: 'new_recommendation' | 'deadline_reminder' | 'scholarship_saved' | 'application_status_changed'`, `occurred_at: date-time (UTC, with offset)`, `scholarship: { id: int, title: string, title_ar?: string|null, title_en?: string|null } | null`, `data: { days_left?: int ≥ 0, new_status?: ApplicationTrackingStatus }`
  - Per-type requirements: `deadline_reminder` needs `data.days_left`; `application_status_changed` needs `data.new_status`; all four types need `scholarship`. A violation → contract error. An **unknown `type`** → the item is skipped (forward-compatible), not an error.
- **RecommendationsWire**: `{ locked: boolean, items: (ScholarshipDiscoveryCard & { match?: { score: int 0–100 } | null })[] }`. `locked: true` shows the locked panel even at ≥70% (the backend may use a stricter rule).

## Derived types (`home/lib/*`, pure)

### DeadlineCandidate

| Field    | Type                             | Notes                       |
| -------- | -------------------------------- | --------------------------- |
| `id`     | number                           | scholarship id (de-dup key) |
| `card`   | SavedCard-like                   | for title and labels        |
| `origin` | `'saved' \| 'tracked' \| 'both'` |                             |

`collectDeadlineCandidates(saved, tracked)`: drops tracked items in `TERMINAL_TRACKING_STATUSES` (Q5-A), merges by `id`, and on a merge prefers the saved card's fields (they are fresher, being from the visible listing).

### UpcomingDeadline

| Field                       | Type                                  | Notes                                     |
| --------------------------- | ------------------------------------- | ----------------------------------------- |
| `id`                        | number                                |                                           |
| `title`                     | `{ default, ar, en }`                 | locale choice happens in the view         |
| `deadline`                  | `CalendarDate`                        | from `parseCalendarDate`                  |
| `daysLeft`                  | int 0–30                              |                                           |
| `urgency`                   | `'urgent' \| 'soon' \| 'comfortable'` | `urgencyFor(daysLeft)`                    |
| `fundingType`, `studyLevel` | string \| null                        | raw; labels resolved via `card-labels.ts` |
| `origin`                    | as above                              |                                           |

`deriveUpcomingDeadlines({ saved, tracked, now })` → `{ items: UpcomingDeadline[] (≤3), count: number }`.

Rules: eligible only if `getDeadlineStatus` gives `today` or `upcoming` and `daysLeft ≤ 30`. Sort by (`daysLeft`, `id`) ascending.

### HomeCounts

| Field                 | Derived from                           | Notes                              |
| --------------------- | -------------------------------------- | ---------------------------------- |
| `saved`               | `saved.length`                         | real                               |
| `inProgress`          | `countInProgress(tracked)`             | real                               |
| `upcoming`            | `deriveUpcomingDeadlines(...).count`   | real; needs both saved and tracked |
| `unreadNotifications` | `UnreadNotificationsWire.unread_count` | only if the source ≠ `unavailable` |

### ActivityView

`{ id, type, scholarshipTitle, messageKey, messageValues, relativeTime, icon }`. `messageKey` is `StudentHome.activity.types.{type}`, and `messageValues` carries `title`, `days` and `status` (`status` is translated through `StudentHome.activity.status.{value}`). The UI never shows server text other than the scholarship title.

### SectionState

`'hidden' | 'loading' | 'error' | 'empty' | 'ready'`. Mapping rules are in research R7.

| Section                 | Required sources                         | `empty` when                                                               |
| ----------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| Welcome completion      | profile                                  | never (a number always renders)                                            |
| Stat: saved             | saved                                    | never (shows 0)                                                            |
| Stat: in progress       | tracked                                  | never (shows 0)                                                            |
| Stat: upcoming          | saved + tracked                          | never (shows 0)                                                            |
| Stat: notifications     | notifications source                     | never; `hidden` if unavailable                                             |
| Upcoming deadlines list | saved + tracked                          | `items.length === 0`                                                       |
| Recent activity         | activity source                          | `items.length === 0`; `hidden` if unavailable                              |
| Recommendations         | profile (lock) + discovery list (newest) | locked → shows the lock panel (not `empty`); unlocked with 0 items → empty |

## Source adapter (`home/sources/types.ts`)

```ts
type HomeSectionId = 'notifications' | 'activity' | 'recommendations';
type HomeSource<T> =
  | { kind: 'real'; load: (signal?: AbortSignal) => Promise<T> }
  | { kind: 'mock'; load: (signal?: AbortSignal) => Promise<T> }
  | { kind: 'unavailable' };
```

`load` returns **validated** `T` in both cases (raw → `schema.parse` inside the adapter). The full interface contract is in [contracts/home-section-sources.md](./contracts/home-section-sources.md).

## Query keys (`home/query-keys.ts`)

| Key                                                                             | Owner       | Shared with                              |
| ------------------------------------------------------------------------------- | ----------- | ---------------------------------------- |
| `studentScholarshipKeys.saved()`                                                | Feature 006 | Saved page, bookmark mutations           |
| `studentScholarshipKeys.discovery(defaultDiscoveryQuery)`                       | Feature 005 | Discovery default view                   |
| `studentHomeKeys.profileCompletion()` = `['student-home','profile-completion']` | Home        | none (see research R6)                   |
| `studentHomeKeys.tracked()` = `['student-home','tracked']`                      | Home        | replaced by the Tracking key later (R15) |
| `studentHomeKeys.notifications()` / `.activity()` / `.recommendations()`        | Home        | header bell shares `notifications()`     |

The `kind` (real vs mock) is part of the source-query keys (`[..., kind]`), so a cached mock result can never be served after switching to real.

## State transitions

The only stateful UI is the recommendations lock: `locked` ⇄ `unlocked`, driven by the profile completion query. It re-evaluates on every refetch. There is no client-side persistence.
