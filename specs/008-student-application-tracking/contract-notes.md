# Contract Notes: 008-student-application-tracking

Checked against `docs/api/openapi.json` (the committed snapshot) on 2026-10-26. The snapshot is not a live backend, so everything below is **not verified against a running server**.

## Real today (in the snapshot)

| Use                | Endpoint                                               | Request                                                | Response                                                                                     |
| ------------------ | ------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| List (main source) | `GET /api/scholarships/tracked`                        | optional `?status=<enum>` (unused)                     | `StudentScholarshipTrackingResponse[]`, newest first, includes closed and expired items      |
| Change status      | `PATCH /api/scholarships/tracked/{tracking_id}/status` | `{ "status": enum }`, no extra keys                    | `ApplicationStatusResponse` (adds `status`, `status_changed_at`)                             |
| Save note          | `PUT /api/scholarships/tracked/{tracking_id}/note`     | `{ "notes": string \| null }`, max 2000, no extra keys | `ApplicationNoteResponse`                                                                    |
| Remove             | `DELETE /api/scholarships/tracked/{tracking_id}`       | none                                                   | `{ scholarship_id, is_tracked, is_saved }`. Removes the note too. The bookmark is preserved. |
| Saved count        | `GET /api/scholarships/saved`                          | none                                                   | existing 006 contract                                                                        |

`tracking_id` is the **outer** tracking id (`id` on each list item), not the bookmark id and not `scholarship.id`.

Status enum: `preparing_documents`, `ready_to_apply`, `applied`, `accepted`, `rejected`, `closed`.

### List item shape

```
{
  id: int, status: enum, notes: string | null,
  status_changed_at, created_at, updated_at: date-time (see Timestamps),
  scholarship: ScholarshipDiscoveryCard   // id, title, title_ar/en, organization_name,
                                          // university_name, country, deadline (date),
                                          // no_deadline, is_saved, ... (reused 005 shape)
}
```

The card shape is reused from discovery, so the existing `toScholarshipCard` adapter handles the localized title.

### Not used

- `GET /api/scholarships/tracked/statistics`. It counts saved items including expired ones, so the counts would disagree with the list.
- `/api/scholarships/{id}/note` and `/{id}/track` (by scholarship id). The tracked-id endpoints above are the ones this page uses.

## Pending, do not rely on

| Item                                              | Owner / date      | What the frontend does until then                                                                 |
| ------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `PUT/GET /api/scholarships/{id}/tracking` (start) | BE-02, DEV 28 Oct | Not in the snapshot. Client code is written (phase 5) but hidden behind the flag. Contract below. |
| UTC `Z` timestamps on `/tracked`                  | BE-08             | Parse defensively, never assume a suffix.                                                         |
| `official_url` in the tracked summary             | BE-03             | The link icon renders only if the field is present and a safe `https` URL.                        |

### Start tracking (from the task brief, not yet in OpenAPI)

- `PUT /api/scholarships/{id}/tracking` with `{ "status": enum }` creates the row. `GET` reads it.
- Responses are `{ status, updated_at }`. Note: no tracking id in this response, so after a start the list must be refetched to learn the id.
- Errors: `404 {"detail":"المنحة غير موجودة."}`, `403` non-student, `422` invalid.

## Timestamps

`status_changed_at`, `created_at`, `updated_at` may arrive as `2025-10-02T09:15:00` (no suffix), `...Z`, or `...+03:00`.

- The schema accepts any non-empty string. It does not require ISO with a suffix.
- Display is date-only (`YYYY-MM-DD` in the Figma). For a value **with** a zone, convert to a `Date` and format in the viewer's locale. For a value **without** a zone, show the calendar date as written and never guess a zone.
- An unparseable value hides the "last update" part. It does not fail the list.
- No ordering or "time ago" logic depends on these, so a missing suffix cannot reorder anything.

## Errors

Mapped by status code. The Arabic `detail` text is never used as a key.

| Status        | Meaning here                             | UI                                     |
| ------------- | ---------------------------------------- | -------------------------------------- |
| 401           | session ended                            | existing auth handling                 |
| 403           | non-student / disabled / not your record | generic "no access" message            |
| 404           | tracking row is gone                     | drop the row locally, refetch the list |
| 422           | invalid status or note (e.g. over 2000)  | field-level message, rollback          |
| 5xx / network | server or connection                     | retryable message, rollback            |
| contract      | response failed zod validation           | error state, never an empty success    |

## Open questions

1. **Route.** The Figma does not name one. Assumed `/student/tracking`. Confirm.
2. **Nav placement.** The Figma sidebar puts "Application tracking" in the middle group, between Saved and "Improve documents". The current nav has only `discover` and `personal` groups. Assumed: add the item to `discover` after Saved, no new group. Confirm.
3. **Status cards as filters.** Not in the Figma. Built as counters only. Should a tap filter the list?
4. **"Important dates".** The subtitle promises dates, but no backend field exists besides the scholarship `deadline`. Subtitle kept as designed. Confirm or reword.
5. **Orange `المنحة` pill.** Assumed to link to the scholarship details page (feature 007), shown only when `SCHOLARSHIP_DETAILS_ENABLED` is on, like the saved page does. Confirm.
6. **Note editing and delete confirm.** Not designed in the Figma. Planned: inline edit with a counter and save/cancel, and a small confirm dialog. Confirm or send a design.
7. **Status for new tracking.** Which status does "start tracking" send by default? Assumed `preparing_documents`. Needs a product answer before phase 5.
8. **Saved card and tracked items.** A scholarship can be both saved and tracked. Both counts include it. Confirm that double counting is intended (the lists are independent).
