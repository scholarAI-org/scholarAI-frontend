import { apiClient } from '@/lib/api-client';
import type { EmailVerificationResponse } from './email-verification.types';

export interface ResendVerificationOtpRequest {
  email: string;
}

export function resendVerificationOtp(payload: ResendVerificationOtpRequest) {
  return apiClient<EmailVerificationResponse>('/auth/resend-verification-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
