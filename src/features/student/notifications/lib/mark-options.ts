import type { QueryClient } from '@tanstack/react-query';
import { markAllNotificationsRead, markNotificationRead } from '../adapter/api';
import { studentNotificationsKeys } from '../query-keys';
import {
  adjustCount,
  findNotification,
  markAllInPages,
  markReadInPages,
  removeFromPages,
  restoreUnread,
  type NotificationPages,
  type UnreadCountData,
} from './cache-updates';
import { isNotFound } from './errors';
import { unreadCountQueryKey } from './unread-source';

// The optimistic mutations behind "mark as read" and "Mark all as read", as plain option
// builders so they can be unit-tested with a QueryClient and no React.
//
// Each mutation records only what IT changed, and an error undoes exactly that: another
// pending mark's change, or a count the server already corrected, is left alone.

export interface MarkCallbacks {
  // A mark failed and was rolled back (a 404 is not a failure: the card was already gone).
  onFailed?: () => void;
  // "Mark all as read" succeeded.
  onDone?: () => void;
}

interface MarkContext {
  flippedIds: number[];
  countDelta: number;
}

interface MarkAllContext {
  flippedIds: number[];
  previousCount: number;
}

const listKey = () => studentNotificationsKeys.list();

// Starting a mark cancels a count request in flight: an answer requested before the mark could
// overwrite the optimistic number.
const cancelCount = (queryClient: QueryClient) =>
  queryClient.cancelQueries({ queryKey: unreadCountQueryKey() });

// After the LAST pending mark settles (this one still counts as pending inside onSettled), the
// count is re-requested once to reconcile with the server. A stopped count query is disabled,
// so it is not restarted by this.
function reconcileCount(queryClient: QueryClient) {
  if (queryClient.isMutating({ mutationKey: studentNotificationsKeys.marks() }) > 1) return;
  void queryClient.invalidateQueries({ queryKey: unreadCountQueryKey() });
}

// One request per notification at a time, and none for a notification that is already read.
export function shouldMark(
  queryClient: QueryClient,
  pending: ReadonlySet<number>,
  id: number
): boolean {
  if (pending.has(id)) return false;
  const loaded = findNotification(queryClient.getQueryData<NotificationPages>(listKey()), id);
  return !loaded?.isRead;
}

export function markReadOptions(
  queryClient: QueryClient,
  pending: Set<number>,
  callbacks: MarkCallbacks = {}
) {
  return {
    mutationKey: studentNotificationsKeys.markOne(),
    mutationFn: (id: number) => markNotificationRead(id),
    onMutate: async (id: number): Promise<MarkContext> => {
      await cancelCount(queryClient);
      const { data, flipped } = markReadInPages(
        queryClient.getQueryData<NotificationPages>(listKey()),
        id
      );
      if (flipped) queryClient.setQueryData<NotificationPages>(listKey(), data);
      // The count only moves for a card that really flipped, and only once it has loaded.
      const countLoaded = queryClient.getQueryData<UnreadCountData>(unreadCountQueryKey());
      const countDelta = flipped && countLoaded ? -1 : 0;
      if (countDelta !== 0) {
        queryClient.setQueryData<UnreadCountData>(unreadCountQueryKey(), (count) =>
          adjustCount(count, countDelta)
        );
      }
      return { flippedIds: flipped ? [id] : [], countDelta };
    },
    onError: (error: unknown, id: number, context: MarkContext | undefined) => {
      if (isNotFound(error)) {
        // Already gone (missing, or not the student's): drop the card. No rollback and no
        // message; the reconcile below corrects the count.
        queryClient.setQueryData<NotificationPages>(listKey(), (data) => removeFromPages(data, id));
        return;
      }
      if (context) {
        queryClient.setQueryData<NotificationPages>(listKey(), (data) =>
          restoreUnread(data, context.flippedIds)
        );
        if (context.countDelta !== 0) {
          queryClient.setQueryData<UnreadCountData>(unreadCountQueryKey(), (count) =>
            adjustCount(count, -context.countDelta)
          );
        }
      }
      callbacks.onFailed?.();
    },
    onSettled: (_data: unknown, _error: unknown, id: number) => {
      pending.delete(id);
      reconcileCount(queryClient);
    },
  };
}

export function markAllOptions(queryClient: QueryClient, callbacks: MarkCallbacks = {}) {
  return {
    mutationKey: studentNotificationsKeys.markAll(),
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async (): Promise<MarkAllContext> => {
      await cancelCount(queryClient);
      const { data, flippedIds } = markAllInPages(
        queryClient.getQueryData<NotificationPages>(listKey())
      );
      if (flippedIds.length > 0) queryClient.setQueryData<NotificationPages>(listKey(), data);
      const before = queryClient.getQueryData<UnreadCountData>(unreadCountQueryKey());
      if (before) {
        queryClient.setQueryData<UnreadCountData>(unreadCountQueryKey(), { unreadCount: 0 });
      }
      return { flippedIds, previousCount: before?.unreadCount ?? 0 };
    },
    onError: (_error: unknown, _variables: void, context: MarkAllContext | undefined) => {
      if (context) {
        queryClient.setQueryData<NotificationPages>(listKey(), (data) =>
          restoreUnread(data, context.flippedIds)
        );
        if (context.previousCount > 0) {
          queryClient.setQueryData<UnreadCountData>(unreadCountQueryKey(), (count) =>
            adjustCount(count, context.previousCount)
          );
        }
      }
      callbacks.onFailed?.();
    },
    onSuccess: () => callbacks.onDone?.(),
    onSettled: () => reconcileCount(queryClient),
  };
}
