# 004 — Admin scholarship review

The feature owns the authenticated administrator's shared scholarship review queue and review-detail workflow. The queue uses backend pagination and includes manual and scraped records because the list contract does not expose `ingestion_type`.

The detail route is `/[locale]/admin/scholarships/review/[id]`. It renders backend-supported information and safe external source/application links for pending, approved, and rejected records returned by the backend. Non-pending records are read-only. Approval requires an explicit keyboard-accessible confirmation before publication; rejection requires a reason. On successful review actions the admin returns to the pending queue with accessible feedback. Archive, editing, and duplicate-check UI are out of scope.
