import { apiClient } from '@/lib/api-client';
import type { Token } from './login';

export async function googleAuth(credential: string): Promise<Token> {
  return apiClient<Token>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}
