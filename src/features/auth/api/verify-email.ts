import { apiClient } from '@/lib/api-client';
import type { EmailVerificationResponse } from './email-verification.types';

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export function verifyEmail(payload: VerifyEmailRequest) {
  return apiClient<EmailVerificationResponse>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
