import { Bookmark, LayoutGrid, Search, SquarePen, UserRound, type LucideIcon } from 'lucide-react';

import type { StudentNavigationItemId } from './types';

// One icon per destination, shared by the sidebar and the mobile tab bar so the two
// never drift apart.
export const navigationIcons: Record<StudentNavigationItemId, LucideIcon> = {
  home: LayoutGrid,
  profile: UserRound,
  scholarships: Search,
  saved: Bookmark,
  tracking: SquarePen,
};
