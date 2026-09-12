import { useMutation } from '@tanstack/react-query';
import { resendVerificationOtp } from '../api/resend-verification-otp';

export function useResendVerificationOtp() {
  return useMutation({ mutationFn: resendVerificationOtp });
}
