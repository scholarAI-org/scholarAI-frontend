import { z } from 'zod';
import { TRACKING_STATUSES } from '../constants';
import { parseWith } from './contract-error';

// Minimal local schema for GET /api/scholarships/tracked: only what Home reads.
// Unknown fields pass through so additive backend changes never break Home.
// To be replaced by the Tracking feature's types once it is on main.
const trackedScholarshipSchema = z.looseObject({
  id: z.number().int(),
  title: z.string(),
  title_ar: z.string().nullish(),
  title_en: z.string().nullish(),
  deadline: z.string().nullish(),
  no_deadline: z.boolean().nullish(),
  funding_type: z.string().nullish(),
  study_level: z.union([z.string(), z.array(z.string())]).nullish(),
});

const trackedApplicationSchema = z.looseObject({
  id: z.number().int(),
  status: z.enum(TRACKING_STATUSES),
  scholarship: trackedScholarshipSchema,
});

export type TrackedApplication = z.output<typeof trackedApplicationSchema>;
// What Home reads from a scholarship card. Saved cards (ScholarshipDiscoveryCard) and
// tracked cards both satisfy it.
export interface HomeScholarshipCard {
  id: number;
  title: string;
  title_ar?: string | null;
  title_en?: string | null;
  deadline?: string | null;
  no_deadline?: boolean | null;
  funding_type?: string | null;
  study_level?: string | string[] | null;
}

export const parseTrackedApplications = (raw: unknown): TrackedApplication[] =>
  parseWith('tracked', z.array(trackedApplicationSchema), raw);
