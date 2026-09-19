import { apiClient } from '@/lib/api-client';
import type {
  DashboardAuditLogsParams,
  DashboardAuditLogsResponse,
  DashboardStatistics,
  RecentPendingScholarshipsResponse,
} from '../types';

function assertBoundedLimit(limit: number, min: number, max: number, resource: string) {
  if (!Number.isInteger(limit) || limit < min || limit > max) {
    throw new RangeError(`${resource} limit must be an integer between ${min} and ${max}.`);
  }
}

function assertNonNegativeInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer.`);
  }
}

export function getDashboardStatistics(signal?: AbortSignal): Promise<DashboardStatistics> {
  return apiClient<DashboardStatistics>('/admin/dashboard/statistics', {
    method: 'GET',
    signal,
  });
}

export function getRecentPendingScholarships(
  limit: number,
  signal?: AbortSignal
): Promise<RecentPendingScholarshipsResponse> {
  assertBoundedLimit(limit, 1, 50, 'Recent pending scholarships');

  const searchParams = new URLSearchParams({ limit: String(limit) });
  return apiClient<RecentPendingScholarshipsResponse>(
    `/admin/dashboard/recent-pending-scholarships?${searchParams.toString()}`,
    { method: 'GET', signal }
  );
}

export function getDashboardAuditLogs(
  { limit, offset, action }: DashboardAuditLogsParams,
  signal?: AbortSignal
): Promise<DashboardAuditLogsResponse> {
  assertBoundedLimit(limit, 1, 100, 'Dashboard audit logs');
  assertNonNegativeInteger(offset, 'Dashboard audit logs offset');

  const searchParams = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (action?.trim()) {
    searchParams.set('action', action.trim());
  }

  return apiClient<DashboardAuditLogsResponse>(
    `/admin/dashboard/audit-logs?${searchParams.toString()}`,
    { method: 'GET', signal }
  );
}
