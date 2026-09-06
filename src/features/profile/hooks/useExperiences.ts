import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '../query-keys';
import { createExperience, updateExperience, deleteExperience } from '../api/experiences-api';
import type { ExperienceCreate, ExperienceUpdate } from '../schemas/experiences.schema';
import { useProfile } from './useProfile';

export function useExperiences() {
  const { data, ...rest } = useProfile();
  return {
    ...rest,
    data: data.experiences,
  };
}

export function useCreateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExperienceCreate) => createExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.fullProfile() });
    },
  });
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExperienceUpdate }) =>
      updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.fullProfile() });
    },
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.fullProfile() });
    },
  });
}
