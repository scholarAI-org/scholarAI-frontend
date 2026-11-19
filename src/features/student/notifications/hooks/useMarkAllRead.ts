'use client';

import { useCallback } from 'react';
import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { markAllOptions, type MarkCallbacks } from '../lib/mark-options';
import { studentNotificationsKeys } from '../query-keys';

// "Mark all as read", optimistically (see lib/mark-options.ts). One request per press. Pass
// stable callbacks (state setters): they are bound when the request starts.
export function useMarkAllRead(callbacks: MarkCallbacks = {}) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation(markAllOptions(queryClient, callbacks));
  const isPending = useIsMutating({ mutationKey: studentNotificationsKeys.markAll() }) > 0;

  const markAll = useCallback(() => {
    if (!isPending) mutate();
  }, [isPending, mutate]);

  return { markAll, isPending };
}
