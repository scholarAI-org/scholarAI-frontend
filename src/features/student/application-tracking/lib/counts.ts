import { TRACKING_STATUSES } from '../constants';
import type { TrackedItem, TrackingCounts } from '../types';

// Counts come from the real list, so they follow optimistic cache changes.
// Never from GET /tracked/statistics (that one counts saved items, expired ones included).
export function countByStatus(items: readonly TrackedItem[]): TrackingCounts {
  const counts = Object.fromEntries(
    TRACKING_STATUSES.map((status) => [status, 0])
  ) as TrackingCounts;
  for (const item of items) counts[item.status] += 1;
  return counts;
}
