import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '../api/forgot-password';

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
  });
}
