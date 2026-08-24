import { useMutation } from '@tanstack/react-query';
import { login } from '../api/login';
import { useRouter } from '@/i18n/navigation';
import { setToken } from '@/lib/auth-storage';

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: login,
    onSuccess: (data, variables) => {
      // variables هي نفس الـ object يلي انبعت لـ mutate(...) — فيها rememberMe
      setToken(data.access_token, variables.rememberMe);
      router.push('/dashboard');
    },
  });
}
