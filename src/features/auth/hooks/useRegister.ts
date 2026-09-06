import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register } from '../api/register';
import { login } from '../api/login';
import { useRouter } from '@/i18n/navigation';
import { setToken } from '@/lib/auth-storage';
import type { RegisterFormData } from '../schemas/create-register.schema';

const emailVerificationEnabled = process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED !== 'false';

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: RegisterFormData) => {
      await register(credentials);
      return emailVerificationEnabled ? null : login(credentials);
    },
    onSuccess: (session) => {
      if (!session) {
        router.push('/register-success');
        return;
      }

      queryClient.clear();
      setToken(session.access_token, false);
      router.push('/profile');
    },
  });
}
