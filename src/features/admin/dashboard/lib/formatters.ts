export type DeadlinePresentation =
  { kind: 'no-deadline' } | { kind: 'date'; value: string } | { kind: 'unavailable' };

function toValidDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDashboardNumber(
  value: number | null | undefined,
  locale: string
): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat(locale).format(value);
}

export function formatDashboardDate(
  value: string | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string | null {
  const date = toValidDate(value);
  return date ? new Intl.DateTimeFormat(locale, options).format(date) : null;
}

export function formatDashboardDateTime(
  value: string | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
): string | null {
  return formatDashboardDate(value, locale, options);
}

export function getDeadlinePresentation(
  deadline: string | null | undefined,
  noDeadline: boolean | null | undefined,
  locale: string
): DeadlinePresentation {
  if (noDeadline) {
    return { kind: 'no-deadline' };
  }

  const value = formatDashboardDate(deadline, locale);
  return value ? { kind: 'date', value } : { kind: 'unavailable' };
}

export function getSafeExternalUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getSourceDomain(value: string | null | undefined): string | null {
  const safeUrl = getSafeExternalUrl(value);
  if (!safeUrl) {
    return null;
  }

  return new URL(safeUrl).hostname || null;
}

export function getDisplayableDashboardText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}
