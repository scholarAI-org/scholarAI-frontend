import { toFormattingLocale } from '@/i18n/formatting';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// "3 hours ago" in the active language with Latin digits. Under a minute, in the
// future (clock skew) or an unreadable date all read as `justNow`, which the caller
// passes already translated.
export function formatRelativeTime(
  occurredAt: string | Date,
  now: Date,
  locale: string,
  justNow: string
): string {
  const then = occurredAt instanceof Date ? occurredAt : new Date(occurredAt);
  const elapsed = now.getTime() - then.getTime();
  if (!Number.isFinite(elapsed) || elapsed < MINUTE) return justNow;

  const rtf = new Intl.RelativeTimeFormat(toFormattingLocale(locale), { numeric: 'always' });
  if (elapsed < HOUR) return rtf.format(-Math.floor(elapsed / MINUTE), 'minute');
  if (elapsed < DAY) return rtf.format(-Math.floor(elapsed / HOUR), 'hour');
  const days = Math.floor(elapsed / DAY);
  if (days < 7) return rtf.format(-days, 'day');
  if (days < 30) return rtf.format(-Math.floor(days / 7), 'week');
  return rtf.format(-Math.floor(days / 30), 'month');
}
