import { z } from 'zod';

export const fundingTypeValues = ['FULL', 'PARTIAL', 'SELF'] as const;

export const preferencesApiSchema = z.object({
  desired_degree_level: z.enum(['TAWJIHI', 'BACHELOR', 'MASTER', 'PHD']).nullable().optional(),
  target_field_of_study: z.string().nullable().optional(),
  target_field_of_study_openalex_id: z.string().nullable().optional(),
  research_specialization: z.string().nullable().optional(),
  research_specialization_openalex_id: z.string().nullable().optional(),
  funding_type: z.enum(fundingTypeValues).nullable().optional(),
  preferred_fields_of_study: z.array(z.string()).default([]),
  preferred_countries: z.array(z.string()).default([]),
  is_profile_completed: z.boolean().optional().default(false),
});

export type PreferencesApi = z.infer<typeof preferencesApiSchema>;

export const emptyPreferences: PreferencesApi = {
  desired_degree_level: null,
  target_field_of_study: null,
  target_field_of_study_openalex_id: null,
  research_specialization: null,
  research_specialization_openalex_id: null,
  funding_type: null,
  preferred_fields_of_study: [],
  preferred_countries: [],
  is_profile_completed: false,
};

export function normalizePreferences(value?: Partial<PreferencesApi> | null): PreferencesApi {
  return {
    desired_degree_level: value?.desired_degree_level ?? null,
    target_field_of_study: value?.target_field_of_study ?? null,
    target_field_of_study_openalex_id: value?.target_field_of_study_openalex_id ?? null,
    research_specialization: value?.research_specialization ?? null,
    research_specialization_openalex_id: value?.research_specialization_openalex_id ?? null,
    funding_type: value?.funding_type ?? null,
    preferred_fields_of_study: Array.isArray(value?.preferred_fields_of_study)
      ? value.preferred_fields_of_study
      : [],
    preferred_countries: Array.isArray(value?.preferred_countries) ? value.preferred_countries : [],
    is_profile_completed: value?.is_profile_completed ?? false,
  };
}
