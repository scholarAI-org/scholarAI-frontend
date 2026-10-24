import type { HomeSectionId } from './config/home-sections';

export type HomeSourceKind = 'real' | 'mock';

// Home-local keys. Saved scholarships and the latest-scholarships list reuse the
// shared studentScholarshipKeys so bookmark changes keep Home fresh.
// Source keys end with the source kind so a cached demo result can never be
// served once the real API is wired.
export const studentHomeKeys = {
  all: ['student-home'] as const,
  profileCompletion: () => [...studentHomeKeys.all, 'profile-completion'] as const,
  tracked: () => [...studentHomeKeys.all, 'tracked'] as const,
  source: (section: HomeSectionId, kind: HomeSourceKind) =>
    [...studentHomeKeys.all, section, kind] as const,
};
