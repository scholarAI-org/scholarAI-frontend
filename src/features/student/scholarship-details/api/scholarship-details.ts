import { apiClient } from '@/lib/api-client';
import { DetailsContractError, parseScholarshipDetails } from '../lib/adapter';
import type { ScholarshipDetailsData } from '../types';

// GET /api/scholarships/{id}. The response goes through the schema before it
// reaches the query cache; a malformed payload is a DetailsContractError.
export async function getScholarshipDetails(
  id: number,
  signal?: AbortSignal
): Promise<ScholarshipDetailsData> {
  const raw = await apiClient<unknown>(`/api/scholarships/${id}`, { signal });
  return parseScholarshipDetails(raw);
}

export { DetailsContractError };
