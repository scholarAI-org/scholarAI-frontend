import type { QueryClient } from '@tanstack/react-query';
import { currentUserQueryKey } from '@/features/auth/hooks/useCurrentUser';
import {
  getTrackedList,
  removeTracking,
  saveTrackingNote,
  startTracking,
  updateTrackingStatus,
} from '../api/tracking';
import { DEFAULT_START_STATUS } from '../constants';
import { trackingKeys } from '../query-keys';
import type { RemoveTrackingResult, TrackedList, TrackingStatus } from '../types';
import {
  normalizeNotes,
  removeItem,
  restoreItem,
  rollbackNotes,
  rollbackStatus,
  setItemNotes,
  setItemStatus,
  type RemovedItem,
} from './cache';
import { classifyTrackingError } from './errors';
import { markStarted, unmarkStarted, type StartedMap } from './start-state';

// Mutation options for the row actions, as plain objects so the optimistic and
// rollback logic can be tested without React. Every action:
//  - cancels in-flight list fetches so they cannot overwrite the optimistic value,
//  - applies the change to the cached list,
//  - on error undoes only its own change (exact position for a removal),
//  - refetches once the LAST pending action settles, so the cache converges on the
//    backend without a refetch landing in the middle of another action.

export const trackingMutationKey = [...trackingKeys.all, 'mutation'] as const;

const read = (client: QueryClient) => client.getQueryData<TrackedList>(trackingKeys.list());
const write = (client: QueryClient, change: (list: TrackedList) => TrackedList) =>
  client.setQueryData<TrackedList>(trackingKeys.list(), (list) => (list ? change(list) : list));

function settle(client: QueryClient) {
  if (client.isMutating({ mutationKey: trackingMutationKey }) <= 1) {
    return client.invalidateQueries({ queryKey: trackingKeys.list() });
  }
}

// 401: let the existing AuthProvider re-check the session (RoleGuard redirects).
function handleSession(client: QueryClient, error: unknown) {
  if (classifyTrackingError(error) === 'auth') {
    void client.invalidateQueries({ queryKey: currentUserQueryKey });
  }
}

// 404 on a row action means the row is gone: drop it instead of restoring it.
const isGone = (error: unknown) => classifyTrackingError(error) === 'not-found';

export const statusMutationOptions = (client: QueryClient) => ({
  mutationKey: trackingMutationKey,
  mutationFn: (vars: { trackingId: number; status: TrackingStatus }) =>
    updateTrackingStatus(vars.trackingId, vars.status),
  onMutate: async (vars: { trackingId: number; status: TrackingStatus }) => {
    await client.cancelQueries({ queryKey: trackingKeys.list() });
    const previous = read(client)?.items.find((item) => item.id === vars.trackingId)?.status;
    write(client, (list) => setItemStatus(list, vars.trackingId, vars.status));
    return { previous };
  },
  onError: (
    error: unknown,
    vars: { trackingId: number; status: TrackingStatus },
    context: { previous?: TrackingStatus } | undefined
  ) => {
    if (isGone(error)) write(client, (list) => removeItem(list, vars.trackingId).list);
    else if (context?.previous) {
      const previous = context.previous;
      write(client, (list) => rollbackStatus(list, vars.trackingId, vars.status, previous));
    }
    handleSession(client, error);
  },
  onSettled: () => settle(client),
});

export const noteMutationOptions = (client: QueryClient) => ({
  mutationKey: trackingMutationKey,
  mutationFn: (vars: { trackingId: number; notes: string }) =>
    saveTrackingNote(vars.trackingId, vars.notes),
  onMutate: async (vars: { trackingId: number; notes: string }) => {
    await client.cancelQueries({ queryKey: trackingKeys.list() });
    const item = read(client)?.items.find((entry) => entry.id === vars.trackingId);
    write(client, (list) => setItemNotes(list, vars.trackingId, normalizeNotes(vars.notes)));
    return { found: Boolean(item), previous: item?.notes ?? null };
  },
  onError: (
    error: unknown,
    vars: { trackingId: number; notes: string },
    context: { found: boolean; previous: string | null } | undefined
  ) => {
    if (isGone(error)) write(client, (list) => removeItem(list, vars.trackingId).list);
    else if (context?.found) {
      const previous = context.previous;
      write(client, (list) =>
        rollbackNotes(list, vars.trackingId, normalizeNotes(vars.notes), previous)
      );
    }
    handleSession(client, error);
  },
  onSettled: () => settle(client),
});

