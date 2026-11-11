import { useMutation } from '@tanstack/react-query';
import { changePassword } from '../api/change-password';

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
