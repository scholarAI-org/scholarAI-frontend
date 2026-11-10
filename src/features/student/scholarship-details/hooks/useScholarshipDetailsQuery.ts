'use client';

import { useQuery } from '@tanstack/react-query';
import { studentScholarshipKeys } from '@/features/student/scholarship-discovery/query-keys';
import { ApiError } from '@/lib/api-client';
import { getScholarshipDetailView, getScholarshipDetails } from '../api/scholarship-details';
import { DetailsContractError } from '../lib/adapter';

const retry = (failureCount: number, error: unknown) => {
  if (error instanceof DetailsContractError) return false;
  if (error instanceof ApiError) {
    const status = error.status ?? 0;
    if (status === 401 || status === 403 || status === 404 || status === 422) return false;
  }
  return failureCount < 2;
};

const isValidId = (id: number) => Number.isSafeInteger(id) && id > 0;

// GET /api/scholarships/{id}: the original endpoint.
export function useScholarshipDetailsQuery(id: number, { enabled = true } = {}) {
  return useQuery({
    queryKey: studentScholarshipKeys.detail(id),
    queryFn: ({ signal }) => getScholarshipDetails(id, signal),
    enabled: enabled && isValidId(id),
    retry,
  });
}

// GET /api/scholarships/{id}/details?lang=: one request per language.
export function useScholarshipDetailViewQuery(
  id: number,
  lang: 'ar' | 'en',
  { enabled = true } = {}
) {
  return useQuery({
    queryKey: studentScholarshipKeys.detailView(id, lang),
    queryFn: ({ signal }) => getScholarshipDetailView(id, lang, signal),
    enabled: enabled && isValidId(id),
    retry,
  });
}
