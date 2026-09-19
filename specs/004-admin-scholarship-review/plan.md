# Implementation plan

1. Fetch independent review statistics and paginated pending queue data with React Query.
2. Restore ID-based locale-aware navigation from each queue row to the detail route.
3. Fetch detail data only for the selected ID and use a detail-specific query key.
4. Require explicit accessible confirmation before approval, implement mutations, invalidate the feature query family, and transition successful actions to the pending queue with a URL-backed status announcement.
5. Keep unsupported Figma actions absent and record the contract decision.
6. Render `description_html` as plain text until shared trusted HTML rendering infrastructure exists.
7. Keep backend-returned approved and rejected deep links available as read-only detail views.
