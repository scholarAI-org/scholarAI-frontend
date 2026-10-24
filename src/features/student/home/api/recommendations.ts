import { apiClient } from '@/lib/api-client';
import { RECOMMENDATIONS_LIST_LIMIT } from '../constants';
import {
  parseRecommendations,
  type RecommendationsResult,
} from '../schemas/recommendations.schema';

// REQUESTED endpoint (backend ask: personalized scholarship recommendations).
// Deliberately NOT the existing unfiltered feed under /api/scholarships/ — see
// contract-notes.md. Unreachable until HOME_API_AVAILABILITY.recommendations is true.
export async function getRecommendations(signal?: AbortSignal): Promise<RecommendationsResult> {
  return parseRecommendations(
    await apiClient<unknown>(`/api/scholarships/recommended?limit=${RECOMMENDATIONS_LIST_LIMIT}`, {
      signal,
    })
  );
}
