import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import {
  backendTargetUrl,
  buildProxyRequestHeaders,
  isBackendPath,
  trailingSlashRedirectPath,
} from '@/lib/backend-proxy';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Proxy before any next-intl logic, so /backend/* never gets a locale prefix or redirect.
  if (isBackendPath(pathname)) {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ detail: 'Service unavailable' }, { status: 503 });
    }
    return NextResponse.rewrite(backendTargetUrl(pathname, search, backendUrl), {
      request: {
        headers: buildProxyRequestHeaders(request.headers, process.env.PROXY_SHARED_SECRET),
      },
    });
  }

  const withoutSlash = trailingSlashRedirectPath(pathname);
  if (withoutSlash) {
    // A plain URL: NextURL keeps the original trailing slash when serialized.
    return NextResponse.redirect(new URL(`${withoutSlash}${search}`, request.url), 308);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/backend/:path*', '/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};
