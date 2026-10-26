import type { TrackedList, TrackingStatus } from '../types';

// Optimistic overlay: scholarships whose start request is in flight (id -> status).
export type StartedMap = Readonly<Record<number, TrackingStatus>>;

export const markStarted = (
  started: StartedMap,
  scholarshipId: number,
  status: TrackingStatus
): StartedMap => ({ ...started, [scholarshipId]: status });

export function unmarkStarted(started: StartedMap, scholarshipId: number): StartedMap {
  const rest = { ...started };
  delete rest[scholarshipId];
  return rest;
}

export type StartState =
  | { kind: 'unknown' }
  | { kind: 'untracked' }
  | { kind: 'tracked'; status: TrackingStatus; pending: boolean };

// What a scholarship's "Track application" control should show. The real row wins;
// otherwise a start in flight shows as tracked at once (optimistic); otherwise it is
// untracked, but only once the tracked list is known. Until then nothing is offered.
export function selectStartState(
  list: TrackedList | undefined,
  started: StartedMap,
  scholarshipId: number
): StartState {
  const row = list?.items.find((item) => item.scholarship.id === scholarshipId);
  if (row) return { kind: 'tracked', status: row.status, pending: false };
  const pendingStatus = started[scholarshipId];
  if (pendingStatus) return { kind: 'tracked', status: pendingStatus, pending: true };
  return list ? { kind: 'untracked' } : { kind: 'unknown' };
}
