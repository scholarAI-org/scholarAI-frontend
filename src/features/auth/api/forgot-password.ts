import { apiClient } from '@/lib/api-client';
import type { ForgotPasswordFormData } from '../schemas/forgot-password.schema';
import type { PasswordRecoveryResponse } from './password-recovery.types';

export async function forgotPassword(
  credentials: ForgotPasswordFormData
): Promise<PasswordRecoveryResponse> {
  return apiClient<PasswordRecoveryResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}
