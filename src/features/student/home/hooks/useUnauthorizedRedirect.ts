'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { currentUserQueryKey } from '@/features/auth/hooks/useCurrentUser';
import { shouldInvalidateSession, type QueryLike } from '../lib/section-state';

// A 401 from any Home request re-checks the session through the existing current-user
// query. AuthProvider then sees "not authenticated" and RoleGuard sends the student to
// login with a return path. Home keeps its own session state out of it.
export function useUnauthorizedRedirect(queries: readonly QueryLike[]) {
  const queryClient = useQueryClient();
  const requested = useRef(false);
  const unauthorized = shouldInvalidateSession(queries);

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
