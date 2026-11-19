import { z } from 'zod';
import { parseCalendarDate } from '@/features/student/scholarship-discovery/lib/deadlines';
import type { NotificationParamsByType, NotificationType } from '../model/types';

// Wire `params` of each notification type, mapped to the internal camelCase model.
// This file and wire.ts are the only places that know the backend's field names (FR-090).
// Unknown keys are stripped, never rejected (FR-091).

const positiveInt = z.number().int().positive();
const count = z.number().int().min(0);
const text = z.string().refine((value) => value.trim().length > 0, 'must not be empty');

const deadlineReminder = z
  .object({
    scholarship_id: positiveInt,
    scholarship_title: text,
    days_left: count,
    deadline: z
      .string()
      .refine((value) => parseCalendarDate(value) !== null, 'must be a calendar date YYYY-MM-DD'),
    reminder_index: positiveInt,
    reminder_total: positiveInt,
    missing_documents: z.array(z.string()).nullish(),
  })
  .refine((params) => params.reminder_index <= params.reminder_total, 'index exceeds total')
  .transform((p): NotificationParamsByType['deadline_reminder'] => ({
    scholarshipId: p.scholarship_id,
    scholarshipTitle: p.scholarship_title,
    daysLeft: p.days_left,
    deadline: parseCalendarDate(p.deadline)!,
    reminderIndex: p.reminder_index,
    reminderTotal: p.reminder_total,
    missingDocuments: p.missing_documents ?? [],
  }));

const scholarshipMatch = z
  .object({
    scholarship_id: positiveInt,
    scholarship_title: text,
    matched_count: count,
    total_count: positiveInt,
  })
  .refine((params) => params.matched_count <= params.total_count, 'matched exceeds total')
  .transform((p): NotificationParamsByType['scholarship_match'] => ({
    scholarshipId: p.scholarship_id,
    scholarshipTitle: p.scholarship_title,
    matchedCount: p.matched_count,
    totalCount: p.total_count,
  }));

const savedScholarshipUpdated = z
  .object({ scholarship_id: positiveInt, scholarship_title: text, change: text })
  .transform((p): NotificationParamsByType['saved_scholarship_updated'] => ({
    scholarshipId: p.scholarship_id,
    scholarshipTitle: p.scholarship_title,
    change: p.change,
  }));

const scholarshipArchived = z
  .object({ scholarship_id: positiveInt, scholarship_title: text })
  .transform((p): NotificationParamsByType['scholarship_archived'] => ({
    scholarshipId: p.scholarship_id,
    scholarshipTitle: p.scholarship_title,
  }));

const percent = z.number().min(0).max(100);
const profileIncomplete = z
  .object({ remaining_percent: percent, threshold_percent: percent })
  .transform((p): NotificationParamsByType['profile_incomplete'] => ({
    remainingPercent: p.remaining_percent,
    thresholdPercent: p.threshold_percent,
  }));

const documentAnalysisReady = z
  .object({ suggestions_count: count, target_scholarship_title: z.string().nullish() })
  .transform((p): NotificationParamsByType['document_analysis_ready'] => ({
    suggestionsCount: p.suggestions_count,
    targetScholarshipTitle: p.target_scholarship_title?.trim() ? p.target_scholarship_title : null,
  }));

export const PARAMS_SCHEMAS = {
  deadline_reminder: deadlineReminder,
  scholarship_match: scholarshipMatch,
  saved_scholarship_updated: savedScholarshipUpdated,
  scholarship_archived: scholarshipArchived,
  profile_incomplete: profileIncomplete,
  document_analysis_ready: documentAnalysisReady,
} satisfies Record<NotificationType, z.ZodType>;
