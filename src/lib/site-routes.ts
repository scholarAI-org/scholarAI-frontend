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
