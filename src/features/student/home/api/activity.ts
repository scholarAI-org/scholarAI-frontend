import { apiClient } from '@/lib/api-client';
import { ACTIVITY_LIST_LIMIT } from '../constants';
import { parseActivityFeed, type ActivityItem } from '../schemas/activity.schema';

// REQUESTED endpoint (backend ask: student activity feed). Unreachable until
// HOME_API_AVAILABILITY.activity is set to true.
export async function getRecentActivity(signal?: AbortSignal): Promise<ActivityItem[]> {
  return parseActivityFeed(
    await apiClient<unknown>(`/api/activity?limit=${ACTIVITY_LIST_LIMIT}`, { signal })
  );
}
