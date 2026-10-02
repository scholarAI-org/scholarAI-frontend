'use client';
import { useQuery } from '@tanstack/react-query';
import { getScholarshipFilterOptions } from '../api/scholarships';
import { shouldRetryScholarshipQuery } from '../lib/query-retry';
import { studentScholarshipKeys } from '../query-keys';
export const FILTER_OPTIONS_STALE_TIME = 1000 * 60 * 30;
export const useScholarshipFilterOptions = () =>
  useQuery({
    queryKey: studentScholarshipKeys.filterOptions(),
    queryFn: ({ signal }) => getScholarshipFilterOptions(signal),
    staleTime: FILTER_OPTIONS_STALE_TIME,
    retry: shouldRetryScholarshipQuery,
  });
