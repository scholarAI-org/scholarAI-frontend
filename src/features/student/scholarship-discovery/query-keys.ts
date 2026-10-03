import type { DiscoveryQuery } from './types';
// Grid/List is presentation state and never part of any key.
export const studentScholarshipKeys = {
  all: ['student-scholarships'] as const,
  discoveries: () => [...studentScholarshipKeys.all, 'discoveries'] as const,
  discovery: (query: DiscoveryQuery) => [...studentScholarshipKeys.discoveries(), query] as const,
  details: () => [...studentScholarshipKeys.all, 'details'] as const,
  detail: (id: number) => [...studentScholarshipKeys.details(), id] as const,
  savedLists: () => [...studentScholarshipKeys.all, 'saved'] as const,
  // GET /api/scholarships/saved is unpaged.
  saved: () => [...studentScholarshipKeys.savedLists(), 'list'] as const,
  filterOptions: () => [...studentScholarshipKeys.all, 'filter-options'] as const,
};
