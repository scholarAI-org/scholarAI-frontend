import { apiClient } from '@/lib/api-client';

export async function logout(): Promise<void> {
  await apiClient<unknown>('/auth/logout', {
    method: 'POST',
  });
}
