'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import { getScholarshipEligibility } from '../api/eligibility';
import { EligibilityContractError } from '../lib/eligibility-adapter';
import { scholarshipExtrasKeys } from '../query-keys';

// The scholarship's structured criteria. 401/403/404/422 and a malformed
// response are final: retrying cannot fix them.
export function useScholarshipEligibility(id: number) {
  return useQuery({
    queryKey: scholarshipExtrasKeys.eligibility(id),
    queryFn: ({ signal }) => getScholarshipEligibility(id, signal),
    retry: (failureCount, error) => {
      if (error instanceof EligibilityContractError) return false;
      if (error instanceof ApiError && [401, 403, 404, 422].includes(error.status ?? 0)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
