# Contract Notes: 007-scholarship-details-page

## OpenAPI Endpoint Reference

Endpoint: `GET /api/scholarships/{id}`
Target Schema: `ScholarshipDetailsResponse` (`docs/api/openapi.json`)

### Field Mapping to Facts Grid & UI Blocks

| UI Block / Facts Grid Field | OpenAPI Field Name                      | Data Type                               | Notes                                                             |
| :-------------------------- | :-------------------------------------- | :-------------------------------------- | :---------------------------------------------------------------- |
| **Title**                   | `title` / `title_ar` / `title_en`       | `string`                                | Required field. Localized selection based on locale.              |
| **Opening Date**            | `opening_date`                          | `string` (date-time)                    | Formatted as long date.                                           |
| **Deadline**                | `deadline` / `no_deadline`              | `string` (date-time) / `boolean`        | Displayed via `ScholarshipDeadline`.                              |
| **Country**                 | `country`                               | `string`                                | Factual backend string.                                           |
| **University**              | `university_name` / `organization_name` | `string`                                | Provider name.                                                    |
| **Funding Amount**          | `funding_amount`                        | `string`                                | Factual funding string.                                           |
| **Language Requirements**   | `language_requirements`                 | `string`                                | Text string.                                                      |
| **Ingestion Type**          | `ingestion_type`                        | `string` (`manual` / `scraped`)         | Required field. Translated string.                                |
| **Source Link**             | `source_url` / `source`                 | `string`                                | Required field. Renders as external link with `<NewTabHint>`.     |
| **Majors List**             | `majors`                                | `string[]` / newline-delimited `string` | Normalized via `toStringList`.                                    |
| **Eligibility Criteria**    | `eligibility_criteria`                  | `string[]` / newline-delimited `string` | Normalized via `toStringList`, rendered with green `CircleCheck`. |
| **Required Documents**      | `required_documents`                    | `string[]` / newline-delimited `string` | Normalized via `toStringList`, rendered with numbered badges.     |
| **Apply CTA Link**          | `apply_link`                            | `string`                                | Rendered as primary orange CTA button.                            |
| **Contact Info**            | `apply_email`, `apply_phone`            | `string`                                | Rendered in sidebar contacts section.                             |
| **Saved State**             | `is_saved`                              | `boolean`                               | Required field. Passed to `ScholarshipBookmark`.                  |
