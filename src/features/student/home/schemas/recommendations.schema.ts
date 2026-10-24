import { z } from 'zod';
import type { ScholarshipDiscoveryCard } from '@/features/student/scholarship-discovery/types';
import { parseWith } from './contract-error';

// REQUESTED contract (backend ask: personalized scholarship recommendations).
// Not rendered by Home today (the unlocked panel shows the newest published
// scholarships); kept so the swap is a one-line availability change.
const recommendationCardSchema = z.looseObject({
  id: z.number().int(),
  title: z.string(),
  is_saved: z.boolean(),
  match: z.object({ score: z.number().int().min(0).max(100) }).nullish(),
});

const recommendationsSchema = z.object({
  locked: z.boolean(),
  items: z.array(recommendationCardSchema),
});

export type RecommendationCard = ScholarshipDiscoveryCard & { match?: { score: number } | null };

export interface RecommendationsResult {
  locked: boolean;
  items: RecommendationCard[];
}

export function parseRecommendations(raw: unknown): RecommendationsResult {
  const parsed = parseWith('recommendations', recommendationsSchema, raw);
  return { locked: parsed.locked, items: parsed.items as unknown as RecommendationCard[] };
}
