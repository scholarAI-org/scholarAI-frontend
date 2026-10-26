import type {
  StudentNavigationGroupId,
  StudentNavigationItem,
  StudentNavigationItemId,
  StudentNavigationSection,
  StudentPageKey,
} from './types';

// Only implemented destinations appear; never link to a missing route.
export const studentNavigation: StudentNavigationItem[] = [
  {
    id: 'home',
    labelKey: 'nav.home',
    href: '/student',
    enabled: false,
    group: 'discover',
    match: 'exact',
  },
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
    id: 'tracking',
    labelKey: 'nav.tracking',
    href: '/student/tracking',
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

export const withTrackingEnabled = (
  items: readonly StudentNavigationItem[],
  trackingEnabled: boolean
): StudentNavigationItem[] =>
  items.map((item) => (item.id === 'tracking' ? { ...item, enabled: trackingEnabled } : item));

export const withHomeEnabled = (
  items: readonly StudentNavigationItem[],
  homeEnabled: boolean
): StudentNavigationItem[] =>
  items.map((item) => (item.id === 'home' ? { ...item, enabled: homeEnabled } : item));

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

// Bottom tab bar (mobile) order, independent of the sidebar's group order: the five
// primary destinations the Figma mobile notes call for. Disabled items drop out, so the
// bar closes up instead of leaving a hole, and the list can never exceed five.
export const studentTabBarOrder: StudentNavigationItemId[] = [
  'home',
  'scholarships',
  'saved',
  'tracking',
  'profile',
];

export const STUDENT_TAB_BAR_MAX_ITEMS = 5;

export const getStudentTabBarItems = (
  items: readonly StudentNavigationItem[]
): StudentNavigationItem[] =>
  studentTabBarOrder
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is StudentNavigationItem => Boolean(item?.enabled))
    .slice(0, STUDENT_TAB_BAR_MAX_ITEMS);

// Short bar labels live beside the sidebar labels, not instead of them: "Search" fits a
// five-up bar at 390px where "Search scholarships" would not.
export const studentTabLabelKey = (id: StudentNavigationItemId) => `tabs.${id}` as const;

export const getVisibleStudentNavigation = (items: readonly StudentNavigationItem[]) =>
  items.filter((item) => item.enabled);

export const isStudentNavigationItemActive = (item: StudentNavigationItem, pathname: string) =>
  item.match === 'exact'
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

export const getActiveStudentNavigationItem = (
  pathname: string,
  items: readonly StudentNavigationItem[] = studentNavigation
) => items.find((item) => isStudentNavigationItemActive(item, pathname))?.id ?? null;

// The tab a pathname lights up. Only visible tabs can win, so a route whose flag is off
// leaves the bar with no aria-current. The longest matching href wins, so a sub-route
// prefers its own tab over a shorter prefix.
export const getActiveStudentTabId = (
  pathname: string,
  items: readonly StudentNavigationItem[]
): StudentNavigationItemId | null =>
  getStudentTabBarItems(items)
    .filter((item) => isStudentNavigationItemActive(item, pathname))
    .reduce<StudentNavigationItem | null>(
      (best, item) => (best && best.href.length >= item.href.length ? best : item),
      null
    )?.id ?? null;

// Title for the compact mobile top bar. A page that owns a tab reuses the tab's own short
// label; a page without one (scholarship details) falls back to its page title. Both are
// placeholder-free, unlike pages.home.title, which greets the student by name.
export const getStudentCompactTitleKey = (pathname: string) => {
  const pageKey = getStudentPageKey(pathname);
  if (!pageKey) return null;
  return studentTabBarOrder.some((id) => id === pageKey)
    ? (`nav.${pageKey as StudentNavigationItemId}` as const)
    : (`pages.${pageKey}.title` as const);
};

export function getStudentPageKey(pathname: string): StudentPageKey | null {
  if (pathname === '/student') return 'home';
  if (pathname === '/student/saved' || pathname.startsWith('/student/saved/')) {
    return 'saved';
  }
  if (pathname === '/student/tracking' || pathname.startsWith('/student/tracking/')) {
    return 'tracking';
  }
  if (pathname === '/student/profile' || pathname.startsWith('/student/profile/')) {
    return 'profile';
  }
  if (pathname === '/student/scholarships') return 'scholarships';
  if (/^\/student\/scholarships\/[^/]+$/.test(pathname)) return 'scholarshipDetails';
  return null;
}
