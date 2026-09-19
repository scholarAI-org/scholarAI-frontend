export type AdminNavigationItem = {
  id: string;
  labelKey: string;
  icon: string;
  href?: string;
  match?: 'exact' | 'section';
};

export type AdminNavigationGroup = {
  id: string;
  labelKey: string;
  items: AdminNavigationItem[];
};

export const adminNavigation: AdminNavigationGroup[] = [
  {
    id: 'overview',
    labelKey: 'groups.overview',
    items: [
      {
        id: 'dashboard',
        labelKey: 'items.dashboard',
        icon: '/images/admin/dashboard.svg',
        href: '/admin/dashboard',
        match: 'exact',
      },
    ],
  },
  {
    id: 'content',
    labelKey: 'groups.content',
    items: [
      {
        id: 'review',
        labelKey: 'items.review',
        icon: '/images/admin/scholarship-review.svg',
        href: '/admin/scholarships/review',
        match: 'section',
      },
      {
        id: 'scholarships',
        labelKey: 'items.scholarships',
        icon: '/images/admin/scholarships.svg',
      },
    ],
  },
  {
    id: 'management',
    labelKey: 'groups.management',
    items: [
      { id: 'users', labelKey: 'items.users', icon: '/images/admin/users.svg' },
      { id: 'reports', labelKey: 'items.reports', icon: '/images/admin/reports.svg' },
      {
        id: 'notifications',
        labelKey: 'items.notifications',
        icon: '/images/admin/notifications.svg',
      },
    ],
  },
  {
    id: 'settings',
    labelKey: 'groups.settings',
    items: [{ id: 'profile', labelKey: 'items.profile', icon: '/images/admin/profile.svg' }],
  },
];

export function isNavigationItemActive(item: AdminNavigationItem, pathname: string) {
  if (!item.href) return false;
  return item.match === 'section'
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;
}
