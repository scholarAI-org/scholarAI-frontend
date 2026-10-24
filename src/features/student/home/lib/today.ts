import { toFormattingLocale } from '@/i18n/formatting';

// Milliseconds until the next local 00:00 (DST-safe: the next day's midnight is
// built from calendar fields, not by adding 24 hours).
export function msUntilNextLocalMidnight(now: Date): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return nextMidnight.getTime() - now.getTime();
}

// "24 October 2026" / "24 أكتوبر 2026" with Latin digits, on the student's local day.
export const formatTodayLabel = (now: Date, locale: string): string =>
  new Intl.DateTimeFormat(toFormattingLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
