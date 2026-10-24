# Contract Notes: 009-student-home

Source of truth for existing endpoints: `docs/api/openapi.json` (Scholar AI API 1.0.0). Requested endpoints: [contracts/requested-backend.openapi.yaml](./contracts/requested-backend.openapi.yaml).

## 1. Endpoints consumed (exist today, real data, no mocks)

| UI element                                           | Endpoint                                                 | Field(s)                                                                               | Notes                                                                                                                                                                             |
| :--------------------------------------------------- | :------------------------------------------------------- | :------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header greeting, welcome first name, avatar initial  | `GET /auth/me` (existing `useAuth`)                      | `name` (fallback `email`)                                                              | No new request; reuses the current-user query.                                                                                                                                    |
| Welcome completion % + bar; recommendations lock     | `GET /profile`                                           | `profile_completion_percentage` (number, default 0)                                    | 0–100 scale (the Profile page shows it as %). 404 → 0. A non-number → error state.                                                                                                |
| Stat "Saved scholarships"; deadline candidates       | `GET /api/scholarships/saved`                            | array length; `id`, `title*`, `deadline`, `no_deadline`, `funding_type`, `study_level` | Feature 006 client and validator reused. Returns only still-visible listings.                                                                                                     |
| Stat "Applications in progress"; deadline candidates | `GET /api/scholarships/tracked`                          | `status`; `scholarship.{id,title*,deadline,no_deadline,funding_type,study_level}`      | In progress = status ∉ {`accepted`,`rejected`,`closed`}. Includes expired listings, which the client filters by deadline. Minimal local schema; Tracking types are not on `main`. |
| Recommendations unlocked (Q1-A provisional)          | `GET /api/scholarships/?sort=newest&page=1&page_size=20` | first 3 `items`                                                                        | Same query and cache as the Discovery default view. Not personalized; labeled "Latest scholarships".                                                                              |

**Not used**:

- `GET /api/scholarships/recommendations`: an unfiltered feed of all scholarships regardless of status, with description HTML. Not personalized and may expose unpublished/closed listings.
- `GET /api/scholarships/tracked/statistics`: its `saved_scholarships` counts expired saved records too, which would disagree with the Saved page. It remains a lighter alternative for the in-progress count only.
- `GET /admin/notifications/*`: admin role only (403 for students).

### Observations for the backend team (no action required for Home)

- `tracked/statistics.saved_scholarships` (all saved records) ≠ `len(GET /saved)` (visible only). Worth documenting in the OpenAPI description so other clients do not mix them.
- `ScholarshipDiscoveryCard` has no `match` field in OpenAPI, while the frontend type has an optional `match`. BL-04 would make it real.

## 2. Backend asks

### BE-09: Student notifications count and activity feed (ClickUp BE-09)

**Ask 1: unread count**

```
GET /api/notifications/unread-count        (authenticated; any role, scoped to current user)
200 { "unread_count": 2 }                  (integer ≥ 0)
401 / 403 as other student endpoints
```

The shape mirrors the existing admin endpoint. Home uses it for the stat card and the header bell dot. Both read the same number, which removes the Figma 10-vs-2 inconsistency.

**Ask 2: activity feed**

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
- Events: saving a scholarship, changing a tracked status, a recommendation created (when BL-04 exists), and a deadline reminder (e.g. at 7 days and 1 day; the backend decides).

**Frontend behavior until shipped**: the stat card, header bell and recent-activity section are **hidden** (`unavailable`). In local development only, `HOME_MOCK_SECTIONS=notifications,activity` shows schema-valid demo data with a "Demo data" badge.

### BL-04: Personalized recommendations (ClickUp BL-04)

```
GET /api/scholarships/recommended?limit=3  (limit 1–20, default 3)
200 {
  "locked": false,
  "items": [ ScholarshipDiscoveryCard + { "match": { "score": 87 } | null } ]
}
```

Requirements for the backend:

- Same visibility rules as `GET /api/scholarships/` (approved, deadline today or later, or no-deadline).
- Ranked by profile match; `score` is an integer 0–100.
- When the profile is below the backend threshold: `200 { "locked": true, "items": [] }` (not an error). The frontend also locks below 70% from `GET /profile`.
- Must not reuse the path `/api/scholarships/recommendations` (the existing unfiltered feed) unless that feed is retired.

**Frontend behavior until shipped** (depends on Q1):

- Q1-A (provisional): the unlocked state shows the 3 newest published scholarships (real data, labeled "Latest scholarships", no score). When BL-04 ships, switch to `recommendations` real and restore the "Latest recommendations" title.
- Q1-B: hidden in deployments; demo data in dev only.
- Q1-C: a neutral "coming soon" empty state.

## 3. Mock/hide matrix

| Section                                   | API today                       | Deployed (Preview/Production)    | Local dev, flag lists it | Local dev, flag unset            |
| ----------------------------------------- | ------------------------------- | -------------------------------- | ------------------------ | -------------------------------- |
| Unread notifications card + header bell   | ✗ (BE-09)                       | hidden                           | demo + badge             | hidden                           |
| Recent activity                           | ✗ (BE-09)                       | hidden                           | demo + badge             | hidden                           |
| Recommendations, locked panel             | n/a (driven by real completion) | real                             | real                     | real                             |
| Recommendations, unlocked                 | ✗ (BL-04)                       | Q1-A: latest scholarships (real) | Q1-B only: demo + badge  | Q1-A: latest scholarships (real) |
| Completion, saved, in-progress, deadlines | ✓                               | real                             | real (never mocked)      | real                             |
