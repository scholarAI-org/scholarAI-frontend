import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '../api/login';
import { useRouter } from '@/i18n/navigation';
import { getCurrentUser } from '../api/get-current-user';
import { currentUserQueryKey } from './useCurrentUser';
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: currentUserQueryKey });

      const user = await getCurrentUser();
      queryClient.setQueryData(currentUserQueryKey, user);

      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/student/profile');
    },
  });
}
