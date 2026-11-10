import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { BACKEND_PREFIX } from '@/lib/backend-proxy';
import { absoluteUrl } from '@/lib/site-url';
import { PRIVATE_AREAS } from '@/lib/site-routes';

/**
 * Public pages (the landing page and the auth pages) are crawlable. The signed-in
 * areas are not: they need a session, so a crawler only ever sees a redirect, and
 * /backend is the API proxy. The matching X-Robots-Tag headers live in
 * next.config.ts, which also covers anything robots.txt is not honoured for.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = [
    // No trailing slash: robots.txt matches by prefix, so '/ar/student' covers
    // the area itself and every page under it.
    ...routing.locales.flatMap((locale) => PRIVATE_AREAS.map((area) => `/${locale}${area}`)),
    `${BACKEND_PREFIX}/`,
  ];

  return {
    rules: [{ userAgent: '*', allow: '/', disallow }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
