import { apiClient, ApiError } from '@/lib/api-client';
import { parseProfileCompletion } from '../schemas/profile-completion.schema';

// GET /profile -> profile_completion_percentage (0-100). No profile yet (404) is 0%.
export async function getProfileCompletion(signal?: AbortSignal): Promise<number> {
  try {
    return parseProfileCompletion(await apiClient<unknown>('/profile', { signal }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return 0;
    throw error;
  }
}
