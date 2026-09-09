import { z } from 'zod';
import {
  desiredDegreeLevelValues,
  fundingTypeValues,
  type DesiredDegreeLevel,
} from './preferences-api.schema';

export const preferencesSchema = z.object({
  desired_degree_level: z.enum(desiredDegreeLevelValues).nullable().optional(),
  target_field_of_study: z.string().nullable().optional(),
  target_field_of_study_openalex_id: z.string().nullable().optional(),
  detailed_specialization: z.string().nullable().optional(),
  funding_type: z.enum(fundingTypeValues).nullable().optional(),
  preferred_countries: z.array(z.string()).optional().default([]),
  open_to_all_countries: z.boolean().optional().default(false),
  is_profile_completed: z.boolean().optional().default(false),
});

export function createPreferencesSchema(t?: (key: string) => string) {
  return preferencesSchema.superRefine((data, ctx) => {
    if (data.desired_degree_level === 'PHD' && !data.detailed_specialization?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['detailed_specialization'],
        message: t
          ? t('detailedSpecializationRequired')
          : 'Detailed specialization is required when PhD is selected.',
      });
    }
  });
}

export type PreferencesForm = {
  desired_degree_level?: DesiredDegreeLevel | null;
  target_field_of_study?: string | null;
  target_field_of_study_openalex_id?: string | null;
  detailed_specialization?: string | null;
  funding_type?: 'FULL' | 'PARTIAL' | 'SELF' | null;
  preferred_countries?: string[];
  open_to_all_countries?: boolean;
  is_profile_completed?: boolean;
};
