// Same-origin proxy to the FastAPI backend. The browser only talks to this
// app's origin, so the HttpOnly auth cookie the backend sets is first-party.

export const BACKEND_PREFIX = '/backend';
export const PROXY_SECRET_HEADER = 'x-proxy-secret';
export const CLIENT_IP_HEADER = 'x-client-ip';

export function isBackendPath(pathname: string): boolean {
  return pathname === BACKEND_PREFIX || pathname.startsWith(`${BACKEND_PREFIX}/`);
}

export function backendTargetUrl(pathname: string, search: string, backendUrl: string): string {
  const base = backendUrl.replace(/\/+$/, '');
  const path = pathname.slice(BACKEND_PREFIX.length) || '/';
  return `${base}${path}${search}`;
}

/**
 * Headers forwarded to the backend. Client-supplied proxy headers are always
 * dropped. With a shared secret, the browser IP is forwarded from
 * x-forwarded-for, which Vercel overwrites so clients cannot spoof it.
 */
export function buildProxyRequestHeaders(incoming: Headers, secret: string | undefined): Headers {
  const headers = new Headers(incoming);
  headers.delete(PROXY_SECRET_HEADER);
  headers.delete(CLIENT_IP_HEADER);

  const clientIp = incoming.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (secret && clientIp) {
    headers.set(PROXY_SECRET_HEADER, secret);
    headers.set(CLIENT_IP_HEADER, clientIp);
  }
  return headers;
}

/**
 * skipTrailingSlashRedirect keeps /backend paths byte-for-byte (FastAPI routes
 * such as /api/scholarships/ need the slash), so pages get the default
 * trailing-slash redirect from here instead.
 */
export function trailingSlashRedirectPath(pathname: string): string | null {
  if (pathname === '/' || !pathname.endsWith('/') || isBackendPath(pathname)) {
    return null;
  }
  return pathname.replace(/\/+$/, '') || '/';
}
