import { MutationObserver, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { saveScholarship, unsaveScholarship } from '../api/scholarships';
import { studentScholarshipKeys } from '../query-keys';
import { isDiscoveryResponse } from './results-state';

export const bookmarkMutationKey = (id: number) =>
  [...studentScholarshipKeys.all, 'bookmark', id] as const;

interface BookmarkVariables {
  save: boolean;
}

// One record per cached entry that holds this card, with the card's previous
// is_saved value. Rollback restores only that value, so changes made meanwhile
// to other cards in the same cached page are kept.
export type BookmarkSnapshot = { queryKey: QueryKey; previous: boolean }[];

const hasCard = (item: unknown, id: number): item is { id: number; is_saved: boolean } =>
  !!item && typeof item === 'object' && (item as { id?: unknown }).id === id;

// Returns new data with this card's is_saved set, or the same data when the card
// is not there or already has that value.
export function withBookmarkState(data: unknown, id: number, isSaved: boolean): unknown {
  if (isDiscoveryResponse(data)) {
    let changed = false;
    const items = data.items.map((item) => {
      if (!hasCard(item, id) || item.is_saved === isSaved) return item;
      changed = true;
      return { ...item, is_saved: isSaved };
    });
    return changed ? { ...data, items } : data;
  }
  if (hasCard(data, id) && data.is_saved !== isSaved) return { ...data, is_saved: isSaved };
  return data;
}

function cardSavedState(data: unknown, id: number): boolean | undefined {
  if (isDiscoveryResponse(data)) {
    const item = data.items.find((entry) => hasCard(entry, id));
    return item && hasCard(item, id) ? item.is_saved : undefined;
  }
  return hasCard(data, id) ? data.is_saved : undefined;
}

// Optimistically set is_saved in every cached discovery page that contains the
// card and in its cached detail; returns the per-entry previous values.
export function applyOptimisticBookmark(
  client: QueryClient,
  id: number,
  isSaved: boolean
): BookmarkSnapshot {
  const entries: [QueryKey, unknown][] = [
    ...client.getQueriesData({ queryKey: studentScholarshipKeys.discoveries() }),
    [studentScholarshipKeys.detail(id), client.getQueryData(studentScholarshipKeys.detail(id))],
  ];
  const snapshot: BookmarkSnapshot = [];
  for (const [queryKey, data] of entries) {
    const previous = cardSavedState(data, id);
    if (previous === undefined) continue;
    snapshot.push({ queryKey, previous });
    client.setQueryData(queryKey, withBookmarkState(data, id, isSaved));
  }
  return snapshot;
}

export function rollbackBookmark(client: QueryClient, id: number, snapshot: BookmarkSnapshot) {
  for (const { queryKey, previous } of snapshot) {
    client.setQueryData(queryKey, (current: unknown) => withBookmarkState(current, id, previous));
  }
}

export function bookmarkMutationOptions(
  client: QueryClient,
  id: number,
  { onError }: { onError?: (error: unknown) => void } = {}
) {
  return {
    mutationKey: bookmarkMutationKey(id),
    mutationFn: ({ save }: BookmarkVariables) =>
      save ? saveScholarship(id) : unsaveScholarship(id),
    onMutate: async ({ save }: BookmarkVariables) => {
      // Stop in-flight fetches from overwriting the optimistic state.
      await Promise.all([
        client.cancelQueries({ queryKey: studentScholarshipKeys.discoveries() }),
        client.cancelQueries({ queryKey: studentScholarshipKeys.detail(id) }),
      ]);
      return applyOptimisticBookmark(client, id, save);
    },
    onError: (
      error: unknown,
      _variables: BookmarkVariables,
      snapshot: BookmarkSnapshot | undefined
    ) => {
      if (snapshot) rollbackBookmark(client, id, snapshot);
      onError?.(error);
    },
    // Only the families that hold saved state; filter options, profile and auth
    // queries are left alone.
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: studentScholarshipKeys.discoveries() }),
        client.invalidateQueries({ queryKey: studentScholarshipKeys.detail(id) }),
        client.invalidateQueries({ queryKey: studentScholarshipKeys.savedLists() }),
      ]),
  };
}

export const isBookmarkPending = (client: QueryClient, id: number) =>
  client.isMutating({ mutationKey: bookmarkMutationKey(id), exact: true }) > 0;

// Starts a save/unsave for the card unless one is already in flight for that ID
// (returns null then). Resolves when the mutation settles; errors are handled by
// rollback plus the onError callback, never thrown to the caller.
export function toggleScholarshipBookmark(
  client: QueryClient,
  id: number,
  isSaved: boolean,
  options: { onError?: (error: unknown) => void } = {}
): Promise<void> | null {
  if (isBookmarkPending(client, id)) return null;
  const observer = new MutationObserver(client, bookmarkMutationOptions(client, id, options));
  return observer.mutate({ save: !isSaved }).then(
    () => undefined,
    () => undefined
  );
}
