import { z } from 'zod';

// GET /api/scholarships/{scholarship_id} -> ScholarshipDetailsResponse
// (live OpenAPI). Only what the page cannot work without is strict: a positive
// integer id, a title and is_saved. Every other field is optional in practice:
// anything of the wrong type is read as absent, never as an error, so a
// backend change can hide a section but never break the page.

const toText = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;
// z.object rejects a missing key unless the field is optional, so every lenient
// field ends in .optional(). A missing key therefore stays undefined (the
// transform only runs for a present value, null included); the adapter supplies
// the empty defaults.
const text = z.unknown().transform(toText).optional();

// Backend lists may arrive as an array or one newline-separated string.
const toList = (value: unknown): string[] => {
  const items =
    typeof value === 'string' ? value.split(/\r?\n/) : Array.isArray(value) ? value : [];
  return items.flatMap((item) => {
    const entry = toText(item);
    return entry ? [entry] : [];
  });
};
const textList = z.unknown().transform(toList).optional();

// Arrays only: a bare string is not a valid attachments value.
const stringArray = z
  .unknown()
  .transform((value) => (Array.isArray(value) ? toList(value) : []))
  .optional();

// ScholarshipStudyLevel[]; an older single string is still read.
const STUDY_LEVEL_SEPARATORS = /[,،;/\n]/;
const studyLevels = z
  .unknown()
  .transform((value) =>
    typeof value === 'string'
      ? value.split(STUDY_LEVEL_SEPARATORS).flatMap((part) => toList([part]))
      : toList(value)
  )
  .optional();

export const OPPORTUNITY_TYPES = [
  'scholarship',
  'fellowship',
  'grant',
  'exchange',
  'short_course',
  'other',
] as const;
export const APPLICATION_STATUSES = ['open', 'upcoming', 'closed', 'unknown'] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];
export type ScholarshipApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const oneOf = <T extends string>(values: readonly T[]) =>
  z
    .unknown()
    .transform((value) => values.find((entry) => entry === value))
    .optional();

const flag = z
  .unknown()
  .transform((value) => value === true)
  .optional();

export const scholarshipDetailsSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  is_saved: z.boolean(),
  title_ar: text,
  title_en: text,
  organization_name: text,
  university_name: text,
  country: text,
  image_url: text,
  study_level: studyLevels,
  // ScholarshipFundingType is full | partial; an unknown value is kept as received.
  funding_type: text,
  opportunity_type: oneOf(OPPORTUNITY_TYPES),
  application_status: z
    .unknown()
    .transform((value) => APPLICATION_STATUSES.find((entry) => entry === value) ?? 'unknown')
    .optional(),
  deadline: text,
  no_deadline: flag,
  opening_date: text,
  published_at: text,
  ingestion_type: text,
  source: text,
  source_url: text,
  funding_amount: text,
  language_requirements: text,
  eligible_nationalities: text,
  academic_year: text,
  gpa_requirement: text,
  age_requirement: text,
  majors: textList,
  eligibility_criteria: textList,
  required_documents: textList,
  apply_link: text,
  apply_email: text,
  apply_phone: text,
  pdf_url: text,
  attachments: stringArray,
  is_extension: flag,
});

// Normalised response: snake_case like the backend, so the optimistic
// save/unsave cache update keeps working on it. description_html is dropped on
// purpose: the page never renders stored source HTML.
export type ScholarshipDetailsData = z.output<typeof scholarshipDetailsSchema>;
