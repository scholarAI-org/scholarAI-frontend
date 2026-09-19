'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardStatistics } from '../api/dashboard';
import { dashboardKeys } from '../query-keys';
import { shouldRetryDashboardQuery } from '../lib/retry';

export function useDashboardStatistics() {
  return useQuery({
    queryKey: dashboardKeys.statistics(),
    queryFn: ({ signal }) => getDashboardStatistics(signal),
    retry: shouldRetryDashboardQuery,
  });
}
