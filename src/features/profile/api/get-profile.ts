import { apiClient, ApiError } from '@/lib/api-client';
import {
  type FullProfileApi,
  emptyFullProfile,
  normalizeFullProfile,
} from '../schemas/full-profile-api.schema';

export async function getProfile(signal?: AbortSignal): Promise<FullProfileApi> {
  try {
    const response = await apiClient<unknown>('/profile', {
      method: 'GET',
      signal,
    });
    return normalizeFullProfile(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return emptyFullProfile;
    }
    throw error;
  }
}
