import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register } from '../api/register';
import { login } from '../api/login';
import { useRouter } from '@/i18n/navigation';
import { setToken } from '@/lib/auth-storage';
import type { RegisterFormData } from '../schemas/create-register.schema';

import { ApiError } from '@/lib/api-client';

const emailVerificationEnabled = process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED !== 'false';

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: RegisterFormData) => {
      try {
        await register(credentials);
        return emailVerificationEnabled ? null : login(credentials);
      } catch (err) {
        if (err instanceof ApiError && err.status === 503) {
          // Account was created as unverified, but initial email delivery failed.
          // Proceed to verify-email page so user can use resend-verification-otp.
          return null;
        }
        throw err;
      }
    },
    onSuccess: (session, credentials) => {
      if (!session) {
        router.push(`/verify-email?email=${encodeURIComponent(credentials.email)}`);
        return;
      }

      queryClient.clear();
      setToken(session.access_token, false);
      router.push('/profile');
    },
  });
}
