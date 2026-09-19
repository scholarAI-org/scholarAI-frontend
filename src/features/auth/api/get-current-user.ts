import { apiClient } from '@/lib/api-client';
import { AuthenticatedUser, type UserRole } from '../types';

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  return apiClient<AuthenticatedUser>('auth/me', {
    method: 'GET',
  });
}
