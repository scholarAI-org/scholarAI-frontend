import { useMutation } from '@tanstack/react-query';
import { register } from '../api/register';
import { useRouter } from '@/i18n/navigation';

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      router.push('/register-success');
    },
  });
}
