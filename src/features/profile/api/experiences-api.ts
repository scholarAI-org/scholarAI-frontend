import { apiClient } from '@/lib/api-client';
import type { Experience, ExperienceCreate, ExperienceUpdate } from '../schemas/experiences.schema';

export async function getExperiences(): Promise<Experience[]> {
  return apiClient<Experience[]>('/profile/experiences', {});
}

export async function createExperience(data: ExperienceCreate): Promise<Experience> {
  return apiClient<Experience>('/profile/experiences', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExperience(id: number, data: ExperienceUpdate): Promise<Experience> {
  return apiClient<Experience>(`/profile/experiences/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteExperience(id: number): Promise<void> {
  return apiClient<void>(`/profile/experiences/${id}`, {
    method: 'DELETE',
  });
}
