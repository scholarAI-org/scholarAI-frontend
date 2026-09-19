import { apiClient } from '@/lib/api-client';
import type { SkillsAndLanguages } from '../schemas/skills-languages.schema';

export async function getSkillsAndLanguages(): Promise<SkillsAndLanguages> {
  return apiClient<SkillsAndLanguages>('/profile/skills-and-languages', {
    method: 'GET',
  });
}

export async function updateSkillsAndLanguages(
  data: SkillsAndLanguages
): Promise<SkillsAndLanguages> {
  return apiClient<SkillsAndLanguages>('/profile/skills-and-languages', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
