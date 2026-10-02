import type { StudentNavigationItem, StudentPageKey } from './types';

// Only implemented destinations appear. Search Scholarships stays disabled
// until its route exists (T023), so it never links to a 404.
export const studentNavigation: StudentNavigationItem[] = [
  { id: 'profile', labelKey: 'nav.profile', href: '/student/profile', enabled: true },
  {
    id: 'scholarships',
    labelKey: 'nav.scholarships',
    href: '/student/scholarships',
    enabled: false,
  },
];

export const getVisibleStudentNavigation = (items: readonly StudentNavigationItem[]) =>
  items.filter((item) => item.enabled);

export const isStudentNavigationItemActive = (item: StudentNavigationItem, pathname: string) =>
  pathname === item.href || pathname.startsWith(`${item.href}/`);

export const getActiveStudentNavigationItem = (
  pathname: string,
  items: readonly StudentNavigationItem[] = studentNavigation
) => items.find((item) => isStudentNavigationItemActive(item, pathname))?.id ?? null;

export function getStudentPageKey(pathname: string): StudentPageKey | null {
  if (pathname === '/student/profile' || pathname.startsWith('/student/profile/')) {
    return 'profile';
  }
  if (pathname === '/student/scholarships') return 'scholarships';
  if (/^\/student\/scholarships\/[^/]+$/.test(pathname)) return 'scholarshipDetails';
  return null;
}
