import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../api/get-current-user';
import { ApiError } from '@/lib/api-client';

export const currentUserQueryKey = ['auth', 'current-user'] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,

    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
  });
}
