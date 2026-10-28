import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { noindexHeaders } from './src/lib/site-routes';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Keep /backend/* paths intact for the proxy; src/middleware.ts redirects pages instead.
  skipTrailingSlashRedirect: true,
  // The signed-in areas must never be indexed (see src/lib/site-routes.ts).
  headers: async () => noindexHeaders(),
};

export default withNextIntl(nextConfig);
