import type { DiscoveryQuery } from './types';
export const studentScholarshipKeys = {
  all: ['student-scholarships'] as const,
  discoveries: () => [...studentScholarshipKeys.all, 'discoveries'] as const,
  discovery: (query: DiscoveryQuery) => [...studentScholarshipKeys.discoveries(), query] as const,
  details: () => [...studentScholarshipKeys.all, 'details'] as const,
  detail: (id: number) => [...studentScholarshipKeys.details(), id] as const,
  savedLists: () => [...studentScholarshipKeys.all, 'saved'] as const,
  saved: (page: number, pageSize: number) =>
    [...studentScholarshipKeys.savedLists(), page, pageSize] as const,
  filterOptions: () => [...studentScholarshipKeys.all, 'filter-options'] as const,
};
