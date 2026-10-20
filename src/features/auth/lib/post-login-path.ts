import type { UserRole } from '../types';

const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  student: '/student/profile',
};

const ROLE_AREA: Record<UserRole, string> = {
  admin: '/admin/',
  student: '/student/',
};

/** Locale-less login URL that remembers where a guest was headed. */
export function loginPathWithNext(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}

/**
 * Returns `next` only when it is a same-origin internal path inside the
 * user's own area; otherwise the role's default landing page.
 */
export function resolvePostLoginPath(next: unknown, role: UserRole): string {
  const fallback = ROLE_HOME[role] ?? ROLE_HOME.student;
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return fallback;
  if (/[\\\u0000-\u001f]/.test(next)) return fallback;
  let parsed: URL;
  try {
    parsed = new URL(next, 'http://internal.invalid');
  } catch {
    return fallback;
  }
  if (parsed.origin !== 'http://internal.invalid') return fallback;
  const area = ROLE_AREA[role];
  if (!area || !parsed.pathname.startsWith(area)) return fallback;
  return `${parsed.pathname}${parsed.search}`;
}
