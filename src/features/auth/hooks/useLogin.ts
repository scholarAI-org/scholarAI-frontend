import { useMutation } from '@tanstack/react-query';
import { login } from '../api/login';
import { useRouter } from '../../../../i18n/navigation';
import { setToken } from '@/lib/auth-storage';
export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setToken(data.access_token);
      router.push('/dashboard');
    },
  });
}
