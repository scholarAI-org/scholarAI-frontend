'use client';

import { useState } from 'react';
import {
  Bell,
  Bookmark,
  FilePenLine,
  GraduationCap,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/profile/Navbar';
import ProfileLayout from '@/components/profile/ProfileLayout';
import ProfileSummaryCard from '@/components/profile/ProfileSummaryCard';
import Sidebar from '@/components/profile/Sidebar';
import Stepper from '@/components/profile/Stepper';
import type { ProfileStep, ProfileUser, SidebarMenuItem } from '@/components/profile/types';
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
import {
  getPersonalInformationCompletion,
  toPersonalInformationForm,
} from '@/features/profile/lib/personal-information';

const steps: ProfileStep[] = [
  { id: 'personal', number: '01', label: 'المعلومات الشخصية', status: 'active' },
  { id: 'academic', number: '02', label: 'المعلومات الأكاديمية', status: 'upcoming' },
  { id: 'preferences', number: '03', label: 'التفضيلات', status: 'upcoming' },
  { id: 'skills', number: '04', label: 'المهارات واللغات', status: 'upcoming' },
  { id: 'activities', number: '05', label: 'الخبرات و الأنشطة', status: 'upcoming' },
  { id: 'documents', number: '06', label: 'الوثائق', status: 'upcoming' },
];

const sidebarItems: SidebarMenuItem[] = [
  { id: 'home', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'profile', label: 'الملف الشخصي', icon: UserRound, active: true },
  { id: 'scholarships', label: 'البحث عن منح', icon: Search },
  { id: 'saved', label: 'المحفوظات', icon: Bookmark },
  { id: 'applications', label: 'تتبع الطلبات', icon: FilePenLine },
  { id: 'documents', label: 'تحسين المستندات', icon: Sparkles },
  { id: 'notifications', label: 'الاشعارات', icon: Bell, badge: '2' },
  { id: 'settings', label: 'الاعدادات', icon: Settings },
];

function getInitials(name: string) {
  return name.trim().charAt(0) || '؟';
}

function joinPresent(values: Array<string | null | undefined>, separator: string) {
  return values
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(separator);
}

export default function ProfilePage() {
  const [activeStepId, setActiveStepId] = useState<string>('personal');
  const academicT = useTranslations('AcademicInformation');
  const profileQuery = useProfile();
  const avatarUpload = useUploadAvatar();
  const personal = profileQuery.data.personal;
  const academic = profileQuery.data.academic;
  const progress = useProfileProgress();
  const fullName = joinPresent([personal?.first_name, personal?.last_name], ' ');
  const profileName = fullName || personal?.email || 'الملف الشخصي';
  const personalCompletion = personal
    ? getPersonalInformationCompletion(toPersonalInformationForm(personal))
    : 0;
  const summaryCompletion = {
    label: 'اكتمال الملف الشخصي',
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
    initials: getInitials(personal?.first_name || profileName),
    avatarUrl: profileQuery.data.avatar_url,
    headline: joinPresent(
      [fieldOfStudy, joinPresent([academic?.institution, location], ' - ')],
      ' • '
    ),
  };
  const sidebarUser: ProfileUser = {
    name: fullName || 'طالب',
    initials: getInitials(fullName),
    role: 'طالب',
    roleIcon: <GraduationCap className="h-3 w-3" />,
  };
  const profileSteps = steps.map((step): ProfileStep => {
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
    <ProfileLayout
      header={
        <Navbar
          title="الملف الشخصي"
          subtitle="كلما اكتمل ملفك، كانت التوصيات ونسب التوافق أدق."
          hasUnreadNotifications
          user={{ name: profileName, initials: getInitials(profileName) }}
        />
      }
      sidebar={
        <Sidebar
          brand={{
            name: 'PsScholar',
            tagline: 'منصة المنح الفلسطينية',
            logoSrc: '/images/logo-icon.png',
          }}
          user={sidebarUser}
          items={sidebarItems}
          logoutLabel="تسجيل الخروج"
        />
      }
    >
      <div className="mx-auto max-w-[1156px] space-y-6">
        <ProfileSummaryCard
          user={profileUser}
          completion={summaryCompletion}
          onChangeAvatar={async (file) => {
            await avatarUpload.mutateAsync(file);
          }}
          isAvatarUploading={avatarUpload.isPending}
          avatarError={
            avatarUpload.error instanceof ApiError || avatarUpload.error instanceof Error
              ? avatarUpload.error.message
              : null
          }
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
              هذا القسم قيد التطوير
            </div>
          )}
      </div>
    </ProfileLayout>
  );
}
