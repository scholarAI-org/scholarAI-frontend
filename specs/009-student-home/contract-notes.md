# Contract Notes: 009-student-home

Source of truth for existing endpoints: `docs/api/openapi.json` (Scholar AI API 1.0.0). Requested endpoints: [contracts/requested-backend.openapi.yaml](./contracts/requested-backend.openapi.yaml).

## 1. Endpoints consumed (exist today, real data, no mocks)

| UI element                                           | Endpoint                                                 | Field(s)                                                                               | Notes                                                                                                                                                                                  |
| :--------------------------------------------------- | :------------------------------------------------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header greeting, welcome first name, avatar initial  | `GET /auth/me` (existing `useAuth`)                      | `name` (fallback `email`)                                                              | No new request; reuses the current-user query.                                                                                                                                         |
| Welcome completion % + bar; recommendations lock     | `GET /profile`                                           | `profile_completion_percentage` (number, default 0)                                    | 0–100 scale (the Profile page shows it as %). 404 → 0. A non-number → error state.                                                                                                     |
| Stat "Saved scholarships"; deadline candidates       | `GET /api/scholarships/saved`                            | array length; `id`, `title*`, `deadline`, `no_deadline`, `funding_type`, `study_level` | Feature 006 client and validator reused. Returns only still-visible listings.                                                                                                          |
| Stat "Applications in progress"; deadline candidates | `GET /api/scholarships/tracked`                          | `status`; `scholarship.{id,title*,deadline,no_deadline,funding_type,study_level}`      | In progress = status ∉ {`accepted`,`rejected`,`closed`}. Includes expired listings, which the client filters by deadline. Minimal local schema; Tracking types are not on `main`.      |
| "Latest scholarships" (unlocked, ≥70%)               | `GET /api/scholarships/?sort=newest&page=1&page_size=20` | first 3 `items`                                                                        | Published listings only (approved, deadline today or later, or no-deadline). Same query and cache entry as the Discovery default view. Not personalized, so it carries no match score. |

**Not used**:

- `GET /api/scholarships/recommendations`: see the security ask in §2. Home must not call it.
- `GET /api/scholarships/tracked/statistics`: its `saved_scholarships` counts expired saved records too, which would disagree with the Saved page. It remains a lighter alternative for the in-progress count only.
- `GET /admin/notifications/*`: admin role only (403 for students).

### Observations for the backend team (no action required for Home)

- `tracked/statistics.saved_scholarships` (all saved records) ≠ `len(GET /saved)` (visible only). Worth documenting in the OpenAPI description so other clients do not mix them.
- `ScholarshipDiscoveryCard` has no `match` field in OpenAPI, while the frontend type has an optional `match`. The personalized recommendations ask below would make it real.

## 2. Backend asks

Named by title; map them to your tracker as needed.

### Ask: Fix the public recommendations feed (security)

**Endpoint**: `GET /api/scholarships/recommendations`

**What is wrong** (from `docs/api/openapi.json`):

1. **No authentication.** The operation declares no `security` requirement, while every student endpoint (`/api/scholarships/`, `/saved`, `/tracked`) requires the bearer token. Anyone can call it.
2. **No status filtering.** Its description says it returns "all scholarships, ordered by ID, regardless of status" and "each listing retains its stored status". That includes **unpublished, pending-review, rejected and closed** records, which the admin review flow keeps private.
3. **Full description HTML and `apply_link`** for every listing are returned in one response.
4. **No pagination or limit**: the whole table in one response.

**Expected**: either retire the endpoint, or require authentication and apply the same visibility rules as `GET /api/scholarships/` (approved, deadline today or later or no-deadline), add `limit`, and drop `status` and the HTML description from the card shape.

**Frontend behavior**: Home never calls this endpoint. A test asserts that no file under `src/features/student/home` references the path.

### Ask: Student notifications unread count

```
GET /api/notifications/unread-count        (authenticated; any role, scoped to current user)
200 { "unread_count": 2 }                  (integer ≥ 0)
401 / 403 as other student endpoints
```

The shape mirrors the existing admin endpoint. Home uses it for the stat card and the header bell dot. Both read the same number, which removes the Figma 10-vs-2 inconsistency.

### Ask: Student activity feed

```
GET /api/activity?limit=4                  (limit 1–20, default 4)
200 {
  "items": [
    {
      "id": 981,
      "type": "new_recommendation" | "deadline_reminder" | "scholarship_saved" | "application_status_changed",
      "occurred_at": "2026-10-24T09:12:00Z",          // UTC, with offset
      "scholarship": { "id": 42, "title": "...", "title_ar": "...", "title_en": "..." } | null,
      "data": { "days_left": 7 }                        // deadline_reminder
           | { "new_status": "applied" }                // application_status_changed
           | {}                                          // other types
    }
  ]
}
```

Requirements for the backend:

- Newest first. Structured events only: **no pre-rendered sentences**, because the frontend renders Arabic and English.
- `new_status` uses the existing `ApplicationTrackingStatus` enum.
- Events: saving a scholarship, changing a tracked status, a recommendation created (once personalized recommendations exist), and a deadline reminder (e.g. at 7 days and 1 day; the backend decides).

### Ask: Personalized scholarship recommendations

```
GET /api/scholarships/recommended?limit=3  (limit 1–20, default 3; authenticated)
200 {
  "locked": false,
  "items": [ ScholarshipDiscoveryCard + { "match": { "score": 87 } | null } ]
}
```

Requirements for the backend:

- Same visibility rules as `GET /api/scholarships/` (approved, deadline today or later, or no-deadline).
- Ranked by profile match; `score` is an integer 0–100.
- When the profile is below the backend threshold: `200 { "locked": true, "items": [] }` (not an error). The frontend also locks below 70% from `GET /profile`.
- Must not reuse the path `/api/scholarships/recommendations` unless that endpoint has been fixed per the security ask above.

When this ships, Home switches the unlocked panel from "Latest scholarships" to "Latest recommendations" with match scores (a small follow-up, listed in verification.md).

## 3. Mock/hide matrix

| Section                                   | API today                       | Deployed (Preview/Production) | Local dev, flag lists it | Local dev, flag unset |
| ----------------------------------------- | ------------------------------- | ----------------------------- | ------------------------ | --------------------- |
| Unread notifications card + header bell   | ✗ (ask: unread count)           | hidden                        | demo + badge             | hidden                |
| Recent activity                           | ✗ (ask: activity feed)          | hidden                        | demo + badge             | hidden                |
| Recommendations, locked panel             | n/a (driven by real completion) | real                          | real                     | real                  |
| "Latest scholarships" (unlocked)          | ✓ discovery list                | real                          | real (never mocked)      | real                  |
| Completion, saved, in-progress, deadlines | ✓                               | real                          | real (never mocked)      | real                  |
