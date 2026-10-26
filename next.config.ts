import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { routing } from './src/i18n/routing';
import { PRIVATE_AREAS } from './src/lib/site-routes';

const withNextIntl = createNextIntlPlugin();

/**
 * The signed-in areas must never be indexed. robots.txt asks crawlers not to
 * fetch them; this header tells the ones that fetch anyway not to index what
 * they got, and covers the unprefixed paths the locale middleware redirects.
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

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Keep /backend/* paths intact for the proxy; src/middleware.ts redirects pages instead.
  skipTrailingSlashRedirect: true,
  headers: async () => noindexHeaders(),
};

export default withNextIntl(nextConfig);
