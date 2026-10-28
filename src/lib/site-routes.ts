// Relative, not '@/': next.config.ts imports this module and Next loads the
// config before the tsconfig path aliases apply.
import { routing } from '../i18n/routing';

// Public routes that exist today, listed without their locale prefix. Both the
// sitemap and its tests read this list, so a new public page is advertised by
// adding it here once.
//
// Token and flow pages (/reset-password, /verify-email) are deliberately absent:
// they are meaningless without the state that put the visitor there.
export const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password'] as const;

// Signed-in areas. Crawlers only ever see a redirect from these, so they are
// disallowed in robots.txt and served with X-Robots-Tag: noindex.
export const PRIVATE_AREAS = ['/student', '/admin'] as const;

/**
 * `headers()` entries that keep the signed-in areas out of search indexes.
 * robots.txt asks crawlers not to fetch them; this tells the ones that fetch
 * anyway not to index what they got, and covers the unprefixed paths the
 * locale middleware redirects.
 */
export function noindexHeaders() {
  const sources = PRIVATE_AREAS.flatMap((area) => [
    area,
    `${area}/:path*`,
    ...routing.locales.flatMap((locale) => [`/${locale}${area}`, `/${locale}${area}/:path*`]),
  ]);

  return sources.map((source) => ({
    source,
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
  }));
}
