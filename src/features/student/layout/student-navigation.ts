import type {
  StudentNavigationGroupId,
  StudentNavigationItem,
  StudentNavigationSection,
  StudentPageKey,
} from './types';

// Only implemented destinations appear; never link to a missing route.
export const studentNavigation: StudentNavigationItem[] = [
  {
    id: 'scholarships',
    labelKey: 'nav.scholarships',
    href: '/student/scholarships',
    enabled: true,
    group: 'discover',
  },
  {
    id: 'saved',
    labelKey: 'nav.saved',
    href: '/student/saved',
    enabled: false,
    group: 'discover',
  },
  {
    id: 'profile',
    labelKey: 'nav.profile',
    href: '/student/profile',
    enabled: true,
    group: 'personal',
  },
];

export const withSavedEnabled = (
  items: readonly StudentNavigationItem[],
  savedEnabled: boolean
): StudentNavigationItem[] =>
  items.map((item) => (item.id === 'saved' ? { ...item, enabled: savedEnabled } : item));

// Figma sidebar (2979:9150) section order. A label shows only above real items.
export const studentNavigationGroups: StudentNavigationGroupId[] = ['discover', 'personal'];

export const getStudentNavigationSections = (
  items: readonly StudentNavigationItem[]
): StudentNavigationSection[] =>
  studentNavigationGroups
    .map((id) => ({
      id,
      labelKey: `navGroups.${id}` as const,
      items: items.filter((item) => item.enabled && item.group === id),
    }))
    .filter((section) => section.items.length > 0);

export const getVisibleStudentNavigation = (items: readonly StudentNavigationItem[]) =>
  items.filter((item) => item.enabled);

export const isStudentNavigationItemActive = (item: StudentNavigationItem, pathname: string) =>
  pathname === item.href || pathname.startsWith(`${item.href}/`);

export const getActiveStudentNavigationItem = (
  pathname: string,
  items: readonly StudentNavigationItem[] = studentNavigation
) => items.find((item) => isStudentNavigationItemActive(item, pathname))?.id ?? null;

export function getStudentPageKey(pathname: string): StudentPageKey | null {
  if (pathname === '/student/saved' || pathname.startsWith('/student/saved/')) {
    return 'saved';
  }
  if (pathname === '/student/profile' || pathname.startsWith('/student/profile/')) {
    return 'profile';
  }
  if (pathname === '/student/scholarships') return 'scholarships';
  if (/^\/student\/scholarships\/[^/]+$/.test(pathname)) return 'scholarshipDetails';
  return null;
}
