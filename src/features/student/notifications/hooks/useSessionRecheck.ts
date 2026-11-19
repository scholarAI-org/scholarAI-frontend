'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { currentUserQueryKey } from '@/features/auth/hooks/useCurrentUser';
import { isUnauthorized } from '../lib/page-view';

// A 401 from a notification request re-checks the session through the existing current-user
// query (the Home pattern): if the session is gone, AuthProvider and RoleGuard send the student
// to login with a return path. This feature keeps no session state of its own.
export function useSessionRecheck(error: unknown) {
  const queryClient = useQueryClient();
  const requested = useRef(false);
  const unauthorized = isUnauthorized(error);

  useEffect(() => {
    if (!unauthorized) {
      requested.current = false;
      return;
    }
    if (requested.current) return;
    requested.current = true;
    void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
  }, [unauthorized, queryClient]);
}
