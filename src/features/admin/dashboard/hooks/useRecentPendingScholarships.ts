'use client';

import { useQuery } from '@tanstack/react-query';
import { getRecentPendingScholarships } from '../api/dashboard';
import { shouldRetryDashboardQuery } from '../lib/retry';
import { dashboardKeys } from '../query-keys';

export function useRecentPendingScholarships(limit: number) {
  return useQuery({
    queryKey: dashboardKeys.pending(limit),
    queryFn: ({ signal }) => getRecentPendingScholarships(limit, signal),
    retry: shouldRetryDashboardQuery,
  });
}
