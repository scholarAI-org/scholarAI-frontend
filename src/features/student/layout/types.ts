export type StudentNavigationItemId = 'profile' | 'scholarships' | 'saved';
export type StudentNavigationGroupId = 'discover' | 'personal';

export interface StudentNavigationItem {
  id: StudentNavigationItemId;
  labelKey: `nav.${StudentNavigationItemId}`;
  href: string;
  enabled: boolean;
  group: StudentNavigationGroupId;
}

export interface StudentNavigationSection {
  id: StudentNavigationGroupId;
  labelKey: `navGroups.${StudentNavigationGroupId}`;
  items: StudentNavigationItem[];
}

export type StudentPageKey = 'profile' | 'scholarships' | 'scholarshipDetails' | 'saved';
