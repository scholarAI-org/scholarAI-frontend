'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { loginPathWithNext } from '@/features/auth/lib/post-login-path';
import { usePathname, useRouter } from '@/i18n/navigation';
import { confirmSession } from '../lib/session-check';

// Re-checks the session with GET /auth/me through the existing current-user query.
//
// When the session is gone this does what RoleGuard and useLogout do between them: drop the
// cached session data and send the student to login with the page to come back to.
// `invalidateQueries` alone would not do it, because AuthProvider keeps the last good user
// while a refetch fails, so RoleGuard would never see "unauthenticated".
export function useSessionCheck() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { refetch } = useCurrentUser();

  return useCallback(
    () =>
      confirmSession(
        () => refetch(),
        () => {
          queryClient.clear();
          router.replace(loginPathWithNext(`${pathname}${window.location.search}`));
        }
      ),
    [refetch, queryClient, router, pathname]
  );
}
