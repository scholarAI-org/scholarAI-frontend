import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAcademicInformation } from '../api/update-academic-information';
import { profileKeys } from '../query-keys';
import { normalizeAcademicInformation } from '../schemas/academic-information-api.schema';
import type { FullProfileApi } from '../schemas/full-profile-api.schema';

export function useUpdateAcademicInformation() {
  const queryClient = useQueryClient();
  const queryKey = profileKeys.fullProfile();

  return useMutation({
    mutationFn: updateAcademicInformation,
    retry: false,
    onMutate: async (academicInfo) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<FullProfileApi>(queryKey);
      queryClient.setQueryData<FullProfileApi>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          academic: normalizeAcademicInformation(academicInfo),
        };
      });

      return { previous };
    },
    onError: (_error, _academicInfo, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (saved, submitted) => {
      queryClient.setQueryData<FullProfileApi>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          academic: normalizeAcademicInformation({ ...submitted, ...(saved ?? {}) }),
        };
      });
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
