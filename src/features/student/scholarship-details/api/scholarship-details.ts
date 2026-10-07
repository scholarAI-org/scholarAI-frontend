import { apiClient } from '@/lib/api-client';
import type { ScholarshipDetailsResponse } from '../types';
import { DetailsContractError, validateDetailsResponse } from '../lib/validateDetailsResponse';

export async function getScholarshipDetails(
  id: number,
  signal?: AbortSignal
): Promise<ScholarshipDetailsResponse> {
  const raw = await apiClient<unknown>(`/api/scholarships/${id}`, { signal });
  const result = validateDetailsResponse(raw);
  if (!result.ok) throw result.error;
  return result.data;
}

export { DetailsContractError };
