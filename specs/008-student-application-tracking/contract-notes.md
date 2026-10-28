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

| Item                                              | Owner / date                    | What the frontend does until then                                                                                                 |
| ------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `PUT/GET /api/scholarships/{id}/tracking` (start) | BE-02, merged, deploying to DEV | Not in the snapshot. The client is wired (phase 5) behind `TRACKING_ENABLED`. Not verified against a real server. Contract below. |
| UTC `Z` timestamps on `/tracked`                  | BE-08                           | Parse defensively, never assume a suffix.                                                                                         |
| `official_url` in the tracked summary             | BE-03                           | The link icon renders only if the field is present and a safe `https` URL.                                                        |

### Start tracking (from the task brief, not yet in OpenAPI)

- `PUT /api/scholarships/{id}/tracking` with `{ "status": enum }` creates the row. `GET` reads it.
- Responses are `{ status, updated_at }`. Note: no tracking id in this response, so after a start the list must be refetched to learn the id.
- Errors: `404 {"detail":"المنحة غير موجودة."}`, `403` non-student, `422` invalid.

What the client does (phase 5):

- Sends `{ "status": "preparing_documents" }` (`DEFAULT_START_STATUS`).
- `PUT` sets the status, so sending it for a scholarship that is already tracked would overwrite a later status such as `applied`. The client therefore reads a fresh `/tracked` list first and skips the `PUT` when the scholarship is already in it (a second tab or device may have tracked it after this page loaded).
- The control flips to "Tracking: Preparing documents" at once. On any error it flips back and shows a message by status (404 "no longer available", 403 "student accounts only", anything else "could not start").
- After success the list is refetched, so the control and the Tracking page agree on the real status and id.
- A `404` means "scholarship gone" here, but it is also what an environment without BE-02 would return for the missing route. The UI cannot tell them apart (errors are mapped by status, never by the Arabic `detail`), so Gate 2 checks that the endpoint answers before the flag is turned on for an environment.

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

## Decisions (answered 2026-10-26)

These were open questions in phase 1. The product owner answered them before the second pass; the code follows the answers.

| #   | Question                        | Decision                                                                                                                                                                                                                                                                |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Route                           | `/student/tracking`, the same pattern as Saved (`/student/saved`).                                                                                                                                                                                                      |
| 2   | Nav placement                   | The Figma wins. A new `manage` group sits between Discover and Personal and holds Saved and Application tracking (Saved moved out of Discover). A group label shows only above real items.                                                                              |
| 3   | Status cards as filters         | Yes. Each status card is a toggle button (`aria-pressed`, keyboard accessible); a second tap clears the filter. The `saved` card links to `/student/saved` when `SAVED_SCHOLARSHIPS_ENABLED` is on and its count loaded; otherwise it is a plain, non-interactive card. |
| 4   | "Important dates"               | The promise is removed from the subtitle. ar: `تابع حالة كل منحة وسجّل ملاحظاتك الخاصة`, en: "Track the status of each scholarship and keep your own notes."                                                                                                            |
| 5   | Orange scholarship pill         | Shown, and linking to the details page, only when `SCHOLARSHIP_DETAILS_ENABLED` is on. With that flag off it is not rendered at all (never a dead link).                                                                                                                |
| 6   | Note editing and delete confirm | Kept: the inline note editor and the native `<dialog>`. Keyboard, focus and RTL were checked in the browser ([browser-verification.md](./browser-verification.md)).                                                                                                     |
| 7   | Status for new tracking         | `preparing_documents`.                                                                                                                                                                                                                                                  |
| 8   | Saved card and tracked items    | The task brief says the two lists are independent, so the saved card counts the saved list and a scholarship that is both saved and tracked counts in both. Double counting follows from that; it was not separately confirmed as a product rule.                       |
