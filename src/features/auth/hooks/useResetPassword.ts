import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '../api/reset-password';

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword });
}
