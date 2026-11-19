'use client';

import { useEffect } from 'react';
import { useIsMutating, useQuery, useQueryClient } from '@tanstack/react-query';
import { unreadDriverOptions } from '../lib/driver-options';
import { isTerminalStatus, shouldFocusRefetch } from '../lib/polling';
import { unreadCountQueryKey, useUnreadSource, type MockSections } from '../lib/unread-source';
import { studentNotificationsKeys } from '../query-keys';
import { useSessionRecheck } from './useSessionRecheck';

interface UnreadCountDriverInput {
  notificationsEnabled: boolean;
  mockSections?: MockSections;
}

// THE poller of the unread count: mounted once (NotificationsCountDriver, inside RoleGuard, so it
// starts only for a signed-in student). TanStack runs refetchInterval per observer, so several
// observers with an interval would each fire at their own phase; every other reader of the count
// (badge, bells, Home's card) is passive and only follows the shared query.
//
// The rules (60 s while visible, nothing while hidden, again on return, stop on 401/403/404, wait
// while a mark is pending) are in lib/driver-options.ts. A 401 also re-checks the session through
// the current-user query.
export function useUnreadCountDriver({
  notificationsEnabled,
  mockSections = [],
}: UnreadCountDriverInput) {
  const queryClient = useQueryClient();
  const source = useUnreadSource({ notificationsEnabled, mockSections });
  const marking = useIsMutating({ mutationKey: studentNotificationsKeys.marks() }) > 0;

  const query = useQuery(unreadDriverOptions(source, marking));

  // TanStack's focus manager listens to visibility changes only; a window that regains focus
  // without having been hidden (another window was on top) refetches too. A visibility change and
  // a focus event in the same moment make one request: a fetch in flight is not duplicated.
  useEffect(() => {
    const key = unreadCountQueryKey();
    const onFocus = () => {
      const state = queryClient.getQueryState(key);
      if (!shouldFocusRefetch({ terminal: isTerminalStatus(state?.error), marking })) return;
      void queryClient.refetchQueries({ queryKey: key, type: 'active' }, { cancelRefetch: false });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [queryClient, marking]);

  useSessionRecheck(query.error);
  return query;
}
