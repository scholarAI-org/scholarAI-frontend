import { toFormattingLocale } from '@/i18n/formatting';
import type { CalendarDate } from '@/features/student/scholarship-discovery/lib/deadlines';

// "15 September" (Latin digits), plus the year when it is not the current year on the
// student's device. A deadline is a calendar date, never an instant: anchoring to UTC keeps
// 2026-09-15 reading as 15 September in every time zone.
export function formatDeadlineDate(date: CalendarDate, now: Date, locale: string): string {
  const withYear = date.year !== now.getFullYear();
  return new Intl.DateTimeFormat(toFormattingLocale(locale), {
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' as const } : {}),
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
}
