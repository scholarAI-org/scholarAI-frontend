'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ProfileSummaryCard from '@/components/profile/ProfileSummaryCard';
import Stepper from '@/components/profile/Stepper';
import type { ProfileStep, ProfileUser } from '@/components/profile/types';
import { AcademicInformationSection } from '@/features/profile/components/AcademicInformationSection';
import { DocumentsSection } from '@/features/profile/components/DocumentsSection';
import { PersonalInformationSection } from '@/features/profile/components/PersonalInformationSection';
import { SkillsAndLanguagesSection } from '@/features/profile/components/SkillsAndLanguagesSection';
import { ExperiencesAndActivitiesSection } from '@/features/profile/components/ExperiencesAndActivitiesSection';
import { PreferencesSection } from '@/features/profile/components/PreferencesSection';
import { useProfileProgress } from '@/features/profile/hooks/useProfileProgress';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useUploadAvatar } from '@/features/profile/hooks/useUploadAvatar';
import { ApiError } from '@/lib/api-client';
import { AvatarUploadError } from '@/features/profile/schemas/avatar.schema';
import {
  getPersonalInformationCompletion,
  toPersonalInformationForm,
} from '@/features/profile/lib/personal-information';

const STEP_IDS = [
  'personal',
  'academic',
  'preferences',
  'skills',
  'activities',
  'documents',
] as const;

function getInitials(name: string, fallback: string) {
  return name.trim().charAt(0) || fallback;
}

function joinPresent(values: Array<string | null | undefined>, separator: string) {
  return values
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(separator);
}

// Validation and storage failures carry a code; backend errors keep the API's own
// message; anything else (network) falls back to the generic upload failure.
function getAvatarErrorMessage(
  error: unknown,
  t: (key: `avatarErrors.${AvatarUploadError['code']}`) => string
): string | null {
  if (!error) return null;
  if (error instanceof AvatarUploadError) return t(`avatarErrors.${error.code}`);
  if (error instanceof ApiError && error.message) return error.message;
  return t('avatarErrors.uploadFailed');
}

// Profile content only; the student frame comes from StudentShell in the route layout.
export function ProfilePageContent() {
  const [activeStepId, setActiveStepId] = useState<string>('personal');
  const t = useTranslations('Profile');
  const academicT = useTranslations('AcademicInformation');
  const profileQuery = useProfile();
  const avatarUpload = useUploadAvatar();
  const personal = profileQuery.data.personal;
  const academic = profileQuery.data.academic;
  const progress = useProfileProgress();
  const fullName = joinPresent([personal?.full_name_ar, personal?.full_name_en], ' ');
  const profileName = fullName || personal?.email || t('fallbackName');
  const personalCompletion = personal
    ? getPersonalInformationCompletion(toPersonalInformationForm(personal))
    : 0;
  const summaryCompletion = {
    label: t('completionLabel'),
    value: profileQuery.data.profile_completion_percentage ?? 0,
  };
  const fieldOfStudy = academic?.field_of_study
    ? academicT.has(`fieldsOfStudy.${academic.field_of_study}`)
      ? academicT(`fieldsOfStudy.${academic.field_of_study}`)
      : academic.field_of_study
    : undefined;
  const location = personal?.city;
  const profileUser: ProfileUser = {
    name: profileName,
    initials: getInitials(personal?.full_name_ar || profileName, t('initialsFallback')),
    avatarUrl: profileQuery.data.avatar_url,
    headline: joinPresent(
      [fieldOfStudy, joinPresent([academic?.institution, location], ' - ')],
      ' • '
    ),
  };
  const profileSteps = STEP_IDS.map((id, index): ProfileStep => {
    const step: ProfileStep = {
      id,
      number: String(index + 1).padStart(2, '0'),
      label: t(`steps.${id}`),
      status: id === 'personal' ? 'active' : 'upcoming',
    };
    let status = step.status;
    if (step.id === 'personal' && personal && personalCompletion === 100) {
      status = 'completed';
    }
    if (progress.isStepCompleted(step.id)) {
      status = 'completed';
    }
    if (step.id === activeStepId) {
      status = 'active';
    } else if (step.id !== 'personal' && status === 'active') {
      status = 'upcoming'; // Reset other active steps if necessary
    }
    return { ...step, status };
  });
  return (
    <div className="mx-auto max-w-[1156px] space-y-6">
      <ProfileSummaryCard
        user={profileUser}
        completion={summaryCompletion}
        onChangeAvatar={async (file) => {
          await avatarUpload.mutateAsync(file);
        }}
        isAvatarUploading={avatarUpload.isPending}
        avatarError={getAvatarErrorMessage(avatarUpload.error, t)}
      />
      <Stepper steps={profileSteps} onStepClick={setActiveStepId} />
      {activeStepId === 'personal' && (
        <PersonalInformationSection
          onSavedNext={() =>
            void progress.notifySaved('personal').then(() => setActiveStepId('academic'))
          }
        />
      )}
      {activeStepId === 'academic' && (
        <AcademicInformationSection
          onSavedNext={() =>
            void progress.notifySaved('academic').then(() => setActiveStepId('preferences'))
          }
        />
      )}
      {activeStepId === 'preferences' && (
        <PreferencesSection
          onSavedNext={() =>
            void progress.notifySaved('preferences').then(() => setActiveStepId('skills'))
          }
        />
      )}
      {activeStepId === 'skills' && (
        <SkillsAndLanguagesSection
          onSavedNext={() =>
            void progress.notifySaved('skills').then(() => setActiveStepId('activities'))
          }
        />
      )}
      {activeStepId === 'activities' && (
        <ExperiencesAndActivitiesSection
          onSavedNext={() =>
            void progress.notifySaved('activities').then(() => setActiveStepId('documents'))
          }
        />
      )}
      {activeStepId === 'documents' && (
        <DocumentsSection
          onSavedNext={() => {
            void progress.notifySaved('documents');
          }}
        />
      )}
      {activeStepId !== 'personal' &&
        activeStepId !== 'academic' &&
        activeStepId !== 'documents' &&
        activeStepId !== 'skills' &&
        activeStepId !== 'activities' &&
        activeStepId !== 'preferences' && (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-[#e2e8f0] bg-white/50 text-[#465668]">
            {t('sectionUnderDevelopment')}
          </div>
        )}
    </div>
  );
}
