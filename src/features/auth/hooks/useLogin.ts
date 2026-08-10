import { useMutation } from '@tanstack/react-query';
import { login } from '../api/login';
import { setToken } from '@/lib/setToken';
import { useRouter } from '../../../../i18n/navigation';

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
