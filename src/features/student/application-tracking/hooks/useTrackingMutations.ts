'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeTracking, saveTrackingNote, updateTrackingStatus } from '../api/tracking';
import { trackingKeys } from '../query-keys';
import type { TrackingStatus } from '../types';

// Row actions. Each refetches the list when it settles so the cache converges on
// the backend. Optimistic updates and rollback are layered on in the page phase.
function useInvalidateList() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: trackingKeys.list() });
}

export function useUpdateTrackingStatus() {
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: (vars: { trackingId: number; status: TrackingStatus }) =>
      updateTrackingStatus(vars.trackingId, vars.status),
    onSettled: invalidate,
  });
}

export function useSaveTrackingNote() {
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: (vars: { trackingId: number; notes: string }) =>
      saveTrackingNote(vars.trackingId, vars.notes),
    onSettled: invalidate,
  });
}

export function useRemoveTracking() {
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: (vars: { trackingId: number }) => removeTracking(vars.trackingId),
    onSettled: invalidate,
  });
}
