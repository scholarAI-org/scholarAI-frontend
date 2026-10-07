'use client';
import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { currentUserQueryKey } from '@/features/auth/hooks/useCurrentUser';
import { ApiError } from '@/lib/api-client';
import { bookmarkMutationKey, toggleScholarshipBookmark } from '../lib/bookmark-cache';

// Save/unsave for one card. The saved state comes from the (optimistically
// updated) query cache; nothing is stored in localStorage.
export function useScholarshipBookmark(id: number, isSaved: boolean) {
  const client = useQueryClient();
  const [failed, setFailed] = useState(false);
  const pending = useIsMutating({ mutationKey: bookmarkMutationKey(id), exact: true }) > 0;

  function toggle() {
    // A second click while the request is in flight is ignored.
    const started = toggleScholarshipBookmark(client, id, isSaved, {
      onError: (error) => {
        setFailed(true);
        // 401: let the existing AuthProvider re-check the session (RoleGuard redirects).
        if (error instanceof ApiError && error.status === 401) {
          void client.invalidateQueries({ queryKey: currentUserQueryKey });
        }
      },
    });
    if (started) setFailed(false);
  }

  return { pending, failed, toggle };
}
