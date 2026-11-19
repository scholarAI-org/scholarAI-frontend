# Data model: Student Notifications

Internal model (camelCase). Backend names exist only in `src/features/student/notifications/adapter/` (FR-090). Wire shapes are in [contract-notes.md](./contract-notes.md).

## StudentNotification

| Field       | Type                                 | Rule                                                                      |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------- |
| `id`        | `number \| string`                   | Positive integer or non-empty string; opaque; unique inside a loaded list |
| `type`      | one of the six `NotificationType`s   | Unknown types never reach the model                                       |
| `params`    | per-type object (below)              | Validated by the type's wire schema, mapped to camelCase                  |
| `createdAt` | ISO 8601 UTC string                  | Unreadable or missing means the item is malformed and skipped             |
| `isRead`    | boolean                              | Anything else means malformed                                             |
| `action`    | `null \| { type: string, targetId }` | `undefined` is read as `null`; `type` is not interpreted (assumption A4)  |

`StudentNotification` is a discriminated union on `type`, so `params` is precise inside each branch.

### Params by type

| `type`                      | Params (internal)                                                                                                                  | Validation                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deadline_reminder`         | `scholarshipId`, `scholarshipTitle`, `daysLeft`, `deadline` (CalendarDate), `reminderIndex`, `reminderTotal`, `missingDocuments[]` | ids positive; title non-empty; `daysLeft` int at least 0; `deadline` must pass `parseCalendarDate`; `1 <= index <= total`; documents are strings, default `[]` |
| `scholarship_match`         | `scholarshipId`, `scholarshipTitle`, `matchedCount`, `totalCount`                                                                  | counts are integers, `0 <= matched <= total`, `total >= 1`                                                                                                     |
| `saved_scholarship_updated` | `scholarshipId`, `scholarshipTitle`, `change`                                                                                      | `change` non-empty string; unknown codes are valid                                                                                                             |
| `scholarship_archived`      | `scholarshipId`, `scholarshipTitle`                                                                                                | as above                                                                                                                                                       |
| `profile_incomplete`        | `remainingPercent`, `thresholdPercent`                                                                                             | finite numbers from 0 to 100                                                                                                                                   |
| `document_analysis_ready`   | `suggestionsCount`, `targetScholarshipTitle \| null`                                                                               | integer at least 0; title nullable                                                                                                                             |

## NotificationPage (parser output)

| Field                 | Type                                         | Note                                         |
| --------------------- | -------------------------------------------- | -------------------------------------------- |
| `items`               | `StudentNotification[]`                      | Only renderable items, in the server's order |
| `page`, `pageSize`    | integers, `page >= 1`, `pageSize >= 1`       | Envelope; a violation is a contract error    |
| `total`, `totalPages` | integers at least 0                          | `getNextPageParam` uses `page < totalPages`  |
| `skipped`             | `{ unknownType: number, malformed: number }` | Counts only, never values (FR-028)           |

## NotificationAction (derived, never stored)

`{ href: string, labelKey: 'actions.viewScholarship' | 'actions.completeProfile' } | null`, from `resolveAction(notification, { detailsEnabled })`.

## UnreadCount (Home's type, reused)

`{ unreadCount: number }` from `parseUnreadNotifications`. `null` in the UI means "not loaded or stopped": no badge, no dot.

## Cache shapes

| Key                                                    | Value                            | Lifetime                                 |
| ------------------------------------------------------ | -------------------------------- | ---------------------------------------- |
| `['student-home','notifications','real']` (Home's key) | `UnreadCount`                    | Session; cleared by logout               |
| `['student-notifications','list']`                     | `InfiniteData<NotificationPage>` | `gcTime: 0`: gone when the page unmounts |
| mutation `['student-notifications','mark', id]`        | pending single mark              | In flight only                           |
| mutation `['student-notifications','mark','all']`      | pending mark-all                 | In flight only                           |

## State transitions

**A card**: `unread --click or Enter/Space--> read (optimistic) --PATCH ok--> read` · `--PATCH fails--> unread (+ alert)`. A read card has no transitions.

**Unread count**: `unloaded --first answer--> n` · `n --mark--> max(0, n-1)` (only if loaded and the card was unread) · `n --mark all--> 0` · any failure restores only its own delta · every settled mark ends with one reconcile request.

**Count polling**: `idle --mount--> fetching` · `fetching --ok--> waiting 60 s` · `waiting --tick while visible--> fetching` · `waiting --hidden--> paused` · `paused --visible or focus--> fetching` · `any --401/403/404--> stopped` · `stopped --manual refetch ok--> waiting 60 s` · `any --other error--> waiting 60 s (last value kept)` · marks pending suspend ticks and focus refetches.

**List page**: `loading --ok, items--> ready` · `loading --ok, none renderable, last page--> empty` · `loading --error--> error` · `ready --Load more--> loading-more --ok--> ready` · `loading-more --error--> ready + inline error`.
