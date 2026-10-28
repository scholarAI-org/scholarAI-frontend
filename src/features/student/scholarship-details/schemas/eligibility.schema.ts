import { z } from 'zod';

// GET /api/scholarships/{scholarship_id}/eligibility ->
// ScholarshipEligibilityResponse (live OpenAPI). It describes what the
// scholarship itself requires; it is not a per-student match. "Null means
// unknown; false and empty arrays are preserved", so the schema keeps null and
// "missing" apart from false, 0 and [].
//
// Every field is lenient: a value of the wrong type is read as unknown (null)
// and a missing key is read the same way.

const toItems = (value: unknown): string[] =>
  (typeof value === 'string' ? value.split(/\r?\n/) : (value as unknown[])).flatMap((item) =>
    typeof item === 'string' && item.trim() ? [item.trim()] : []
  );

// string[] | string -> string[]; anything else (null, number, object) -> null.
const list = z
  .unknown()
  .transform((value) => (typeof value === 'string' || Array.isArray(value) ? toItems(value) : null))
  .optional();

const text = z
  .unknown()
  .transform((value) => (typeof value === 'string' && value.trim() ? value.trim() : null))
  .optional();

const count = z
  .unknown()
  .transform((value) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
  )
  .optional();

const flag = z
  .unknown()
  .transform((value) => (typeof value === 'boolean' ? value : null))
  .optional();

export const scholarshipEligibilitySchema = z.object({
  allowed_nationalities: list,
  target_degree_levels: list,
  allowed_gender: text,
  target_residencies: list,
  min_gpa_percentage: count,
  max_age: count,
  allowed_fields_of_study: list,
  required_languages: list,
  is_req_experience: flag,
  is_Softskills_required: flag,
});

export type ScholarshipEligibilityData = z.output<typeof scholarshipEligibilitySchema>;
