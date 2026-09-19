# T001 Findings: Manual Scholarship Creation

**Checked**: 2026-09-18

## Repository Conventions

- Forms use React Hook Form with `zodResolver` and feature-owned Zod schema
  factories that receive translated validation messages (for example,
  `createRegisterSchema`).
- `apiClient` is the shared transport. It sets JSON content type when needed,
  sends `credentials: 'include'`, and throws `ApiError` with `status` and
  FastAPI-style `details: Array<{ loc; msg }>` for future field-error mapping.
- Existing write hooks use React Query `useMutation`; the profile update
  mutation sets `retry: false`. Manual creation will use the same no-retry
  convention, preserving the original `ApiError` for the later form layer.
- No shared toast or persistent success-feedback convention was found. The
  later UI slice will use the specified inline accessible feedback pattern.
- Reusable form primitives are `FormField`, `Input`, `Label`, `Checkbox`, and
  `Button`. They are intentionally not used in this data-only slice.
- `src/messages/{ar,en}.json` use namespace objects consumed by `next-intl`.
  The `AdminManualScholarship` namespace remains a later UI/i18n task.

## Taxonomy and Country Findings

- `useCountries` reads `public/data/countries.json`; its `value` is a two-letter
  ISO value for student-profile preferences.
- No scholarship-specific country representation or country taxonomy exists in
  the frontend or checked backend repository. The feature must not silently
  reuse profile ISO values.
- Existing desired-degree and funding enums are profile-preference taxonomies,
  not authoritative scholarship values. The future form will use validated text
  values unless a deployed scholarship contract supplies a taxonomy.

## Contract Finding

The checked backend source exposes an older `ScholarshipCreate` contract that
requires `source` and legacy `title`; it does not define the finalized bilingual
manual-creation fields. Per the accepted feature contract, it is stale for this
feature. This implementation therefore uses the agreed `POST /api/scholarships/`
payload with fixed `ingestion_type: 'manual'`, no editable status/source fields,
and no synthesized legacy title. If the deployed endpoint does not accept that
contract, it is an external API compatibility issue rather than a frontend
workaround opportunity.
