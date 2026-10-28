import { studentScholarshipKeys } from '@/features/student/scholarship-discovery/query-keys';

// Per-scholarship data that is not part of the details response. Kept under the
// same root as the details key so one invalidation of that root reaches them.
export const scholarshipExtrasKeys = {
  tracking: (id: number) => [...studentScholarshipKeys.all, 'tracking', id] as const,
  eligibility: (id: number) => [...studentScholarshipKeys.all, 'eligibility', id] as const,
};
