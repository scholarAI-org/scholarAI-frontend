import { URGENCY_SOON_MAX, URGENCY_URGENT_MAX } from '../constants';

export type DeadlineUrgency = 'urgent' | 'soon' | 'comfortable';

// 0-7 days red, 8-14 amber, the rest of the window green (FR-024).
export function urgencyFor(daysLeft: number): DeadlineUrgency {
  if (daysLeft <= URGENCY_URGENT_MAX) return 'urgent';
  if (daysLeft <= URGENCY_SOON_MAX) return 'soon';
  return 'comfortable';
}
