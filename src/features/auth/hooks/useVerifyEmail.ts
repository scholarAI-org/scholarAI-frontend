import { useMutation } from '@tanstack/react-query';
import { verifyEmail } from '../api/verify-email';

export function useVerifyEmail() {
  return useMutation({ mutationFn: verifyEmail });
}
