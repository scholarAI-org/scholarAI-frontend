import { apiClient } from '@/lib/api-client';
import { TRACKING_STATUSES } from '@/features/student/application-tracking/constants';
import { TrackingValidationError } from '@/features/student/application-tracking/lib/errors';
import type { TrackingStatus } from '@/features/student/application-tracking/types';
import { parseScholarshipTracking, type ScholarshipTracking } from '../lib/tracking-adapter';

function assertScholarshipId(id: number) {
  // Path parameter: integer, exclusiveMinimum 0, maximum 2147483647.
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
    throw new TrackingValidationError('invalid-id');
  }
}

// GET /api/scholarships/{id}/tracking: null status when the student does not
// track it. The backend answers 404 only when the scholarship does not exist.
export async function getScholarshipTracking(
  id: number,
  signal?: AbortSignal
): Promise<ScholarshipTracking> {
  assertScholarshipId(id);
  const raw = await apiClient<unknown>(`/api/scholarships/${id}/tracking`, { signal });
  return parseScholarshipTracking(raw);
}

// PUT /api/scholarships/{id}/tracking: creates or updates; 200 for both. A
// bookmark is not required.
export async function putScholarshipTracking(
  id: number,
  status: TrackingStatus
): Promise<ScholarshipTracking> {
  assertScholarshipId(id);
  if (!(TRACKING_STATUSES as readonly string[]).includes(status)) {
    throw new TrackingValidationError('invalid-status');
  }
  const raw = await apiClient<unknown>(`/api/scholarships/${id}/tracking`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return parseScholarshipTracking(raw);
}
