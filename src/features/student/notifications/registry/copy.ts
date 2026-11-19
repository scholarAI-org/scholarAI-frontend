import { toFormattingLocale } from '@/i18n/formatting';
import { formatDeadlineDate } from '../lib/deadline-date';
import { formatExactTime, formatNotificationTime } from '../lib/relative-time';
import type { StudentNotification } from '../model/types';

// next-intl's translator for the StudentNotifications namespace, as far as copy needs it.
export type NotificationTranslator = (key: string, values?: Record<string, unknown>) => string;

export interface CopyContext {
  t: NotificationTranslator;
  locale: string;
  now: Date;
}

export interface NotificationCopy {
  title: string;
  body: string;
  // "2 hours ago", "Yesterday", a date; empty when `created_at` is unreadable.
  time: string;
  // The exact local date and time, for the time element's title.
  exactTime: string;
  // "Reminder 1 of 2" on a deadline reminder, otherwise null.
  reminder: string | null;
}

// `change` codes with their own sentence (BE-13 names only this one). Any other code is valid
// and reads as the generic "was updated" sentence.
export const KNOWN_CHANGE_CODES = ['language_requirement_added'] as const;

// Document codes the profile feature already knows. Any other code in `missing_documents`
// only produces the generic "some documents are missing" sentence.
export const KNOWN_DOCUMENT_CODES = [
  'cv',
  'motivation_letter',
  'graduation_certificate',
  'transcript',
  'english_test',
  'university_admission_letter',
  'recommendation_letters',
  'passport',
] as const;

const isKnown = (codes: readonly string[], code: string) => codes.includes(code);

// Title, body and time line of a card, built only from the notification's type and params and
// the translated messages (`types.<type>.*`). The backend never sends a sentence.
export function buildNotificationCopy(
  notification: StudentNotification,
  { t, locale, now }: CopyContext
): NotificationCopy {
  const time = formatNotificationTime(notification.createdAt, now, locale, t('time.justNow'));
  const exactTime = formatExactTime(notification.createdAt, locale);
  const base = { time, exactTime, reminder: null as string | null };

  switch (notification.type) {
    case 'deadline_reminder': {
      const p = notification.params;
      let body = t('types.deadline_reminder.body', {
        days: p.daysLeft,
        date: formatDeadlineDate(p.deadline, now, locale),
      });
      const known = p.missingDocuments.filter((code) => isKnown(KNOWN_DOCUMENT_CODES, code));
      if (known.length > 0) {
        const list = new Intl.ListFormat(toFormattingLocale(locale), {
          style: 'long',
          type: 'conjunction',
        }).format(known.map((code) => t(`documents.${code}`)));
        body = `${body} ${t('types.deadline_reminder.documents', { list })}`;
      } else if (p.missingDocuments.length > 0) {
        body = `${body} ${t('types.deadline_reminder.documentsUnknown')}`;
      }
      return {
        ...base,
        title: t('types.deadline_reminder.title', { title: p.scholarshipTitle }),
        body,
        reminder: t('time.reminder', { index: p.reminderIndex, total: p.reminderTotal }),
      };
    }
    case 'scholarship_match': {
      const p = notification.params;
      return {
        ...base,
        title: t('types.scholarship_match.title'),
        body: t('types.scholarship_match.body', {
          title: p.scholarshipTitle,
          matched: p.matchedCount,
          total: p.totalCount,
        }),
      };
    }
    case 'saved_scholarship_updated': {
      const p = notification.params;
      const key = isKnown(KNOWN_CHANGE_CODES, p.change)
        ? `types.saved_scholarship_updated.changes.${p.change}`
        : 'types.saved_scholarship_updated.body';
      return {
        ...base,
        title: t('types.saved_scholarship_updated.title'),
        body: t(key, { title: p.scholarshipTitle }),
      };
    }
    case 'scholarship_archived':
      return {
        ...base,
        title: t('types.scholarship_archived.title'),
        body: t('types.scholarship_archived.body', { title: notification.params.scholarshipTitle }),
      };
    case 'profile_incomplete': {
      const p = notification.params;
      return {
        ...base,
        title: t('types.profile_incomplete.title'),
        body: t('types.profile_incomplete.body', {
          remaining: Math.round(p.remainingPercent),
          threshold: Math.round(p.thresholdPercent),
        }),
      };
    }
    case 'document_analysis_ready': {
      const p = notification.params;
      return {
        ...base,
        title: t('types.document_analysis_ready.title'),
        body: p.targetScholarshipTitle
          ? t('types.document_analysis_ready.bodyForScholarship', {
              count: p.suggestionsCount,
              title: p.targetScholarshipTitle,
            })
          : t('types.document_analysis_ready.body', { count: p.suggestionsCount }),
      };
    }
  }
}
