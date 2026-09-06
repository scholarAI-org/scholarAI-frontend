import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePreferences } from '../api/update-preferences';
import { profileKeys } from '../query-keys';
import { normalizePreferences } from '../schemas/preferences-api.schema';
import type { FullProfileApi } from '../schemas/full-profile-api.schema';

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const queryKey = profileKeys.fullProfile();

  return useMutation({
    mutationFn: updatePreferences,
    retry: false,
    onMutate: async (preferences) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<FullProfileApi>(queryKey);
      queryClient.setQueryData<FullProfileApi>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          preferences: normalizePreferences(preferences),
        };
      });

      return { previous };
    },
    onError: (_error, _preferences, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<FullProfileApi>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          preferences: normalizePreferences(saved),
        };
      });
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
