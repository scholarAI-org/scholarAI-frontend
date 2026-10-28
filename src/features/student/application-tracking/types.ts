import type { ScholarshipDiscoveryCard } from '@/features/student/scholarship-discovery/types';
import type { TRACKING_CARD_ORDER, TRACKING_STATUSES } from './constants';

export type TrackingStatus = (typeof TRACKING_STATUSES)[number];
export type TrackingCardKey = (typeof TRACKING_CARD_ORDER)[number];

// One row of GET /api/scholarships/tracked, after validation.
// `id` is the outer tracking id used by every row action, not scholarship.id.
export interface TrackedItem {
  id: number;
  status: TrackingStatus;
  notes: string | null;
  // Raw backend strings: BE-08 does not yet guarantee a timezone suffix, so
  // they are only ever read through lib/timestamps.
  statusChangedAt: string;
  createdAt: string;
  updatedAt: string;
  scholarship: ScholarshipDiscoveryCard;
  // BE-03 is pending: null until the backend sends a safe http(s) official URL.
  officialUrl: string | null;
}

// PUT /api/scholarships/{id}/tracking (BE-02) answers { status, updated_at }.
export interface StartTrackingResult {
  status: TrackingStatus;
  updatedAt: string;
}

export interface TrackedList {
  items: TrackedItem[];
  // Items that failed validation and were not rendered.
  skipped: number;
}

export interface TrackingStatusResult {
  id: number;
  status: TrackingStatus;
  statusChangedAt: string;
  updatedAt: string;
}

export interface TrackingNoteResult {
  id: number;
  notes: string | null;
  updatedAt: string;
}

export interface RemoveTrackingResult {
  scholarshipId: number | null;
  isTracked: boolean;
  isSaved: boolean | null;
}

export type TrackingCounts = Record<TrackingStatus, number>;
