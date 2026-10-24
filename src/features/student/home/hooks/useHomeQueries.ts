'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { defaultDiscoveryQuery } from '@/features/student/scholarship-discovery/constants';
import { discoveryQueryOptions } from '@/features/student/scholarship-discovery/lib/queries';
import { shouldRetryScholarshipQuery } from '@/features/student/scholarship-discovery/lib/query-retry';
import { useSavedScholarshipsQuery } from '@/features/student/saved-scholarships/hooks/useSavedScholarshipsQuery';
import { RECOMMENDATIONS_LIST_LIMIT } from '../constants';
import { getProfileCompletion } from '../api/profile-completion';
import { getTrackedApplications } from '../api/tracked-applications';
import { buildHomeSummary } from '../lib/home-summary';
import { studentHomeKeys } from '../query-keys';

// Real backend data only; these sections are never mocked.
export const useProfileCompletionQuery = () =>
  useQuery({
    queryKey: studentHomeKeys.profileCompletion(),
    queryFn: ({ signal }) => getProfileCompletion(signal),
    retry: shouldRetryScholarshipQuery,
  });

export const useTrackedQuery = () =>
  useQuery({
    queryKey: studentHomeKeys.tracked(),
    queryFn: ({ signal }) => getTrackedApplications(signal),
    retry: shouldRetryScholarshipQuery,
  });

// The newest published scholarships: the Discovery default view (same cache entry),
// fetched only once the recommendations panel is unlocked.
export const useLatestScholarshipsQuery = (enabled: boolean) =>
  useQuery({
    ...discoveryQueryOptions(defaultDiscoveryQuery),
    enabled,
    select: (response) => response.items.slice(0, RECOMMENDATIONS_LIST_LIMIT),
  });

// Saved list is shared with the Saved page (same key), tracked is Home's own.
export function useHomeSummary(now: Date | null) {
  const saved = useSavedScholarshipsQuery();
  const tracked = useTrackedQuery();

  const summary = useMemo(
    () => buildHomeSummary({ saved, tracked, now }),
    // Query result objects change identity every render; their data/status do not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saved.status, saved.data, saved.error, tracked.status, tracked.data, tracked.error, now]
  );
  return { summary, saved, tracked };
}
