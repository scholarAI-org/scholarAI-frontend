import { useMutation, useQueryClient } from '@tanstack/react-query';
import { googleAuth } from '../api/google-auth';
import { useRouter } from '@/i18n/navigation';
import { setToken } from '@/lib/auth-storage';
import { useSearchParams } from 'next/navigation';

export function useGoogleAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  return useMutation({
    mutationFn: (credential: string) => googleAuth(credential),
    onSuccess: (data) => {
      // Clear previous query cache so user profile gets freshly fetched
      queryClient.clear();
      // Store returned backend application JWT token
      setToken(data.access_token, false);
      // Respect redirect query parameter if provided, otherwise default to /profile
      const redirect = searchParams?.get('redirect') || '/profile';
      router.push(redirect);
    },
  });
}
