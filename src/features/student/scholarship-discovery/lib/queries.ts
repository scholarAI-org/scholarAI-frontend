import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getScholarshipFilterOptions, getScholarships } from '../api/scholarships';
import { studentScholarshipKeys } from '../query-keys';
import type { DiscoveryQuery } from '../types';
import { normalizeDiscoveryQuery } from './discovery-query-state';
import { shouldRetryScholarshipQuery } from './query-retry';

export const FILTER_OPTIONS_STALE_TIME = 1000 * 60 * 30;

// Query options take only backend-affecting state. Presentation state such as
// Grid/List is never an input, so it can never change a key or trigger a fetch.
export function discoveryQueryOptions(query: DiscoveryQuery) {
  // Guard: never key or request an unnormalized query or a non-positive page.
  const safeQuery = normalizeDiscoveryQuery(query);
  return queryOptions({
    queryKey: studentScholarshipKeys.discovery(safeQuery),
    queryFn: ({ signal }) => getScholarships(safeQuery, signal),
    placeholderData: keepPreviousData,
    retry: shouldRetryScholarshipQuery,
  });
}

export const filterOptionsQueryOptions = () =>
  queryOptions({
    queryKey: studentScholarshipKeys.filterOptions(),
    queryFn: ({ signal }) => getScholarshipFilterOptions(signal),
    staleTime: FILTER_OPTIONS_STALE_TIME,
    retry: shouldRetryScholarshipQuery,
  });
