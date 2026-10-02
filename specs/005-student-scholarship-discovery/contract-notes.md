# Contract Notes — 005 Student Scholarship Discovery

Reviewed against `docs/api/openapi.json` on 2026-10-02 (T001).

## Routes used by this feature

| Operation      | Route                                  | Success schema                              | Error statuses     |
| -------------- | -------------------------------------- | ------------------------------------------- | ------------------ |
| Discovery      | `GET /api/scholarships/`               | `ScholarshipDiscoveryResponse`              | 401, 403, 422      |
| Filter options | `GET /api/scholarships/filter-options` | `ScholarshipDiscoveryFilterOptionsResponse` | 401, 403           |
| Details        | `GET /api/scholarships/{id}`           | `ScholarshipDetailsResponse`                | 401, 403, 404, 422 |
| Save           | `POST /api/scholarships/{id}/save`     | `SavedScholarshipResponse`                  | 401, 404, 422      |
| Unsave         | `DELETE /api/scholarships/{id}/save`   | `UnsaveScholarshipResponse`                 | 401, 404, 422      |

`GET /api/scholarships/saved` returns one unpaged array of
`RecommendationScholarshipResponse`, so the saved query key takes no paging
parameters.

## Discovery query

- Repeated `academic_level`, `funding_type`, `opportunity_type`, and `country`
  values are OR within a group; different groups are AND.
- `country` is matched against exact stored names, case-insensitively, with no
  country-code translation.
- `sort`: `newest` (default) or `deadline_soon`; `deadline_soonest` is a
  backward-compatible alias. No match sort exists.
- Limits: `search` ≤300 characters; each `country` ≤100 characters and ≤50
  values; other filter groups ≤20 values; `page` ≥1; `page_size` 1–100.

## Nullable data

- Cards require only `id`, `title`, and `is_saved`. Every other card field is
  nullable. `deadline` is a date string (`YYYY-MM-DD`).
- Details also require `ingestion_type` (`scraped` | `manual`) and `source`.
- `majors`, `eligibility_criteria`, and `required_documents` may be a string
  array, a single string, or null. The details adapter normalizes them to
  `string[]`.
- `description_html` is never rendered in this feature, so the details model
  does not carry it.
