'use client';

import { useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { shouldRetryScholarshipQuery } from '@/features/student/scholarship-discovery/lib/query-retry';
import { fetchNotificationPage } from '../adapter/api';
import { mergePages } from '../lib/cache-updates';
import { studentNotificationsKeys } from '../query-keys';

// The notification list, newest first as the server returns it. Every visit starts at page 1
// with a loading state (gcTime 0 drops the loaded pages when the page unmounts), the list is not
// refreshed in the background so cards never move under the student's cursor, and "Load more"
// appends the next page.
export function useNotificationsList() {
  const query = useInfiniteQuery({
    queryKey: studentNotificationsKeys.list(),
    queryFn: ({ pageParam, signal }) => fetchNotificationPage(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: shouldRetryScholarshipQuery,
  });

  const pages = query.data?.pages;
  const items = useMemo(() => mergePages(pages ?? []), [pages]);

  const unknownType = (pages ?? []).reduce((sum, page) => sum + page.skipped.unknownType, 0);
  const malformed = (pages ?? []).reduce((sum, page) => sum + page.skipped.malformed, 0);
  useEffect(() => {
    // Counts only, never values: a skipped item is not an error for the student.
    if (process.env.NODE_ENV !== 'production' && unknownType + malformed > 0) {
      console.warn('[Notifications] skipped items', { unknownType, malformed });
    }
  }, [unknownType, malformed]);

  return { ...query, items };
}
