import { apiClient } from '@/lib/api-client';
import { DISCOVERY_PAGE_SIZE } from '../constants';
import type {
  DiscoveryQuery,
  ScholarshipDetailsResponse,
  ScholarshipDiscoveryFilterOptionsResponse,
  ScholarshipDiscoveryResponse,
} from '../types';
export async function getScholarships(query: DiscoveryQuery, signal?: AbortSignal) {
  const p = new URLSearchParams();
  if (query.search) p.set('search', query.search);
  query.academicLevels.forEach((v) => p.append('academic_level', v));
  query.fundingTypes.forEach((v) => p.append('funding_type', v));
  query.opportunityTypes.forEach((v) => p.append('opportunity_type', v));
  query.countries.forEach((v) => p.append('country', v));
  p.set('sort', query.sort);
  p.set('page', String(query.page));
  p.set('page_size', String(DISCOVERY_PAGE_SIZE));
  return apiClient<ScholarshipDiscoveryResponse>(`/api/scholarships/?${p}`, { signal });
}
export const getScholarshipFilterOptions = (signal?: AbortSignal) =>
  apiClient<ScholarshipDiscoveryFilterOptionsResponse>('/api/scholarships/filter-options', {
    signal,
  });
export const getScholarship = (id: number, signal?: AbortSignal) =>
  apiClient<ScholarshipDetailsResponse>(`/api/scholarships/${id}`, { signal });
export const saveScholarship = (id: number) =>
  apiClient(`/api/scholarships/${id}/save`, { method: 'POST' });
export const unsaveScholarship = (id: number) =>
  apiClient(`/api/scholarships/${id}/save`, { method: 'DELETE' });
