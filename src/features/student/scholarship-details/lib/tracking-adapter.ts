import type { TrackingStatus } from '@/features/student/application-tracking/types';
import { TrackingContractError } from '@/features/student/application-tracking/lib/errors';
import { scholarshipTrackingSchema } from '../schemas/tracking.schema';

export interface ScholarshipTracking {
  // null: the scholarship exists but is not tracked.
  status: TrackingStatus | null;
  updatedAt?: string;
}

// The single entry point for the per-scholarship tracking response.
export function parseScholarshipTracking(raw: unknown): ScholarshipTracking {
  const result = scholarshipTrackingSchema.safeParse(raw);
  if (!result.success) throw new TrackingContractError('bad-response');
  const { status, updated_at: updatedAt } = result.data;
  return updatedAt ? { status, updatedAt } : { status };
}
