import { apiClient } from '@/lib/api-client';
import {
  parseTrackedApplications,
  type TrackedApplication,
} from '../schemas/tracked-application.schema';

// GET /api/scholarships/tracked: all statuses, newest first, validated.
export async function getTrackedApplications(signal?: AbortSignal): Promise<TrackedApplication[]> {
  return parseTrackedApplications(
    await apiClient<unknown>('/api/scholarships/tracked', { signal })
  );
}
