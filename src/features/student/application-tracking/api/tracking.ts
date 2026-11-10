import { apiClient } from '@/lib/api-client';
import { DEFAULT_START_STATUS, NOTE_MAX_LENGTH, TRACKING_STATUSES } from '../constants';
import {
  parseNoteResponse,
  parseRemoveResponse,
  parseStartResponse,
  parseStatusResponse,
  parseTrackedList,
} from '../lib/adapter';
import { TrackingValidationError } from '../lib/errors';
import type {
  RemoveTrackingResult,
  StartTrackingResult,
  TrackedList,
  TrackingNoteResult,
  TrackingStatus,
  TrackingStatusResult,
} from '../types';

const ROOT = '/api/scholarships/tracked';

function assertTrackingId(id: number) {
  // ApplicationStatusUpdate path: integer, exclusiveMinimum 0, maximum 2147483647.
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
    throw new TrackingValidationError('invalid-id');
  }
}

const countCodePoints = (text: string) => [...text].length;

// GET /api/scholarships/tracked: the page's single data source. No query: the
// page groups and counts locally. Never GET /tracked/statistics.
export async function getTrackedList(signal?: AbortSignal): Promise<TrackedList> {
  const raw = await apiClient<unknown>(ROOT, { signal });
  return parseTrackedList(raw);
}

// PATCH /api/scholarships/tracked/{tracking_id}/status. Only the six backend
// statuses are valid; the UI-only `saved` card can never reach here.
export async function updateTrackingStatus(
  trackingId: number,
  status: TrackingStatus
): Promise<TrackingStatusResult> {
  assertTrackingId(trackingId);
  if (!(TRACKING_STATUSES as readonly string[]).includes(status)) {
    throw new TrackingValidationError('invalid-status');
  }
  const raw = await apiClient<unknown>(`${ROOT}/${trackingId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return parseStatusResponse(raw);
}

// PUT /api/scholarships/tracked/{tracking_id}/note. A blank note is sent as ''
// (the backend clears on '' or null). The 2000 limit counts code points.
export async function saveTrackingNote(
  trackingId: number,
  notes: string
): Promise<TrackingNoteResult> {
  assertTrackingId(trackingId);
  if (countCodePoints(notes) > NOTE_MAX_LENGTH) throw new TrackingValidationError('note-too-long');
  const raw = await apiClient<unknown>(`${ROOT}/${trackingId}/note`, {
    method: 'PUT',
    body: JSON.stringify({ notes: notes.trim() === '' ? '' : notes }),
  });
  return parseNoteResponse(raw);
}

// DELETE /api/scholarships/tracked/{tracking_id}. Removes the application and
// its note; the listing and the bookmark are untouched.
export async function removeTracking(trackingId: number): Promise<RemoveTrackingResult> {
  assertTrackingId(trackingId);
  const raw = await apiClient<unknown>(`${ROOT}/${trackingId}`, { method: 'DELETE' });
  return parseRemoveResponse(raw);
}

// PUT /api/scholarships/{id}/tracking (BE-02): starts tracking a scholarship and
// answers { status, updated_at }. It creates the row, so it must only be sent for a
// scholarship that is not tracked yet (the caller checks the fresh list first).
// Errors: 404 scholarship not found, 403 non-student, 422 invalid, all read by status.
export async function startTracking(
  scholarshipId: number,
  status: TrackingStatus = DEFAULT_START_STATUS
): Promise<StartTrackingResult> {
  if (!Number.isSafeInteger(scholarshipId) || scholarshipId <= 0) {
    throw new TrackingValidationError('invalid-id');
  }
  if (!(TRACKING_STATUSES as readonly string[]).includes(status)) {
    throw new TrackingValidationError('invalid-status');
  }
  const raw = await apiClient<unknown>(`/api/scholarships/${scholarshipId}/tracking`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return parseStartResponse(raw);
}
