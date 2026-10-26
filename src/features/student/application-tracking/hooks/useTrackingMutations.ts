'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  noteMutationOptions,
  removeMutationOptions,
  statusMutationOptions,
} from '../lib/mutations';

// Row actions with optimistic updates and rollback. The logic lives in
// lib/mutations so it is testable without React.

export function useUpdateTrackingStatus() {
  const client = useQueryClient();
  return useMutation(statusMutationOptions(client));
}

export function useSaveTrackingNote() {
  const client = useQueryClient();
  return useMutation(noteMutationOptions(client));
}

export function useRemoveTracking() {
  const client = useQueryClient();
  return useMutation(removeMutationOptions(client));
}
