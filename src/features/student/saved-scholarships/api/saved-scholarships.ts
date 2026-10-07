import { apiClient } from '@/lib/api-client';
import type { ScholarshipDiscoveryCard } from '@/features/student/scholarship-discovery/types';
import { SavedContractError, validateSavedResponse } from '../lib/validateSavedResponse';

// GET /api/scholarships/saved (TARGET contract).
// No query parameters: no page / page_size / skip / limit. The response is
// validated against the target card shape; a mismatch throws SavedContractError
// so the query layer sees it as an error, not an empty success.
export async function getSavedScholarships(
  signal?: AbortSignal
): Promise<ScholarshipDiscoveryCard[]> {
  const raw = await apiClient<unknown>('/api/scholarships/saved', { signal });
  const result = validateSavedResponse(raw);
  if (!result.ok) throw result.error;
  return result.cards;
}

export { SavedContractError };
