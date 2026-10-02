'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getScholarships } from '../api/scholarships';
import { normalizeDiscoveryQuery } from '../lib/discovery-query-state';
import { shouldRetryScholarshipQuery } from '../lib/query-retry';
import { studentScholarshipKeys } from '../query-keys';
import type { DiscoveryQuery } from '../types';
export function useScholarshipDiscovery(query: DiscoveryQuery) {
  // Guard: never key or request an unnormalized query or a non-positive page.
  const safeQuery = normalizeDiscoveryQuery(query);
  return useQuery({
    queryKey: studentScholarshipKeys.discovery(safeQuery),
    queryFn: ({ signal }) => getScholarships(safeQuery, signal),
    placeholderData: keepPreviousData,
    retry: shouldRetryScholarshipQuery,
  });
}
