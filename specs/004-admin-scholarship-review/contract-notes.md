# Scholarship review contract notes

Verified against the deployed OpenAPI document on 2026-09-19.

- Statistics: `GET /admin/scholarships/review/statistics` supplies `pending_count`, `approved_this_week`, `reviewed_this_week`, and `missing_source_url_count`.
- List: `GET /admin/scholarships/review?page=<page>&page_size=<size>&status=pending` supplies `items`, `total`, `page`, `page_size`, and `total_pages`.
- The list item contract does not contain `image_url` or `ingestion_type`. The image column is omitted, and this page cannot client-filter to scraped-only records.
- The endpoint description explicitly documents a shared manual and scraped review queue. The page therefore truthfully renders the backend's pending queue rather than silently excluding manual records.
- The statistics contract has no rejected-this-week field. The unsupported Figma card is omitted; `reviewed_this_week` is not relabelled as rejected.
- Detail: `GET /admin/scholarships/{id}/review-details` supplies the dedicated review data, including authoritative `ingestion_type`, source/application URLs, funding, deadline, overview HTML, eligibility, and required documents. `description_html` is rendered as plain text because the project has no trusted HTML sanitization pipeline. A future shared content-rendering service may sanitize and render trusted HTML consistently; that infrastructure is outside feature 004.
- Approval: `POST /admin/scholarships/{id}/approve` has an optional body; this UI sends no invented corrections and requires explicit keyboard-accessible confirmation before the mutation. Successful approval and rejection invalidate all review detail/list/statistics queries and return the administrator to the pending queue with a localized URL-backed status announcement.
- Rejection: `POST /admin/scholarships/{id}/reject` requires `{ "reason": string }` with a minimum length of three; the detail UI provides that accessible required input.
- No archive endpoint exists. The documented DELETE endpoint is deletion, not archival, so the Figma archive action is omitted.
- PATCH/PUT update and duplicate-check endpoints exist, but no approved edit or duplicate workflow exists for this feature. They are intentionally outside this slice.
- The implemented detail route is `/[locale]/admin/scholarships/review/[id]`, and listing actions navigate using the backend `id`.
- The pending listing remains pending-only, but a direct detail URL stays available for approved or rejected records when the backend returns them. Those detail views are truthful and read-only: review actions are omitted while historical data and safe links remain available.
