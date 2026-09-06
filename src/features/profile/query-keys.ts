export const profileKeys = {
  all: ['profile'] as const,
  fullProfile: () => [...profileKeys.all, 'full'] as const,
  personalInformation: () => [...profileKeys.all, 'personal-info'] as const,
  academicInformation: () => [...profileKeys.all, 'academic-info'] as const,
  documents: () => [...profileKeys.all, 'documents'] as const,
  skillsAndLanguages: () => [...profileKeys.all, 'skills-languages'] as const,
  experiences: () => [...profileKeys.all, 'experiences'] as const,
  preferences: () => [...profileKeys.all, 'preferences'] as const,
};
