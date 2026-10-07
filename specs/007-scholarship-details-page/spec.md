# Feature Specification: 007-scholarship-details-page

## 1. Executive Summary

Feature 007 provides the dedicated scholarship details page (`/student/scholarships/[id]`) for students. It displays full factual information about a selected scholarship including title, provider, university, country, funding amount, deadline, study level, language requirements, ingestion type, source links, eligible majors list, eligibility criteria checklist, and required documents ordered list. It includes a sticky sidebar actions card on desktop containing the "Apply Now" button, bookmark toggle, and contact details (email and phone).

---

## 2. Functional Requirements

### FR-001: Route & Feature Flag Protection

- Server Component route (`src/app/[locale]/student/scholarships/[id]/page.tsx`) reads `featureFlags.scholarshipDetailsEnabled`.
- If `SCHOLARSHIP_DETAILS_ENABLED !== 'true'`, the page immediately invokes Next.js `notFound()`.
- Validates that `[id]` parameter is a positive safe integer (`Number.isSafeInteger(id) && id > 0`). Non-numeric, zero, negative, or floating point IDs invoke `notFound()`.

### FR-002: Data Fetching & Response Validation

- Fetches scholarship details via `GET /api/scholarships/{id}`.
- Response payload validated against `ScholarshipDetailsResponse` target schema (`id`, `title`, `is_saved`, `ingestion_type`, `source`).
- Handles response states:
  - `200 OK`: Renders `ScholarshipDetailsView`.
  - `401 Unauthorized`: Displays localized session expired error message.
  - `403 Forbidden`: Displays localized access forbidden message.
  - `404 Not Found`: Displays localized scholarship not found message.
  - `5xx / Network / Contract Error`: Displays localized generic error message with accessible live region (`role="alert"`) and a retry button.

### FR-003: Visual & Component Layout (Matching Figma 2481-4537)

- **Hero Banner**: Image with gradient overlay, scholarship title, and sub-meta pills (Deadline, Study Level, Funding Type).
- **Facts Grid**: 8 factual fields (Opening Date, Deadline, Country, University, Funding Amount, Language Requirements, Ingestion Type, Source Link).
- **Majors List**: Rounded-full chips with background `#f8fafc`.
- **Eligibility Criteria**: Vertical list with green `CircleCheck` icon (`#16c172`).
- **Required Documents**: Ordered list with numbered green badges.
- **Sidebar Actions Card**: Sticky 449px card on desktop containing "Apply Now" CTA button (`#f97316`, hover `#ea580c`, focus ring `#274383`), Bookmark toggle pill (`ScholarshipBookmark` variant `details`), and contact email/phone links.
- **Responsive Layouts**:
  - Desktop (Figma node 2481-4537): 2-column grid layout with sticky sidebar actions card.
  - Tablet (Figma node 3610:8390): Single column with actions card placed between Hero and About sections.
  - Mobile (Figma node 3606:11330): Single column with title rendered below image.

### FR-004: Accessible & External Links

- External links (`applyLink`, `sourceUrl`) open in new tab with `target="_blank" rel="noopener noreferrer"` and visually hidden `<NewTabHint>` (`(opens in a new tab)`).
- Accessibility focus rings: orange ring for text/links, navy ring (`#274383`) for the orange CTA button.

### FR-005: Single Active Navigation Invariant

- Navigation item resolution for `/student/scholarships/[id]` activates the **Search** item (`scholarships`), NOT Saved or Profile.

### FR-006: i18n & Localization

- Localized namespace: `StudentScholarshipDetails.*`.
- Full key parity between `src/messages/ar.json` and `src/messages/en.json`.
- Arabic plurals support `=0`, `one`, `two`, `few`, `many`, `other` with `{count, number, integer}`. Zero `#` symbols used.

---

## 3. OpenAPI Contract Reference

Target Schema: `ScholarshipDetailsResponse` (`docs/api/openapi.json`)

- `id`: integer (required)
- `title`: string (required)
- `is_saved`: boolean (required)
- `ingestion_type`: string (required)
- `source`: string (required)
- Optional fields: `organization_name`, `university_name`, `country`, `study_level`, `funding_type`, `opportunity_type`, `funding_amount`, `language_requirements`, `source_url`, `majors`, `eligibility_criteria`, `required_documents`, `apply_link`, `apply_email`, `apply_phone`, `pdf_url`, `attachments`, `published_at`, `opening_date`, `deadline`.
