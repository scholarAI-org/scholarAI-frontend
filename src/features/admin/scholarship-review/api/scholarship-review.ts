import { apiClient } from '@/lib/api-client';
import type {
  ScholarshipApproveResponse,
  ScholarshipRejectResponse,
  ScholarshipReviewDetail,
  ScholarshipReviewListResponse,
  ScholarshipReviewStatistics,
  AdminScholarshipUpdatePayload,
  ScholarshipReviewStatus,
} from '../types';

function normalizeScholarshipReviewStatus(value: unknown): ScholarshipReviewStatus {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'pending' || normalized === 'approved' || normalized === 'rejected'
    ? normalized
    : 'unknown';
}

export function getScholarshipReviewStatistics(signal?: AbortSignal) {
  return apiClient<ScholarshipReviewStatistics>('/admin/scholarships/review/statistics', {
    method: 'GET',
    signal,
  });
}

export async function getScholarshipReviewDetail(id: number, signal?: AbortSignal) {
  const detail = await apiClient<Omit<ScholarshipReviewDetail, 'status'> & { status?: unknown }>(
    `/admin/scholarships/${id}/review-details`,
    { method: 'GET', signal }
  );
  return { ...detail, status: normalizeScholarshipReviewStatus(detail.status) };
}

export function approveScholarship(id: number) {
  return apiClient<ScholarshipApproveResponse>(`/admin/scholarships/${id}/approve`, {
    method: 'POST',
  });
}

export function rejectScholarship(id: number, reason: string) {
  return apiClient<ScholarshipRejectResponse>(`/admin/scholarships/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function updatePendingScholarship(id: number, payload: AdminScholarshipUpdatePayload) {
  const detail = await apiClient<Omit<ScholarshipReviewDetail, 'status'> & { status?: unknown }>(
    `/admin/scholarships/${id}`,
    { method: 'PATCH', body: JSON.stringify(payload) }
  );
  return { ...detail, status: normalizeScholarshipReviewStatus(detail.status) };
}

export function getScholarshipReviewList(page: number, pageSize: number, signal?: AbortSignal) {
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    throw new RangeError('Scholarship review pagination is invalid.');
  }

  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    status: 'pending',
  });
  return apiClient<ScholarshipReviewListResponse>(`/admin/scholarships/review?${params}`, {
    method: 'GET',
    signal,
  });
}
