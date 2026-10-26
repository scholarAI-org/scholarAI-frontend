// BE-08 (UTC `Z` on /tracked) is pending, so a timestamp may or may not carry a
// zone. A value without one is never given a zone: its calendar date is shown as
// written. A value with one is converted into the viewer's zone.
const NAIVE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;
const ZONED = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/i;

const isRealCalendarDay = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

// `YYYY-MM-DD`, or null when the value cannot be read. Never throws.
export function trackingDateLabel(value: unknown, timeZone?: string): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();

  const naive = NAIVE.exec(raw);
  if (naive) {
    const [, y, mo, d, h = '0', mi = '0', s = '0'] = naive;
    if (!isRealCalendarDay(Number(y), Number(mo), Number(d))) return null;
    if (Number(h) > 23 || Number(mi) > 59 || Number(s) > 59) return null;
    return `${y}-${mo}-${d}`;
  }

  if (!ZONED.test(raw)) return null;
  const instant = new Date(raw.replace(' ', 'T'));
  if (Number.isNaN(instant.getTime())) return null;
  try {
    // en-CA formats as YYYY-MM-DD, independent of the page locale.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(instant);
  } catch {
    return null;
  }
}
