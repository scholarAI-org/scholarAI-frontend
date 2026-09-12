import { apiClient } from '@/lib/api-client';
import type { PasswordRecoveryResponse } from './password-recovery.types';

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export function resetPassword(payload: ResetPasswordRequest) {
  return apiClient<PasswordRecoveryResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
