import { z } from 'zod';
import { academicLevelValues } from './academic-information.schema';
import { fundingTypeValues } from './preferences-api.schema';

export const preferencesSchema = z.object({
  desired_degree_level: z.enum(academicLevelValues).nullable().optional(),
  funding_type: z.enum(fundingTypeValues).nullable().optional(),
  preferred_fields_of_study: z.array(z.string()).default([]),
  preferred_countries: z.array(z.string()).default([]),
  is_profile_completed: z.boolean().optional().default(false),
});

export type PreferencesForm = z.infer<typeof preferencesSchema>;
