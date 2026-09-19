import type { DashboardAuditLogsParams } from './types';

export const dashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  statistics: () => [...dashboardKeys.all, 'statistics'] as const,
  pending: (limit: number) => [...dashboardKeys.all, 'recent-pending-scholarships', limit] as const,
  audit: ({ limit, offset, action }: DashboardAuditLogsParams) =>
    [...dashboardKeys.all, 'audit-logs', { limit, offset, action: action ?? null }] as const,
};