// DELETE answering 404 means the row was already gone, which is what the student
// asked for: it counts as success and the row stays removed.
async function removeOrAlreadyGone(trackingId: number): Promise<RemoveTrackingResult> {
  try {
    return await removeTracking(trackingId);
  } catch (error) {
    if (isGone(error)) return { scholarshipId: null, isTracked: false, isSaved: null };
    throw error;
  }
}

export const removeMutationOptions = (client: QueryClient) => ({
  mutationKey: trackingMutationKey,
  mutationFn: (vars: { trackingId: number }) => removeOrAlreadyGone(vars.trackingId),
  onMutate: async (vars: { trackingId: number }) => {
    await client.cancelQueries({ queryKey: trackingKeys.list() });
    let removed: RemovedItem | null = null;
    write(client, (list) => {
      const result = removeItem(list, vars.trackingId);
      removed = result.removed;
      return result.list;
    });
    return { removed: removed as RemovedItem | null };
  },
  onError: (
    error: unknown,
    _vars: { trackingId: number },
    context: { removed: RemovedItem | null } | undefined
  ) => {
    const removed = context?.removed;
    if (removed) write(client, (list) => restoreItem(list, removed));
    handleSession(client, error);
  },
  onSettled: () => settle(client),
});

// ---- Start tracking (BE-02) ----------------------------------------------------

const readStarted = (client: QueryClient) =>
  client.getQueryData<StartedMap>(trackingKeys.started()) ?? {};
const writeStarted = (client: QueryClient, change: (started: StartedMap) => StartedMap) =>
  client.setQueryData<StartedMap>(trackingKeys.started(), change(readStarted(client)));

// PUT creates the row, and on an existing one it would reset its status. This tab's
// list can be stale (another tab or device), so re-read the list first and never
// send the PUT for a scholarship that is already tracked. A failing re-read fails
// the start instead of risking an overwrite.
async function startIfNew(client: QueryClient, scholarshipId: number) {
  const list = await client.fetchQuery({
    queryKey: trackingKeys.list(),
    queryFn: ({ signal }) => getTrackedList(signal),
    staleTime: 0,
  });
  const existing = list.items.find((item) => item.scholarship.id === scholarshipId);
  if (existing) return { status: existing.status, updatedAt: existing.updatedAt };
  return startTracking(scholarshipId, DEFAULT_START_STATUS);
}

// Optimistic: the control flips to "Tracking" at once (overlay), a failure removes
// only this scholarship's overlay, and a success refetches the list and then drops
// the overlay so the real row (with its tracking id) takes over.
export const startMutationOptions = (client: QueryClient) => ({
  mutationKey: [...trackingMutationKey, 'start'] as const,
  mutationFn: (vars: { scholarshipId: number }) => startIfNew(client, vars.scholarshipId),
  onMutate: async (vars: { scholarshipId: number }) => {
    writeStarted(client, (started) =>
      markStarted(started, vars.scholarshipId, DEFAULT_START_STATUS)
    );
  },
  onError: (error: unknown, vars: { scholarshipId: number }) => {
    writeStarted(client, (started) => unmarkStarted(started, vars.scholarshipId));
    handleSession(client, error);
  },
  onSuccess: async (_result: unknown, vars: { scholarshipId: number }) => {
    await client.invalidateQueries({ queryKey: trackingKeys.list() });
    writeStarted(client, (started) => unmarkStarted(started, vars.scholarshipId));
  },
});
