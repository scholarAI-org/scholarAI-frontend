import { apiClient } from '@/lib/api-client';
import { DetailsContractError, parseScholarshipDetails } from '../lib/adapter';
import { parseScholarshipDetailView } from '../lib/detail-view-adapter';
import type { ScholarshipDetailsData, ScholarshipDetailViewData } from '../types';

// GET /api/scholarships/{id}. The response goes through the schema before it
// reaches the query cache; a malformed payload is a DetailsContractError.
export async function getScholarshipDetails(
  id: number,
  signal?: AbortSignal
): Promise<ScholarshipDetailsData> {
  const raw = await apiClient<unknown>(`/api/scholarships/${id}`, { signal });
  return parseScholarshipDetails(raw);
}

// GET /api/scholarships/{id}/details?lang=: the grouped, language-resolved view.
// `lang` is the only query parameter; the backend rejects any other with 422.
export async function getScholarshipDetailView(
  id: number,
  lang: 'ar' | 'en',
  signal?: AbortSignal
): Promise<ScholarshipDetailViewData> {
  const raw = await apiClient<unknown>(`/api/scholarships/${id}/details?lang=${lang}`, { signal });
  return parseScholarshipDetailView(raw);
}

export { DetailsContractError };
