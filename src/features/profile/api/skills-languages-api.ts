import { apiClient } from '@/lib/api-client';
import { getProfileAuthHeaders } from './profile-auth';
import type { SkillsAndLanguages } from '../schemas/skills-languages.schema';

export async function getSkillsAndLanguages(): Promise<SkillsAndLanguages> {
  return apiClient<SkillsAndLanguages>('/profile/skills-and-languages', {
    method: 'GET',
    headers: getProfileAuthHeaders(),
  });
}

export async function updateSkillsAndLanguages(
  data: SkillsAndLanguages
): Promise<SkillsAndLanguages> {
  return apiClient<SkillsAndLanguages>('/profile/skills-and-languages', {
    method: 'PUT',
    headers: getProfileAuthHeaders(),
    body: JSON.stringify(data),
  });
}
