import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSkillsAndLanguages } from '../api/skills-languages-api';
import { profileKeys } from '../query-keys';
import { useProfile } from './useProfile';
import {
  normalizeSkillsAndLanguages,
  type FullProfileApi,
} from '../schemas/full-profile-api.schema';

export function useSkillsAndLanguages() {
  const { data, ...rest } = useProfile();
  return {
    ...rest,
    data: data.skills_languages,
  };
}

export function useUpdateSkillsAndLanguages() {
  const queryClient = useQueryClient();
  const queryKey = profileKeys.fullProfile();

  return useMutation({
    mutationFn: updateSkillsAndLanguages,
    retry: false,
    onMutate: async (skillsLangs) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FullProfileApi>(queryKey);
      queryClient.setQueryData<FullProfileApi>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          skills_languages: normalizeSkillsAndLanguages(skillsLangs),
        };
      });
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (saved, submitted) => {
      queryClient.setQueryData<FullProfileApi>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          skills_languages: normalizeSkillsAndLanguages({ ...submitted, ...(saved ?? {}) }),
        };
      });
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
