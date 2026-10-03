import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Keep /backend/* paths intact for the proxy; src/middleware.ts redirects pages instead.
  skipTrailingSlashRedirect: true,
};

export default withNextIntl(nextConfig);
