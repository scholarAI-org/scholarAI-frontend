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

export const SCHOLARSHIP_IMAGE_FALLBACK_SRC = '/images/student/scholarship-image-fallback.svg';

// What the image renders: the backend image, or the decorative local fallback
// (alt="") when the URL is invalid or that same URL already failed to load.
export function getScholarshipImageSource(
  src: string | null | undefined,
  alt: string,
  failedSrc: string | null
) {
  const safeSrc = getSafeImageUrl(src);
  return !safeSrc || failedSrc === safeSrc
    ? { src: SCHOLARSHIP_IMAGE_FALLBACK_SRC, alt: '', isFallback: true, safeSrc }
    : { src: safeSrc, alt, isFallback: false, safeSrc };
}
