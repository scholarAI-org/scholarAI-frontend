import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePersonalInformation } from '../api/update-personal-information';
import { profileKeys } from '../query-keys';
import { normalizePersonalInformation } from '../schemas/personal-information-api.schema';
import type { FullProfileApi } from '../schemas/full-profile-api.schema';

export function useUpdatePersonalInformation() {
  const queryClient = useQueryClient();
  const queryKey = profileKeys.fullProfile();

  return useMutation({
    mutationFn: updatePersonalInformation,
    retry: false,
    onMutate: async (personalInfo) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<FullProfileApi>(queryKey);
      queryClient.setQueryData<FullProfileApi>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          personal: normalizePersonalInformation(personalInfo),
        };
      });

      return { previous };
    },
    onError: (_error, _personalInfo, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (saved, submitted) => {
      queryClient.setQueryData<FullProfileApi>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          personal: normalizePersonalInformation({ ...submitted, ...(saved ?? {}) }),
        };
      });
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
