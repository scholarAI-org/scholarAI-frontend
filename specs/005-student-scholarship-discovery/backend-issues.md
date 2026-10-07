# Backend Issues Affecting Discovery — Feature 005

Status: reported to the backend team; the frontend does not work around these
(decision 2026-10-03, option A). Scholarship fields only; no personal data.

## Summary

The discovery filters for academic level, funding type and opportunity type
return no matches because the published scholarships have no classification
data. The level and funding information exists only inside the title text.
A secondary problem: the filter matcher also rejects common free-text forms
once the fields are filled.

The frontend sends valid values (for example `academic_level=master`, which the
backend validates to `MASTER`), and its cards hide a field only when the backend
returns null or blank. No frontend change is needed for either issue.

## (a) Data: classification fields are null for every published scholarship

Unfiltered `GET /api/scholarships/` as a student returned 7 items (`total=7`).
For all 7, `study_level`, `funding_type` and `opportunity_type` are `null`, and so
are `university_name`, `title_ar` and `title_en`. All 7 have `status=approved`.

| ID  | Title (as stored)                                                                                            | Country          | Deadline   |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------------- | ---------- |
| 570 | منحة ماجستير ودكتوراه ممولة في اليابان 2027 في جامعة طوكيو                                                   | اليابان          | 2026-10-14 |
| 568 | منحة دكتوراه ممولة في نيوزيلندا 2027 بجامعة Canterbury للطلاب الدوليين بتمويل يصل إلى 32,650 دولار نيوزيلندي | نيوزيلاندا       | 2026-10-15 |
| 572 | منحة ماجستير ودكتوراه في اليابان ممولة بالكامل براتب شهري يصل الى 144,000 ين ياباني لطلاب الدوليين           | اليابان          | 2026-11-05 |
| 567 | منحة دكتوراه ممولة بالكامل في اليابان 2027 في جامعة OIST                                                     | اليابان          | 2026-11-15 |
| 565 | منحة بكالوريوس ممولة جزئياً 2027 لطلاب الدوليين في امريكا في جامعة Boston University                         | الولايات المتحدة | 2026-12-01 |
| 564 | منحة بكالوريوس في جامعة فاندربيلت في أمريكا للطلاب الدوليين 2027                                             | الولايات المتحدة | 2026-12-01 |
| 571 | منحة بكالوريوس في اليابان 2027 بجامعة APU بتمويل يصل إلى 100% من الرسوم                                      | اليابان          | none       |

Effect: `academic_level`, `funding_type` and `opportunity_type` filters can never
match (`NULL` never satisfies the conditions), so any of these filters returns an
empty list. Scholarship cards cannot show a funding badge or study level, and
the university and localized titles are missing.

## (b) Matcher: valid free-text values still do not match

Even when the fields are filled, the matching in
`app/services/scholarship_discovery.py` rejects common forms:

- **Study level** (`study_level_condition`, lines 92–103): removes spaces, splits
  only on `,` `،` `;` `/`, and requires a whole token equal to a known label
  (`STUDY_LEVEL_LABELS`, lines 24–54). `"ماجستير ودكتوراه"` becomes the single
  token `ماجستيرودكتوراه`; `"Master and PhD"`, `"Master & PhD"` and
  `"ماجستير - دكتوراه"` do not match either.
- **Funding** (`funding_type_condition`, lines 106–108): whole-string equality
  against `FUNDING_LABELS` (lines 55–73). `"ممولة"`, `"ممولة بالكامل براتب شهري"`
  or `"ممولة جزئياً"` (tanween after the alef, as in ID 565's title; the label
  list has `ممولة جزئيا` and `ممولة جزئيًا`) do not match.
- **Opportunity type**: an enum column; `NULL` (unclassified) never matches.

## Suggested fixes

1. Extract and store structured values at ingestion: `study_level` as one or
   more of `bachelor | master | phd | exchange`, `funding_type` as
   `full | partial`, `opportunity_type` as the existing enum; also fill
   `university_name`, `title_ar` and `title_en` where the source has them.
2. Backfill the existing rows (at least the 7 published ones above).
3. Make admin edit/review require these fields before a scholarship can be
   approved, using fixed options instead of free text.
4. Extend or replace the study-level matcher for multi-level values (preferably
   a structured list column; otherwise also split on "و", " and ", "&", "-"),
   and normalize Arabic spelling variants for funding labels.
5. Add tests for multi-level, Arabic and partial-funding values, and for the
   filters returning published scholarships.

## Note: hotlinked images

`image_url` for these scholarships points to `images.for9a.com`. Hotlinking
depends on that site's availability and policies (it can block or change the
images) and raises usage-rights questions. Suggest copying images to the
project's own storage at ingestion (with permission/attribution as required)
and serving them from there. The frontend already falls back to a neutral local
image when a URL is invalid or fails to load.

## Values the current matcher accepts (for manual data fixes)

- `study_level` — case-insensitive, spaces ignored; separate several levels with
  `,` `،` `;` or `/`. Labels: bachelor, bachelors, bachelor's, bachelor's degree,
  undergraduate, بكالوريوس · master, masters, master's, master's degree, ماجستير ·
  phd, ph.d, ph.d., doctorate, doctoral, دكتوراه · exchange, academic exchange,
  تبادل أكاديمي, تبادل اكاديمي. Example: `master, phd`.
- `funding_type` — one whole value, case-insensitive: full, fully_funded,
  fully funded, full funding, تمويل كامل, ممولة بالكامل · partial,
  partially_funded, partially funded, partial funding, تمويل جزئي, ممولة جزئيا,
  ممولة جزئيًا. Prefer `full` / `partial`.
- `opportunity_type` — exactly one of `scholarship`, `academic_exchange`,
  `research_fellowship`, `training`.
