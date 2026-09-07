import { z } from 'zod';
import { academicLevelValues, gpaSystemValues } from './academic-information.schema';

export const studyStatusValues = ['CURRENTLY_STUDYING', 'GRADUATED'] as const;

export const academicInformationApiSchema = z.object({
  academic_level: z.enum(academicLevelValues),
  field_of_study: z.string(),
  field_of_study_openalex_id: z.string().nullable().optional(),
  institution: z.string().nullable().optional(),
  expected_graduation_year: z.number().nullable().optional(),
  gpa: z
    .object({
      value: z.number(),
      scale: z.enum(gpaSystemValues),
    })
    .nullable()
    .optional(),
  current_study_language: z.array(z.string()).default([]),
  study_status: z.enum(studyStatusValues).nullable().optional(),
  target_field_of_study: z.string().nullable().optional(),
  target_field_of_study_openalex_id: z.string().nullable().optional(),
  research_specialization: z.string().nullable().optional(),
  research_specialization_openalex_id: z.string().nullable().optional(),
});

export type AcademicInformationApi = z.infer<typeof academicInformationApiSchema>;

export const emptyAcademicInformation: Partial<AcademicInformationApi> = {
  academic_level: undefined,
  field_of_study: '',
  field_of_study_openalex_id: null,
  institution: null,
  expected_graduation_year: null,
  gpa: null,
  current_study_language: [],
  study_status: null,
  target_field_of_study: null,
  target_field_of_study_openalex_id: null,
  research_specialization: null,
  research_specialization_openalex_id: null,
};

export function normalizeAcademicInformation(
  value?: Partial<AcademicInformationApi> | null
): Partial<AcademicInformationApi> {
  if (!value) return emptyAcademicInformation;
  return {
    ...emptyAcademicInformation,
    ...value,
  };
}
