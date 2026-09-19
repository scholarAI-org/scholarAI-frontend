'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveScholarship,
  getScholarshipReviewDetail,
  getScholarshipReviewList,
  getScholarshipReviewStatistics,
  rejectScholarship,
} from '../api/scholarship-review';
import { scholarshipReviewKeys } from '../query-keys';
import { shouldRetryScholarshipReviewQuery } from '../lib/retry';

export function useScholarshipReviewStatistics() {
  return useQuery({
    queryKey: scholarshipReviewKeys.statistics(),
    queryFn: ({ signal }) => getScholarshipReviewStatistics(signal),
    retry: shouldRetryScholarshipReviewQuery,
  });
}

export function useScholarshipReviewList(page: number, pageSize: number) {
  return useQuery({
    queryKey: scholarshipReviewKeys.list(page, pageSize),
    queryFn: ({ signal }) => getScholarshipReviewList(page, pageSize, signal),
    retry: shouldRetryScholarshipReviewQuery,
  });
}

export function useScholarshipReviewDetail(id: number) {
  return useQuery({
    queryKey: scholarshipReviewKeys.detail(id),
    queryFn: ({ signal }) => getScholarshipReviewDetail(id, signal),
    enabled: Number.isInteger(id) && id > 0,
    retry: shouldRetryScholarshipReviewQuery,
  });
}

function useReviewInvalidation() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: scholarshipReviewKeys.all });
}

export function useApproveScholarship() {
  const invalidate = useReviewInvalidation();
  return useMutation({ mutationFn: approveScholarship, onSuccess: invalidate });
}

export function useRejectScholarship() {
  const invalidate = useReviewInvalidation();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectScholarship(id, reason),
    onSuccess: invalidate,
  });
}
