'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { currentUserQueryKey } from '@/features/auth/hooks/useCurrentUser';
import {
  classifyTrackingError,
  shouldRetryTrackingQuery,
} from '@/features/student/application-tracking/lib/errors';
import { trackingKeys } from '@/features/student/application-tracking/query-keys';
import type { TrackingStatus } from '@/features/student/application-tracking/types';
import { getScholarshipTracking, putScholarshipTracking } from '../api/tracking';
import { scholarshipExtrasKeys } from '../query-keys';

// This student's tracking status for one scholarship (null: not tracked).
export function useScholarshipTracking(id: number) {
  return useQuery({
    queryKey: scholarshipExtrasKeys.tracking(id),
    queryFn: ({ signal }) => getScholarshipTracking(id, signal),
    retry: shouldRetryTrackingQuery,
  });
}

// Start tracking or change the status. The response is the new truth, so it is
// written to the cache directly; the tracking page list is refetched on next use.
export function useSetScholarshipTracking(id: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (status: TrackingStatus) => putScholarshipTracking(id, status),
    onSuccess: (result) => {
      client.setQueryData(scholarshipExtrasKeys.tracking(id), result);
      void client.invalidateQueries({ queryKey: trackingKeys.list() });
    },
    onError: (error) => {
      // 401: let the existing AuthProvider re-check the session (RoleGuard redirects).
      if (classifyTrackingError(error) === 'auth') {
        void client.invalidateQueries({ queryKey: currentUserQueryKey });
      }
    },
  });
}
