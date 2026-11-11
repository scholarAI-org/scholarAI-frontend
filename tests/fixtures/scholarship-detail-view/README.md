# Scholarship detail view fixtures

Responses of `GET /api/scholarships/{id}/details?lang=ar|en`, shaped after the
examples the backend generated from its implementation on 2026-11-10 (synthetic
data, example.org links).

- `detail-12-ar.json` / `detail-12-en.json`: a complete listing in both languages.
  In English the last document has no English name, so it falls back to Arabic.
- `detail-13-ar.json`: a poor scraped listing (Telegram post): mostly nulls,
  plain-text description converted from HTML, `fields_of_study_scope` null.

Replace them with the backend's own files once those are committed.
