import { toFormattingLocale } from '@/i18n/formatting';
// Allow-listed import from the Home feature (plan: three files may touch it). Home's formatter
// already pins Latin digits and covers minutes, hours, days and weeks.
import { formatRelativeTime } from '@/features/student/home/lib/relative-time';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

// One rule for the time line of a card (spec FR-016): under a minute (or in the future, from
// clock skew) "Just now"; minutes, hours, days (2 to 6) and weeks (7 to 29) as in Home;
// exactly one day "Yesterday" in the language's natural form; 30 days or more the date.
// An unreadable date gives an empty string.
export function formatNotificationTime(
  createdAt: string,
  now: Date,
  locale: string,
  justNow: string
): string {
  const then = new Date(createdAt);
  const elapsed = now.getTime() - then.getTime();
  if (!Number.isFinite(elapsed)) return '';
  if (elapsed < MINUTE) return justNow;

  const days = Math.floor(elapsed / DAY);
  if (days >= 30) {
    return new Intl.DateTimeFormat(toFormattingLocale(locale), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(then);
  }
  if (days === 1) {
    return new Intl.RelativeTimeFormat(toFormattingLocale(locale), { numeric: 'auto' }).format(
      -1,
      'day'
    );
  }
  return formatRelativeTime(createdAt, now, locale, justNow);
}

// The exact local date and time, for the `title` of the time element.
export function formatExactTime(createdAt: string, locale: string): string {
  const then = new Date(createdAt);
  if (!Number.isFinite(then.getTime())) return '';
  return new Intl.DateTimeFormat(toFormattingLocale(locale), {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(then);
}
