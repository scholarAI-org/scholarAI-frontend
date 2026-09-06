import { z } from 'zod';
import { academicLevelValues } from './academic-information.schema';

export const fundingTypeValues = ['FULL', 'PARTIAL', 'SELF'] as const;

export const preferencesApiSchema = z.object({
  desired_degree_level: z.enum(academicLevelValues).nullable().optional(),
  funding_type: z.enum(fundingTypeValues).nullable().optional(),
  preferred_fields_of_study: z.array(z.string()).default([]),
  preferred_countries: z.array(z.string()).default([]),
  is_profile_completed: z.boolean().optional().default(false),
});

export type PreferencesApi = z.infer<typeof preferencesApiSchema>;

export const emptyPreferences: PreferencesApi = {
  desired_degree_level: null,
  funding_type: null,
  preferred_fields_of_study: [],
  preferred_countries: [],
  is_profile_completed: false,
};

export function normalizePreferences(value?: Partial<PreferencesApi> | null): PreferencesApi {
  return {
    desired_degree_level: value?.desired_degree_level ?? null,
    funding_type: value?.funding_type ?? null,
    preferred_fields_of_study: Array.isArray(value?.preferred_fields_of_study)
      ? value.preferred_fields_of_study
      : [],
    preferred_countries: Array.isArray(value?.preferred_countries) ? value.preferred_countries : [],
    is_profile_completed: value?.is_profile_completed ?? false,
  };
}
