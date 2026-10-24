// Product defaults for the Student Home page (spec FR-015, FR-022, FR-024, FR-025, FR-028, FR-031).

// Deadlines count as "upcoming" from today up to and including this many days ahead.
export const UPCOMING_WINDOW_DAYS = 30;
// Urgency badge: 0..URGENT_MAX is urgent, ..SOON_MAX is soon, the rest of the window is comfortable.
export const URGENCY_URGENT_MAX = 7;
export const URGENCY_SOON_MAX = 14;

export const DEADLINE_LIST_LIMIT = 3;
export const ACTIVITY_LIST_LIMIT = 4;
export const RECOMMENDATIONS_LIST_LIMIT = 3;

// Recommendations stay locked below this profile completion percentage.
export const RECOMMENDATIONS_UNLOCK_PERCENT = 70;

// Tracked application statuses (GET /api/scholarships/tracked).
export const TRACKING_STATUSES = [
  'preparing_documents',
  'ready_to_apply',
  'applied',
  'accepted',
  'rejected',
  'closed',
] as const;
export type TrackingStatus = (typeof TRACKING_STATUSES)[number];

export const IN_PROGRESS_STATUSES: readonly TrackingStatus[] = [
  'preparing_documents',
  'ready_to_apply',
  'applied',
];
export const TERMINAL_TRACKING_STATUSES: readonly TrackingStatus[] = [
  'accepted',
  'rejected',
  'closed',
];
