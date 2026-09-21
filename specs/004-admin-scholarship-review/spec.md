# 004 — Admin scholarship review

The feature owns the authenticated administrator's shared scholarship review queue and review-detail workflow. The queue uses backend pagination and includes manual and scraped records because the list contract does not expose `ingestion_type`.

Approve and Reject are modal states over the existing detail route, not standalone routes. Their visual references are Figma nodes `2869:6866` and `2869:7665`; the existing approve/reject backend contracts remain authoritative. Rejection confirmation is intentionally neutral and does not promise re-editing or re-reviewing rejected records.

The detail route is `/[locale]/admin/scholarships/review/[id]`. It renders backend-supported information and safe external source/application links for pending, approved, and rejected records returned by the backend. Pending records expose a locale-aware Edit action to `/[locale]/admin/scholarships/review/[id]/edit`; approved and rejected records remain read-only. The edit route loads authoritative review detail, sends changed writable content only through `PATCH /admin/scholarships/{id}`, and returns to the same detail with accessible success feedback. Saving never approves, rejects, or changes status. Approval requires an explicit keyboard-accessible confirmation before publication; rejection requires a reason. Archive and duplicate-check UI remain out of scope.
