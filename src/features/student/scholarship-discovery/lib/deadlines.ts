import { toFormattingLocale } from '@/i18n/formatting';

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number;
}

export type DeadlineStatus =
  | { kind: 'none' }
  | { kind: 'unspecified' }
  | { kind: 'past'; date: CalendarDate }
  | { kind: 'today'; date: CalendarDate }
  | { kind: 'upcoming'; date: CalendarDate; daysLeft: number };

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

// Deadlines are calendar dates (YYYY-MM-DD), not instants: never parse them as UTC
// midnight, which would shift the day west of Greenwich.
export function parseCalendarDate(value: string | null | undefined): CalendarDate | null {
  const match = typeof value === 'string' ? DATE_ONLY.exec(value.trim()) : null;
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
    ? { year, month, day }
    : null;
}

// The student's own calendar day, from their local clock.
export const toLocalCalendarDate = (now: Date): CalendarDate => ({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  day: now.getDate(),
});

const dayNumber = ({ year, month, day }: CalendarDate) =>
  Date.UTC(year, month - 1, day) / MS_PER_DAY;

export function getDeadlineStatus(
  deadline: string | null | undefined,
  noDeadline: boolean,
  now: Date
): DeadlineStatus {
  if (noDeadline) return { kind: 'none' };
  const date = parseCalendarDate(deadline);
  if (!date) return { kind: 'unspecified' };
  const daysLeft = dayNumber(date) - dayNumber(toLocalCalendarDate(now));
  if (daysLeft < 0) return { kind: 'past', date };
  if (daysLeft === 0) return { kind: 'today', date };
  return { kind: 'upcoming', date, daysLeft };
}

// Formats the calendar date itself (anchored to UTC so it cannot shift) with the
// pinned Latin-digit locale.
export const formatCalendarDate = (date: CalendarDate, locale: string) =>
  new Intl.DateTimeFormat(toFormattingLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));

export const toIsoCalendarDate = ({ year, month, day }: CalendarDate) =>
  `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
