'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markReadOptions, shouldMark, type MarkCallbacks } from '../lib/mark-options';

// Marks one notification as read, optimistically (see lib/mark-options.ts). The callbacks are
// bound when a mark starts, so a failure still reports when several marks overlap or after the
// card's action has already navigated away. Pass stable callbacks (state setters).
export function useMarkRead(callbacks: MarkCallbacks = {}) {
  const queryClient = useQueryClient();
  // Ids with a request in flight: one request per notification at a time.
  const [pending] = useState(() => new Set<number>());

  const { mutate } = useMutation(markReadOptions(queryClient, pending, callbacks));

  // Nothing is sent for a notification that is already read or already being marked.
  return useCallback(
    (id: number) => {
      if (!shouldMark(queryClient, pending, id)) return;
      pending.add(id);
      mutate(id);
    },
    [queryClient, pending, mutate]
  );
}
