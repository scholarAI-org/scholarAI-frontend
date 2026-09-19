import { apiClient } from '@/lib/api-client';
import type {
  ScholarshipApproveResponse,
  ScholarshipRejectResponse,
  ScholarshipReviewDetail,
  ScholarshipReviewListResponse,
  ScholarshipReviewStatistics,
} from '../types';

export function getScholarshipReviewStatistics(signal?: AbortSignal) {
  return apiClient<ScholarshipReviewStatistics>('/admin/scholarships/review/statistics', {
    method: 'GET',
    signal,
  });
}

export function getScholarshipReviewDetail(id: number, signal?: AbortSignal) {
  return apiClient<ScholarshipReviewDetail>(`/admin/scholarships/${id}/review-details`, {
    method: 'GET',
    signal,
  });
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
