import { z } from 'zod';
import {
  academicLevelValues,
  fieldOfStudyValues,
  gpaSystemValues,
} from './academic-information.schema';

export const academicInformationApiSchema = z.object({
  academic_level: z.enum(academicLevelValues),
  field_of_study: z.enum(fieldOfStudyValues),
  institution: z.string(),
  expected_graduation_year: z.number().nullable().optional(),
  gpa: z
    .object({
      value: z.number(),
      scale: z.enum(gpaSystemValues),
    })
    .nullable()
    .optional(),
  current_study_language: z.array(z.string()).default([]),
});

export type AcademicInformationApi = z.infer<typeof academicInformationApiSchema>;

export const emptyAcademicInformation: Partial<AcademicInformationApi> = {
  academic_level: undefined,
  field_of_study: undefined,
  institution: '',
  expected_graduation_year: null,
  gpa: null,
  current_study_language: [],
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
