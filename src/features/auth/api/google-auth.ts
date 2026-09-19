import { apiClient } from '@/lib/api-client';

export async function googleAuth(credential: string): Promise<unknown> {
  return apiClient<unknown>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}
