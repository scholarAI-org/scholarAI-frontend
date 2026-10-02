'use client';
import { useQuery } from '@tanstack/react-query';
import { getScholarship } from '../api/scholarships';
import { shouldRetryScholarshipQuery } from '../lib/query-retry';
import { studentScholarshipKeys } from '../query-keys';
export const useScholarshipDetail = (id: number) =>
  useQuery({
    queryKey: studentScholarshipKeys.detail(id),
    queryFn: ({ signal }) => getScholarship(id, signal),
    enabled: Number.isInteger(id) && id > 0,
    retry: shouldRetryScholarshipQuery,
  });
