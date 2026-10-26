// The public origin this app is served from. Metadata (canonical URLs, hreflang
// alternates, Open Graph), robots.txt and the sitemap all need an absolute URL,
// and Next needs one to resolve metadataBase.
//
// Production must set SITE_URL to the real domain. On Vercel the preview and
// production deployment URLs are used as a fallback so previews stay coherent;
// local development falls back to the dev server origin.

export const DEFAULT_SITE_URL = 'http://localhost:3000';

type SiteEnv = {
  SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_URL?: string;
  // Keeps process.env assignable: it carries far more than these three.
  [key: string]: string | undefined;
};

function normalize(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    // Drop any path, query or trailing slash: callers append their own path.
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function resolveSiteUrl(env: SiteEnv = process.env): string {
  return (
    normalize(env.SITE_URL) ??
    normalize(env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalize(env.VERCEL_URL) ??
    DEFAULT_SITE_URL
  );
}

/** Absolute URL for an app-relative path, e.g. absoluteUrl('/ar/login'). */
export function absoluteUrl(pathname: string, env?: SiteEnv): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${resolveSiteUrl(env)}${path === '/' ? '' : path.replace(/\/+$/, '')}`;
}
