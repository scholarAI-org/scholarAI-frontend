import type { TrackedItem, TrackingStatus } from '../types';

// Status filter driven by the status cards. `null` means no filter.
export function filterByStatus(
  items: readonly TrackedItem[],
  status: TrackingStatus | null
): readonly TrackedItem[] {
  return status === null ? items : items.filter((item) => item.status === status);
}

// Tapping the active card clears the filter; tapping another card switches to it.
export const toggleFilter = (
  current: TrackingStatus | null,
  next: TrackingStatus
): TrackingStatus | null => (current === next ? null : next);
