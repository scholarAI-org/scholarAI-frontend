import { apiClient } from '@/lib/api-client';
import type { LoginFormData } from '../schemas/login.schema';

type Token = {
  access_token: string;
  token_type: string;
};

export async function login(credentials: LoginFormData): Promise<Token> {
  return apiClient<Token>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
}
