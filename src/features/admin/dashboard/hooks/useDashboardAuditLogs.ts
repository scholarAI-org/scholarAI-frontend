'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardAuditLogs } from '../api/dashboard';
import { shouldRetryDashboardQuery } from '../lib/retry';
import { dashboardKeys } from '../query-keys';
import type { DashboardAuditLogsParams } from '../types';

export function useDashboardAuditLogs(params: DashboardAuditLogsParams) {
  return useQuery({
    queryKey: dashboardKeys.audit(params),
    queryFn: ({ signal }) => getDashboardAuditLogs(params, signal),
    retry: shouldRetryDashboardQuery,
  });
}
