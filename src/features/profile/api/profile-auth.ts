import { ApiError } from '@/lib/api-client';
import { getToken } from '@/lib/auth-storage';

export function getProfileAuthHeaders(): { Authorization: string } {
  const token = getToken();
  if (!token) {
    throw new ApiError('Authentication required', [], 401);
  }
  return { Authorization: `Bearer ${token}` };
}
