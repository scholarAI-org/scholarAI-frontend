# Contract notes: 011 Student Notifications

Source: the brief (ticket **BE-13**, 2026-11-19). The endpoints **do not exist yet**. The frontend is built and tested against `tests/e2e/fake-backend/server.mjs`, and `docs/api/openapi.json` has no student notification path (only `/admin/notifications...`, admin-only, never to be used). The machine-readable form of what the fake implements is [contracts/notifications.openapi.yaml](./contracts/notifications.openapi.yaml).

All four calls are authenticated by the session cookie that the `/backend` proxy forwards, through `apiClient`, like `/auth/logout` and the Home calls.

## `GET /api/notifications?page&page_size&is_read`

Sent: `page` (1-based) and `page_size` (20). `is_read` is part of the contract but **not sent** (filters are out of scope).

```json
{
  "items": [
    {
      "id": 42,
      "type": "deadline_reminder",
      "params": {
        "scholarship_id": 7,
        "scholarship_title": "DAAD",
        "days_left": 17,
        "deadline": "2026-09-15",
        "reminder_index": 1,
        "reminder_total": 2,
        "missing_documents": ["recommendation_letters"]
      },
      "created_at": "2026-11-19T07:15:00Z",
      "is_read": false,
      "action": { "type": "open_scholarship", "target_id": 7 }
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

Expected order: `created_at` descending, `id` descending as the tie-break, stable across pages. The frontend does not re-sort.

### Params per type

| `type`                      | `params`                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deadline_reminder`         | `scholarship_id`, `scholarship_title`, `days_left`, `deadline` (YYYY-MM-DD), `reminder_index`, `reminder_total`, `missing_documents` (optional string codes) |
| `scholarship_match`         | `scholarship_id`, `scholarship_title`, `matched_count`, `total_count`                                                                                        |
| `saved_scholarship_updated` | `scholarship_id`, `scholarship_title`, `change` (stable code, for example `language_requirement_added`)                                                      |
| `scholarship_archived`      | `scholarship_id`, `scholarship_title`                                                                                                                        |
| `profile_incomplete`        | `remaining_percent`, `threshold_percent`                                                                                                                     |
| `document_analysis_ready`   | `suggestions_count`, `target_scholarship_title` (nullable)                                                                                                   |

The backend sends `type` and `params`, never sentences. Unknown `type`: skipped. Known `type` with malformed `params`: skipped and counted. Extra fields anywhere: ignored.

## `GET /api/notifications/unread-count`

```json
{ "unread_count": 3 }
```

Same path as the Home source's requested contract (`specs/009-student-home/contracts/requested-backend.openapi.yaml`), so Home's `parseUnreadNotifications` validates it. Polled about every 60 seconds; stops on 401, 403 and 404.

## `PATCH /api/notifications/{id}/read`

No request body. Answer: `{ "id": 42, "is_read": true, "read_at": "2026-11-19T09:00:00Z" }`. The frontend sends one request per notification at a time, and none for an already-read item.

## `PATCH /api/notifications/read-all`

No request body. Answer: `{ "updated": 5 }`. Sent once per press.

## How the frontend reads status codes

| Status       | List                                    | Count                                      | PATCH calls                       |
| ------------ | --------------------------------------- | ------------------------------------------ | --------------------------------- |
| 401          | re-check the session; "session expired" | stop polling, hide badge, re-check session | roll back, show the error message |
| 403          | "access unavailable", no Retry          | stop polling, hide badge                   | roll back, show the error message |
| 404          | generic error with Retry                | stop polling, hide badge                   | roll back, show the error message |
| network, 5xx | generic error with Retry                | keep the last value, keep polling          | roll back, show the error message |

`apiClient` turns a non-2xx answer into `ApiError(message, details, status)`; the UI never shows `message`, only translated text.

## Adapter swap procedure (when a field is renamed)

1. Change the wire schema in `adapter/wire.ts` or `adapter/params.ts` and the mapper beside it.
2. Update `tests/e2e/fake-backend/server.mjs` and the sample payloads in `tests/student-notifications.test.mjs` in the same commit.
3. Run `pnpm test:student-notifications`. The guard test fails if a backend name appears outside `adapter/`.
4. No component, hook or message changes unless a new type or code appears (then add one registry entry and its messages).

## Open questions for BE-13

See **Open Questions** in [spec.md](./spec.md): order, `action.type` values, `change` and `missing_documents` codes, page size limits, what `unread_count` includes, status codes for unknown or already-read ids, `read-all` scope. Until they are answered the flag stays off in Production and Preview.
