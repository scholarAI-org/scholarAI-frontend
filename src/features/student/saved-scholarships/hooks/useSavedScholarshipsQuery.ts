'use client';

import { useQuery } from '@tanstack/react-query';
import { studentScholarshipKeys } from '@/features/student/scholarship-discovery/query-keys';
import { ApiError } from '@/lib/api-client';
import { getSavedScholarships, SavedContractError } from '../api/saved-scholarships';

// React Query over the TARGET saved contract. Preserves studentScholarshipKeys.saved()
// as the single key. A SavedContractError surfaces as an error state, never an
// empty success — the UI never masquerades a contract error as "no saved items".
export function useSavedScholarshipsQuery() {
  return useQuery({
    queryKey: studentScholarshipKeys.saved(),
    queryFn: ({ signal }) => getSavedScholarships(signal),
    // Match the 005 retry policy: do not retry on 401/403/404/422 or on a
    // contract error — retrying is user-initiated for those.
    retry: (failureCount, error) => {
      if (error instanceof SavedContractError) return false;
      if (error instanceof ApiError) {
        const status = error.status ?? 0;
        if (status === 401 || status === 403 || status === 404 || status === 422) return false;
      }
      return failureCount < 2;
    },
  });
}
