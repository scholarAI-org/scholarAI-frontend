import type { CalendarDate } from '@/features/student/scholarship-discovery/lib/deadlines';

// The internal notification model (camelCase). Backend field names exist only in ../adapter.

export const NOTIFICATION_TYPES = [
  'deadline_reminder',
  'scholarship_match',
  'saved_scholarship_updated',
  'scholarship_archived',
  'profile_incomplete',
  'document_analysis_ready',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const isNotificationType = (value: unknown): value is NotificationType =>
  (NOTIFICATION_TYPES as readonly unknown[]).includes(value);

// The closed list of action kinds the backend may send (BE-13).
export const ACTION_TYPES = ['open_scholarship', 'open_profile', 'open_document_analysis'] as const;
export type NotificationActionType = (typeof ACTION_TYPES)[number];

// What the backend attached to a notification. `type` stays a plain string so a newer
// backend's unknown kind survives parsing and simply renders no action.
export interface NotificationActionData {
  type: string;
  targetId: number | null;
}

export interface DeadlineReminderParams {
  scholarshipId: number;
  scholarshipTitle: string;
  daysLeft: number;
  deadline: CalendarDate;
  reminderIndex: number;
  reminderTotal: number;
  missingDocuments: string[];
}

export interface ScholarshipMatchParams {
  scholarshipId: number;
  scholarshipTitle: string;
  matchedCount: number;
  totalCount: number;
}

export interface SavedScholarshipUpdatedParams {
  scholarshipId: number;
  scholarshipTitle: string;
  change: string;
}

export interface ScholarshipArchivedParams {
  scholarshipId: number;
  scholarshipTitle: string;
}

export interface ProfileIncompleteParams {
  remainingPercent: number;
  thresholdPercent: number;
}

export interface DocumentAnalysisReadyParams {
  suggestionsCount: number;
  targetScholarshipTitle: string | null;
}

export interface NotificationParamsByType {
  deadline_reminder: DeadlineReminderParams;
  scholarship_match: ScholarshipMatchParams;
  saved_scholarship_updated: SavedScholarshipUpdatedParams;
  scholarship_archived: ScholarshipArchivedParams;
  profile_incomplete: ProfileIncompleteParams;
  document_analysis_ready: DocumentAnalysisReadyParams;
}

interface NotificationBase {
  id: number;
  createdAt: string;
  isRead: boolean;
  action: NotificationActionData | null;
}

// A discriminated union on `type`, so `params` is precise inside each branch.
export type StudentNotification = {
  [K in NotificationType]: NotificationBase & { type: K; params: NotificationParamsByType[K] };
}[NotificationType];

export interface SkippedCounts {
  unknownType: number;
  malformed: number;
}

export interface NotificationPage {
  items: StudentNotification[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  // Counts only, never values (FR-028).
  skipped: SkippedCounts;
}

export interface NotificationAction {
  href: string;
  labelKey: 'actions.viewScholarship' | 'actions.completeProfile';
}
