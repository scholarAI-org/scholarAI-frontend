export type StudentNavigationItemId = 'home' | 'profile' | 'scholarships' | 'saved' | 'tracking';
export type StudentNavigationGroupId = 'discover' | 'manage' | 'personal';

export interface StudentNavigationItem {
  id: StudentNavigationItemId;
  labelKey: `nav.${StudentNavigationItemId}`;
  href: string;
  enabled: boolean;
  group: StudentNavigationGroupId;
  // How a pathname activates the item. Default 'prefix' (the item and its sub-routes);
  // 'exact' is for an index route such as /student, which prefixes every other page.
  match?: 'prefix' | 'exact';
}

export interface StudentNavigationSection {
  id: StudentNavigationGroupId;
  labelKey: `navGroups.${StudentNavigationGroupId}`;
  items: StudentNavigationItem[];
}

export type StudentPageKey =
  'home' | 'profile' | 'scholarships' | 'scholarshipDetails' | 'saved' | 'tracking';
