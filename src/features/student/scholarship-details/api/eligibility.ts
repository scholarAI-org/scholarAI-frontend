import { apiClient } from '@/lib/api-client';
import {
  parseScholarshipEligibility,
  type ScholarshipEligibility,
} from '../lib/eligibility-adapter';

// GET /api/scholarships/{id}/eligibility: the scholarship's own structured
// criteria (visibility rules match the details endpoint, so a 404 is the same
// uniform not-found).
export async function getScholarshipEligibility(
  id: number,
  signal?: AbortSignal
): Promise<ScholarshipEligibility> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new RangeError('invalid scholarship id');
  const raw = await apiClient<unknown>(`/api/scholarships/${id}/eligibility`, { signal });
  return parseScholarshipEligibility(raw);
}
