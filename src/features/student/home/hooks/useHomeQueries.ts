'use client';

import { useQuery } from '@tanstack/react-query';
import { shouldRetryScholarshipQuery } from '@/features/student/scholarship-discovery/lib/query-retry';
import { getProfileCompletion } from '../api/profile-completion';
import { studentHomeKeys } from '../query-keys';

// Real backend data only; these sections are never mocked.
export const useProfileCompletionQuery = () =>
  useQuery({
    queryKey: studentHomeKeys.profileCompletion(),
    queryFn: ({ signal }) => getProfileCompletion(signal),
    retry: shouldRetryScholarshipQuery,
  });
