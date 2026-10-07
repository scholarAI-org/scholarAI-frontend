'use client';

import { useQuery } from '@tanstack/react-query';
import { studentScholarshipKeys } from '@/features/student/scholarship-discovery/query-keys';
import { ApiError } from '@/lib/api-client';
import { getScholarshipDetails, DetailsContractError } from '../api/scholarship-details';

export function useScholarshipDetailsQuery(id: number) {
  return useQuery({
    queryKey: studentScholarshipKeys.detail(id),
    queryFn: ({ signal }) => getScholarshipDetails(id, signal),
    enabled: Number.isSafeInteger(id) && id > 0,
    retry: (failureCount, error) => {
      if (error instanceof DetailsContractError) return false;
      if (error instanceof ApiError) {
        const status = error.status ?? 0;
        if (status === 401 || status === 403 || status === 404 || status === 422) return false;
      }
      return failureCount < 2;
    },
  });
}
