import { z } from 'zod';
import { APPLICATION_STATUSES, OPPORTUNITY_TYPES } from './details.schema';

// GET /api/scholarships/{scholarship_id}/details?lang=ar|en -> ScholarshipDetailView
// (backend docs/scholarship-detail-view.md). The backend already picks the language,
// returns every list as a list and never returns HTML.
//
// The same leniency rule as details.schema.ts: only id, title and is_saved are
// strict. A missing section, a wrong type or a blank string reads as absent, so a
// backend change can hide a section but never break the page.

const toText = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;
const text = z.unknown().transform(toText).optional();

const textList = z
  .unknown()
  .transform((value) => (Array.isArray(value) ? value.flatMap((item) => toText(item) ?? []) : []))
  .optional();

const bool = z
  .unknown()
  .transform((value) => (typeof value === 'boolean' ? value : undefined))
  .optional();

const wholeNumber = z
  .unknown()
  .transform((value) =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined
  )
  .optional();

const oneOf = <T extends string>(values: readonly T[]) =>
  z
    .unknown()
    .transform((value) => values.find((entry) => entry === value))
    .optional();

// [{code, name}] -> names; an entry without a name is dropped.
const namedList = z
  .unknown()
  .transform((value) =>
    Array.isArray(value)
      ? value.flatMap((item) => {
          const name = item && typeof item === 'object' ? toText(item.name) : undefined;
          return name ? [{ code: toText(item.code), name }] : [];
        })
      : []
  )
  .optional();

// A section that is missing or not an object reads as an empty object.
const section = <T extends z.ZodRawShape>(shape: T) =>
  z.preprocess(
    (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {}),
    z.object(shape)
  );

const documents = z
  .unknown()
  .transform((value) =>
    Array.isArray(value)
      ? value.flatMap((item) => {
          if (!item || typeof item !== 'object') return [];
          const name = toText(item.name);
          if (!name) return [];
          return [
            {
              name,
              type: toText(item.type),
              mandatory: typeof item.mandatory === 'boolean' ? item.mandatory : undefined,
            },
          ];
        })
      : []
  )
  .optional();

export const FIELDS_OF_STUDY_SCOPES = ['all', 'specific'] as const;

export const scholarshipDetailViewSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  is_saved: z.boolean(),
  image_url: text,
  last_updated_at: text,
  provider: section({ name: text, university: text }),
  deadline: section({
    date: text,
    no_deadline: bool,
    days_left: wholeNumber,
    status: oneOf(APPLICATION_STATUSES),
    opening_date: text,
  }),
  overview: section({
    description: text,
    opportunity_type: oneOf(OPPORTUNITY_TYPES),
    countries: namedList,
    study_levels: textList,
    fields_of_study: namedList,
    fields_of_study_scope: oneOf(FIELDS_OF_STUDY_SCOPES),
    academic_year: text,
  }),
  funding: section({
    type: text,
    summary: text,
    duration_months: z
      .unknown()
      .transform((value) => {
        if (!value || typeof value !== 'object') return undefined;
        const { min, max } = value as { min?: unknown; max?: unknown };
        const ok = (n: unknown): n is number =>
          typeof n === 'number' && Number.isFinite(n) && n > 0;
        return ok(min) && ok(max) && min <= max ? { min, max } : undefined;
      })
      .optional(),
    benefits: textList,
  }),
  eligibility: section({
    criteria: textList,
    summary: section({ nationalities: text, gpa: text, age: text, languages: text }),
  }),
  application: section({
    link: text,
    email: text,
    phone: text,
    pdf_url: text,
    attachments: textList,
    documents,
  }),
  source: section({ name: text, url: text, published_at: text }),
});

export type ScholarshipDetailViewData = z.output<typeof scholarshipDetailViewSchema>;
