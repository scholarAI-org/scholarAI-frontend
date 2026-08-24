import { apiClient } from '@/lib/api-client';
import type { ForgotPasswordFormData } from '../schemas/forgot-password.schema';

export async function forgotPassword(credentials: ForgotPasswordFormData): Promise<void> {
  return apiClient<void>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}
