import { z } from 'zod';
import { fundingTypeValues } from './preferences-api.schema';

export const preferencesSchema = z.object({
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

export type PreferencesForm = z.infer<typeof preferencesSchema>;
