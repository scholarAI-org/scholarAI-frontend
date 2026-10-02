export type StudentNavigationItemId = 'profile' | 'scholarships';

export interface StudentNavigationItem {
  id: StudentNavigationItemId;
  labelKey: `nav.${StudentNavigationItemId}`;
  href: string;
  enabled: boolean;
}

export type StudentPageKey = 'profile' | 'scholarships' | 'scholarshipDetails';
