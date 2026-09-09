import { z } from 'zod';

export const fundingTypeValues = ['FULL', 'PARTIAL', 'SELF'] as const;

// Separate from Academic Information's academicLevelValues.
// TAWJIHI belongs only to Academic Information, not to Preferences.
export const desiredDegreeLevelValues = ['BACHELOR', 'MASTER', 'PHD', 'DIPLOMA', 'OTHER'] as const;
export type DesiredDegreeLevel = (typeof desiredDegreeLevelValues)[number];

export const preferencesApiSchema = z.object({
  desired_degree_level: z.enum(desiredDegreeLevelValues).nullable().optional(),
  target_field_of_study: z.string().nullable().optional(),
  target_field_of_study_openalex_id: z.string().nullable().optional(),
  detailed_specialization: z.string().nullable().optional(),
  funding_type: z.enum(fundingTypeValues).nullable().optional(),
  preferred_countries: z.array(z.string()).default([]),
  open_to_all_countries: z.boolean().default(false),
  is_profile_completed: z.boolean().optional().default(false),
});

export type PreferencesApi = z.infer<typeof preferencesApiSchema>;

export const emptyPreferences: PreferencesApi = {
  desired_degree_level: null,
  target_field_of_study: null,
  target_field_of_study_openalex_id: null,
  detailed_specialization: null,
  funding_type: null,
  preferred_countries: [],
  open_to_all_countries: false,
  is_profile_completed: false,
};

export function normalizePreferences(
  value?: Partial<PreferencesApi> | Record<string, unknown> | null
): PreferencesApi {
  const val = (value ?? {}) as Record<string, unknown>;

  const rawLevel = val.desired_degree_level as string | null | undefined;
  const desiredDegreeLevel: PreferencesApi['desired_degree_level'] =
    desiredDegreeLevelValues.includes(rawLevel as DesiredDegreeLevel)
      ? (rawLevel as DesiredDegreeLevel)
      : null;

  // Accept either detailed_specialization (backend canonical) or legacy research_specialization
  const detailedSpec =
    typeof val.detailed_specialization === 'string' && val.detailed_specialization
      ? val.detailed_specialization
      : typeof val.research_specialization === 'string' && val.research_specialization
        ? val.research_specialization
        : null;

  return {
    desired_degree_level: desiredDegreeLevel,
    target_field_of_study:
      typeof val.target_field_of_study === 'string' ? val.target_field_of_study : null,
    target_field_of_study_openalex_id:
      typeof val.target_field_of_study_openalex_id === 'string'
        ? val.target_field_of_study_openalex_id
        : null,
    detailed_specialization: desiredDegreeLevel === 'PHD' ? detailedSpec : null,
    funding_type: (val.funding_type as PreferencesApi['funding_type']) ?? null,
    preferred_countries: Array.isArray(val.preferred_countries)
      ? (val.preferred_countries as string[])
      : [],
    open_to_all_countries:
      typeof val.open_to_all_countries === 'boolean' ? val.open_to_all_countries : false,
    is_profile_completed: Boolean(val.is_profile_completed),
  };
}
