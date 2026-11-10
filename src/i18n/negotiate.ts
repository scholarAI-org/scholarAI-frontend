import { routing } from './routing';

/**
 * Picks a locale from an Accept-Language header.
 *
 * Needed by the 404 page: Next renders it outside any route, so there are no
 * params and no request locale to read, and without this an English visitor
 * would always be answered in Arabic. Quality values are honoured; anything
 * unrecognised falls back to the routing default.
 */
export function matchLocale(
  acceptLanguage: string | null | undefined,
  locales: readonly string[] = routing.locales,
  defaultLocale: string = routing.defaultLocale
): string {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...parameters] = part.trim().split(';');
      const quality = parameters
        .map((parameter) => /^\s*q=([\d.]+)\s*$/i.exec(parameter))
        .find(Boolean)?.[1];
      const parsed = quality === undefined ? 1 : Number.parseFloat(quality);
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(parsed) ? 0 : parsed };
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    if (tag === '*') return defaultLocale;
    // 'en-GB' matches the 'en' locale; an exact match wins on its own turn.
    const base = tag.split('-')[0];
    const match =
      locales.find((locale) => locale.toLowerCase() === tag) ??
      locales.find((locale) => locale.toLowerCase() === base);
    if (match) return match;
  }

  return defaultLocale;
}
