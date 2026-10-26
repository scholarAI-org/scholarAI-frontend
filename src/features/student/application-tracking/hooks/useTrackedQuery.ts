'use client';

import { useQuery } from '@tanstack/react-query';
import { getTrackedList } from '../api/tracking';
import { shouldRetryTrackingQuery } from '../lib/errors';
import { trackingKeys } from '../query-keys';

// The single data source for the page: GET /api/scholarships/tracked.
// A contract error surfaces as an error state, never as an empty list.
export function useTrackedQuery() {
  return useQuery({
    queryKey: trackingKeys.list(),
    queryFn: ({ signal }) => getTrackedList(signal),
    retry: shouldRetryTrackingQuery,
  });
}
