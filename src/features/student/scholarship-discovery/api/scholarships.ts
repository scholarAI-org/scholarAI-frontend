import { apiClient } from '@/lib/api-client';
import { toDiscoveryRequestParams } from '../lib/discovery-query-state';
import type {
  DiscoveryQuery,
  SavedScholarshipResponse,
  ScholarshipDetailsResponse,
  ScholarshipDiscoveryFilterOptionsResponse,
  ScholarshipDiscoveryResponse,
  UnsaveScholarshipResponse,
} from '../types';
export const getScholarships = (query: DiscoveryQuery, signal?: AbortSignal) =>
  apiClient<ScholarshipDiscoveryResponse>(`/api/scholarships/?${toDiscoveryRequestParams(query)}`, {
    signal,
  });
// Country strings are kept exactly as returned; they are sent back unchanged.
export function parseFilterOptionsResponse(
  payload: unknown
): ScholarshipDiscoveryFilterOptionsResponse {
  const countries = (payload as { countries?: unknown } | null)?.countries;
  if (!Array.isArray(countries)) {
    throw new Error('Malformed filter-options response: expected { countries: string[] }');
  }
  return {
    countries: countries.filter(
      (country): country is string => typeof country === 'string' && country.trim() !== ''
    ),
  };
}
export const getScholarshipFilterOptions = async (signal?: AbortSignal) =>
  parseFilterOptionsResponse(
    await apiClient<unknown>('/api/scholarships/filter-options', { signal })
  );
export const getScholarship = (id: number, signal?: AbortSignal) =>
  apiClient<ScholarshipDetailsResponse>(`/api/scholarships/${id}`, { signal });
export const saveScholarship = (id: number) =>
  apiClient<SavedScholarshipResponse>(`/api/scholarships/${id}/save`, { method: 'POST' });
export const unsaveScholarship = (id: number) =>
  apiClient<UnsaveScholarshipResponse>(`/api/scholarships/${id}/save`, { method: 'DELETE' });
