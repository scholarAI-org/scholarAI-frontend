import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '../query-keys';
import {
  getPersonalInformationCompletion,
  toPersonalInformationForm,
} from '../lib/personal-information';
import { getPreferencesCompletion, toPreferencesForm } from '../lib/preferences';
import {
  toAcademicInformationForm,
  getAcademicInformationCompletion,
} from '../lib/academic-information';
import {
  getDocumentsCompletion,
  getSkillsCompletion,
  getExperiencesCompletion,
} from '../lib/progress';
import type { FullProfileApi } from '../schemas/full-profile-api.schema';

type StepId = 'personal' | 'academic' | 'documents' | 'skills' | string;

export function useProfileProgress() {
  const queryClient = useQueryClient();

  const getCompletion = useCallback(
    (stepId: StepId): number => {
      const fullProfile = queryClient.getQueryData<FullProfileApi>(profileKeys.fullProfile());
      switch (stepId) {
        case 'personal': {
          const personal = fullProfile?.personal;
          if (!personal) return 0;
          try {
            return getPersonalInformationCompletion(toPersonalInformationForm(personal));
          } catch {
            return 0;
          }
        }
        case 'academic': {
          const academic = fullProfile?.academic;
          if (!academic) return 0;
          try {
            return getAcademicInformationCompletion(toAcademicInformationForm(academic));
          } catch {
            return 0;
          }
        }
        case 'documents': {
          return getDocumentsCompletion(fullProfile?.documents);
        }
        case 'skills': {
          return getSkillsCompletion(fullProfile?.skills_languages);
        }
        case 'activities': {
          return getExperiencesCompletion(fullProfile?.experiences);
        }
        case 'preferences': {
          const preferences = fullProfile?.preferences;
          if (!preferences) return 0;
          try {
            return getPreferencesCompletion(toPreferencesForm(preferences));
          } catch {
            return 0;
          }
        }
        default:
          return 0;
      }
    },
    [queryClient]
  );

  const isStepCompleted = useCallback(
    (stepId: StepId): boolean => {
      return getCompletion(stepId) === 100;
    },
    [getCompletion]
  );

  const notifySaved = useCallback(
    async (_stepId: StepId) => {
      void _stepId;
      const queryKey = profileKeys.fullProfile();
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.refetchQueries({ queryKey });
    },
    [queryClient]
  );

  return {
    getCompletion,
    isStepCompleted,
    notifySaved,
  } as const;
}
