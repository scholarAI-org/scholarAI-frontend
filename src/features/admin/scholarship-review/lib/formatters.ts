export function getSafeExternalUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getSourceDomain(value: string | null | undefined): string | null {
  const url = getSafeExternalUrl(value);
  return url ? new URL(url).hostname || null : null;
}

export function displayText(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

export function formatDateTime(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
