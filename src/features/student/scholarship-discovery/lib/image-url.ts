// Scholarship images come from arbitrary backend hosts. Only absolute http(s)
// URLs are rendered; anything else (relative, protocol-relative, data:, javascript:,
// malformed) falls back to the local neutral image.
export function getSafeImageUrl(value: string | null | undefined): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
