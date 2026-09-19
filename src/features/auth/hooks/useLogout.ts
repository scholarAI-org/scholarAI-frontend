import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logout } from '../api/logout';
import { useRouter } from '@/i18n/navigation';

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,

    onSuccess: () => {
      // لم تعد بيانات المستخدم الحالي صالحة
      queryClient.clear();

      router.replace('/login');
    },
  });
}
