'use client';

import { useTranslations } from 'next-intl';
import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { Input } from '@/components/ui/Input';
import ProfileDropdown from '@/components/profile/ProfileDropdown';
import { ApiError } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useSkillsAndLanguages, useUpdateSkillsAndLanguages } from '../hooks/useSkillsAndLanguages';
import { ProfileFormActions } from '@/components/profile/ProfileFormActions';
import { ProfileSaveContinueButton } from '@/components/profile/ProfileSaveContinueButton';
import type { LanguageProficiency } from '../schemas/skills-languages.schema';

type Props = {
  onSavedNext?: () => void;
};

const emptySubscribe = () => () => undefined;

export function SkillsAndLanguagesSection({ onSavedNext }: Props) {
  const t = useTranslations('SkillsLanguages');
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const query = useSkillsAndLanguages();
  const mutation = useUpdateSkillsAndLanguages();

  const data = query.data;

  const authError = [query.error, mutation.error].some(
    (error) => error instanceof ApiError && (error.status === 401 || error.status === 403)
  );

  // Local state for Add Language Modal
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState('');
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const { data: cdnLanguages, isLoading: isLanguagesLoading } = useQuery({
    queryKey: ['cdn-languages'],
    queryFn: async () => {
      const res = await fetch('https://cdn.simplelocalize.io/public/v1/languages');
      if (!res.ok) throw new Error('Failed to fetch languages');
      return res.json() as Promise<{ name: string; name_local: string; iso_639_1: string }[]>;
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const filteredLanguages = (cdnLanguages || []).filter(
    (lang) =>
      lang.name.toLowerCase().includes(newLanguageName.toLowerCase()) ||
      lang.name_local.toLowerCase().includes(newLanguageName.toLowerCase())
  );
  const [newLanguageLevel, setNewLanguageLevel] = useState<LanguageProficiency | ''>('');

  // Local state for Add Skill Modal
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('technical');
  const [pendingSkills, setPendingSkills] = useState<string[]>([]);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [skillError, setSkillError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'language' | 'skill';
    index: number;
    name: string;
  } | null>(null);

  const normalizeString = (val: string) => val.trim().toLowerCase().replace(/\s+/g, ' ');

  const skillCategories = [
    { id: 'technical', label: t('categories.technical') },
    { id: 'analytical', label: t('categories.analytical') },
    { id: 'communication', label: t('categories.communication') },
    { id: 'leadership', label: t('categories.leadership') },
    { id: 'other', label: t('categories.other') },
  ];

  const skillSuggestions: Record<string, string[]> = {
    technical: [
      'JavaScript',
      'TypeScript',
      'SQL',
      'Java',
      'Node.js',
      'Machine Learning',
      'Linux',
      'Docker',
      'Git',
      'Data Analysis',
    ],
    analytical: [
      'Problem Solving',
      'Critical Thinking',
      'Data Modeling',
      'Business Analysis',
      'Research',
    ],
    communication: [
      'Public Speaking',
      'Writing',
      'Presentation',
      'Negotiation',
      'Active Listening',
    ],
    leadership: [
      'Project Management',
      'Team Building',
      'Mentoring',
      'Conflict Resolution',
      'Strategic Planning',
    ],
    other: ['Figma', 'Photoshop', 'Microsoft Office', 'Agile', 'Scrum'],
  };

  const levelOptions = [
    {
      value: 'BEGINNER',
      label: t('levels.BEGINNER.title'),
      subtitle: t('levels.BEGINNER.subtitle'),
    },
    {
      value: 'INTERMEDIATE',
      label: t('levels.INTERMEDIATE.title'),
      subtitle: t('levels.INTERMEDIATE.subtitle'),
    },
    {
      value: 'ADVANCED',
      label: t('levels.ADVANCED.title'),
      subtitle: t('levels.ADVANCED.subtitle'),
    },
    { value: 'NATIVE', label: t('levels.NATIVE.title'), subtitle: t('levels.NATIVE.subtitle') },
  ];

  // Helper mapping for ProfileDropdown options
  const dropdownLevelOptions = levelOptions.map((l) => ({ value: l.value, label: l.label }));

  function confirmDelete() {
    if (!itemToDelete || !data) return;
    if (itemToDelete.type === 'language') {
      const currentLangs = data.languages || [];
      const updatedLangs = currentLangs.filter((_, i) => i !== itemToDelete.index);
      mutation.mutate(
        { ...data, languages: updatedLangs },
        { onSuccess: () => setItemToDelete(null) }
      );
    } else {
      const currentSkills = data.skills || [];
      const updatedSkills = currentSkills.filter((_, i) => i !== itemToDelete.index);
      mutation.mutate(
        { ...data, skills: updatedSkills },
        { onSuccess: () => setItemToDelete(null) }
      );
    }
  }

  function handleRemoveLanguage(indexToRemove: number) {
    if (!data) return;
    const name = data.languages?.[indexToRemove]?.name || '';
    setItemToDelete({ type: 'language', index: indexToRemove, name });
  }

  function handleRemoveSkill(skillToRemove: string) {
    if (!data) return;
    const index = (data.skills || []).findIndex((s) => s === skillToRemove);
    setItemToDelete({ type: 'skill', index, name: skillToRemove });
  }

  function handleAddLanguage() {
    if (!data || !newLanguageName.trim() || !newLanguageLevel) return;

    const normalizedNewLang = normalizeString(newLanguageName);
    const isDuplicate = data.languages.some(
      (lang) => normalizeString(lang.name) === normalizedNewLang
    );

    if (isDuplicate) {
      setLanguageError(t('languageExistsError'));
      return;
    }

    setLanguageError(null);
    const newLanguages = [
      ...data.languages,
      {
        name: newLanguageName.trim(),
        code: newLanguageCode,
        proficiency: newLanguageLevel as LanguageProficiency,
      },
    ];
    mutation.mutate(
      { ...data, languages: newLanguages },
      {
        onSuccess: () => {
          setNewLanguageName('');
          setNewLanguageLevel('');
          setNewLanguageCode('');
          setShowAddLanguage(false);
        },
      }
    );
  }

  function handleUpdateLanguageLevel(index: number, newLevel: string) {
    if (!data) return;
    const newLanguages = [...data.languages];
    newLanguages[index] = { ...newLanguages[index], proficiency: newLevel as LanguageProficiency };
    mutation.mutate({ ...data, languages: newLanguages });
  }

  function handleAddSkill() {
    if (!data || pendingSkills.length === 0) return;

    // Filter out duplicates that might already exist in the user's saved skills (with normalization)
    const newUniqueSkills = pendingSkills.filter((skill) => {
      const normalizedSkill = normalizeString(skill);
      return !data.skills.some((existing) => normalizeString(existing) === normalizedSkill);
    });

    if (newUniqueSkills.length === 0) {
      setShowAddSkill(false);
      setPendingSkills([]);
      return;
    }

    const newSkills = [...data.skills, ...newUniqueSkills];
    mutation.mutate(
      { ...data, skills: newSkills },
      {
        onSuccess: () => {
          setPendingSkills([]);
          setNewSkillName('');
          setShowAddSkill(false);
        },
      }
    );
  }

  function handleTogglePendingSkill(skill: string) {
    setSkillError(null);
    const normalizedNewSkill = normalizeString(skill);
    const isAlreadySaved = data?.skills.some((s) => normalizeString(s) === normalizedNewSkill);

    if (isAlreadySaved) {
      setSkillError(t('skillExistsError'));
      return;
    }

    const isPending = pendingSkills.some((s) => normalizeString(s) === normalizedNewSkill);
    if (isPending) {
      setPendingSkills((prev) => prev.filter((s) => normalizeString(s) !== normalizedNewSkill));
    } else {
      setPendingSkills((prev) => [...prev, skill]);
    }
  }

  function handleCustomSkillEnter() {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;

    const normalizedNewSkill = normalizeString(trimmed);
    const isAlreadySaved = data?.skills.some((s) => normalizeString(s) === normalizedNewSkill);
    const isAlreadyPending = pendingSkills.some((s) => normalizeString(s) === normalizedNewSkill);

    if (isAlreadySaved || isAlreadyPending) {
      setSkillError(t('skillExistsError'));
      return;
    }

    setSkillError(null);
    setPendingSkills((prev) => [...prev, trimmed]);
    setNewSkillName('');
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm relative">
        <h2 className="mb-4 text-xl font-bold text-[#1e293b]">{t('title')}</h2>

        {authError ? (
          <p
            role="alert"
            className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 mb-4 text-sm text-[var(--color-text-error)]"
          >
            {t('authRequired')}{' '}
            <Link href="/login" className="font-bold underline">
              {t('login')}
            </Link>
          </p>
        ) : (
          query.isError && (
            <div
              role="alert"
              className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 mb-4 text-sm text-[var(--color-text-error)]"
            >
              {query.error instanceof ApiError ? query.error.message : 'Error fetching data'}
              <button
                type="button"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
                className="mx-2 font-bold underline"
              >
                Retry
              </button>
            </div>
          )
        )}

        {query.isPending ? (
          <div className="flex justify-center p-8 text-[var(--color-text-secondary)]">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* Languages Section */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[14px] font-bold text-[#334155]">{t('languages')}</h3>
                <button
                  type="button"
                  className="rounded-full bg-[#F3F4F6] px-4 py-1.5 text-xs font-semibold text-[#4B5563] hover:bg-[#E5E7EB] transition-colors"
                  onClick={() => setShowAddLanguage(true)}
                  disabled={authError || mutation.isPending}
                >
                  {t('addLanguage')}
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {data?.languages.map((lang, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-[32px] bg-[#F8F9FA] px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-[#1d4ed8] text-[15px]">{lang.name}</span>
                      <span className="text-xs font-medium text-[#94a3b8] mt-1">
                        {t(`levels.${lang.proficiency}.title`)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-40 hidden sm:block">
                        <ProfileDropdown
                          id={`lang-level-${idx}`}
                          value={lang.proficiency}
                          options={dropdownLevelOptions}
                          onChange={(val) => handleUpdateLanguageLevel(idx, val)}
                          disabled={authError || mutation.isPending}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(idx)}
                        disabled={authError || mutation.isPending}
                        className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="Remove"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Section */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[14px] font-bold text-[#334155]">{t('skills')}</h3>
                <button
                  type="button"
                  className="rounded-full bg-[#F3F4F6] px-4 py-1.5 text-xs font-semibold text-[#4B5563] hover:bg-[#E5E7EB] transition-colors"
                  onClick={() => setShowAddSkill(true)}
                  disabled={authError || mutation.isPending}
                >
                  {t('addSkill')}
                </button>
              </div>

              {showAddSkill && (
                <div className="flex flex-col sm:flex-row gap-3 items-center rounded-2xl border border-[#1d4ed8]/30 p-5 bg-[#1d4ed8]/5 mb-5">
                  <Input
                    id="new-skill-input"
                    placeholder={t('skillPlaceholder')}
                    value={newSkillName}
                    onChange={(e) => {
                      setNewSkillName(e.target.value);
                      setSkillError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="w-full sm:flex-1 bg-white"
                    disabled={mutation.isPending}
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={handleAddSkill}
                      disabled={!newSkillName.trim() || mutation.isPending}
                      className="bg-[#1d4ed8] text-white hover:bg-[#1e40af] flex-1 sm:flex-none"
                    >
                      {t('addBtn')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddSkill(false);
                        setNewSkillName('');
                      }}
                      disabled={mutation.isPending}
                      className="flex-1 sm:flex-none bg-white"
                    >
                      {t('cancelBtn')}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {data?.skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-[#F8F9FA] px-4 py-2 text-[14px] font-medium text-[#334155] hover:border-slate-300 transition-colors"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      disabled={authError || mutation.isPending}
                      className="text-[#94a3b8] hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Remove"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <ProfileFormActions>
              <ProfileSaveContinueButton
                onClick={() => {
                  if (!data) return;
                  mutation.mutate(data, {
                    onSuccess: () => {
                      if (typeof onSavedNext === 'function') onSavedNext();
                    },
                  });
                }}
                disabled={authError || mutation.isPending}
                isLoading={mutation.isPending}
              />
            </ProfileFormActions>
          </div>
        )}
      </div>

      {/* Add Language Modal Overlay */}
      {showAddLanguage &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a2243]/30 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="flex w-full max-w-[500px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl relative max-h-[90vh]">
              {/* Header - Fixed */}
              <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6">
                {/* Globe Icon and Title group - Right side in RTL (using items-center gap-4) */}
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#f97316]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      <path d="M2 12h20"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col text-right">
                    <h3 className="text-[18px] font-bold text-[#1e293b]">{t('modalTitle')}</h3>
                    <p className="mt-0.5 text-[13px] text-[#64748b]">{t('modalSubtitle')}</p>
                  </div>
                </div>

                {/* Close Button - Left side */}
                <button
                  onClick={() => {
                    setShowAddLanguage(false);
                    setNewLanguageName('');
                    setNewLanguageLevel('');
                    setNewLanguageCode('');
                    setLanguageError(null);
                  }}
                  disabled={mutation.isPending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f1f5f9] text-[#94a3b8] hover:bg-[#e2e8f0] transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Language Name Section */}
                <div className="mb-8">
                  <h4 className="mb-4 text-[14px] font-bold text-[#334155]">{t('languageName')}</h4>

                  {languageError && (
                    <div className="mb-3 rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]">
                      {languageError}
                    </div>
                  )}
                  <div className="relative">
                    <Input
                      id="modal-lang-name"
                      placeholder={t('searchLanguagePlaceholder')}
                      value={newLanguageName}
                      onChange={(e) => {
                        setNewLanguageName(e.target.value);
                        setNewLanguageCode(''); // Clear code if they type manually
                        setLanguageError(null);
                      }}
                      disabled={mutation.isPending}
                      className="mb-2 w-full rounded-[16px] bg-[#f8fafc] h-12"
                    />

                    {/* Search Results Dropdown */}
                    {newLanguageName && !newLanguageCode && (
                      <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-[16px] border border-slate-100 bg-white shadow-lg p-2">
                        {isLanguagesLoading ? (
                          <div className="p-3 text-sm text-slate-500 text-center">
                            {t('loadingLanguages')}
                          </div>
                        ) : filteredLanguages.length > 0 ? (
                          filteredLanguages.map((lang, index) => (
                            <button
                              key={
                                lang.iso_639_1
                                  ? `${lang.iso_639_1}-${index}`
                                  : `${lang.name}-${index}`
                              }
                              type="button"
                              onClick={() => {
                                setNewLanguageName(lang.name_local || lang.name);
                                setNewLanguageCode(lang.iso_639_1);
                              }}
                              className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-[#1d4ed8]/5 hover:text-[#1d4ed8] rounded-xl transition-colors flex justify-between"
                            >
                              <span className="font-medium">{lang.name_local || lang.name}</span>
                              <span className="text-slate-400 text-xs">{lang.name}</span>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-slate-500 text-center">
                            {t('noResults')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Language Level Section */}
                <div>
                  <h4 className="mb-4 text-[14px] font-bold text-[#334155]">
                    {t('languageLevel')}
                  </h4>
                  <div className="flex flex-col gap-3">
                    {levelOptions.map((level) => {
                      const isSelected = newLanguageLevel === level.value;
                      return (
                        <label
                          key={level.value}
                          className={`group relative flex cursor-pointer items-center justify-between rounded-[24px] border px-6 py-4 transition-colors ${
                            isSelected
                              ? 'border-[#1d4ed8] bg-[#1d4ed8]/5'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex flex-col flex-1">
                            <span
                              className={`text-[15px] font-bold ${isSelected ? 'text-[#1d4ed8]' : 'text-[#334155]'}`}
                            >
                              {level.label}
                            </span>
                            <span
                              className={`mt-0.5 text-[13px] ${isSelected ? 'text-[#1d4ed8]/70' : 'text-[#94a3b8]'}`}
                            >
                              {level.subtitle}
                            </span>
                          </div>

                          <div
                            className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              isSelected
                                ? 'border-[#1d4ed8]'
                                : 'border-slate-300 group-hover:border-slate-400'
                            }`}
                          >
                            {isSelected && (
                              <div className="h-[12px] w-[12px] rounded-full bg-[#1d4ed8]" />
                            )}
                          </div>

                          {/* Hidden radio input for accessibility */}
                          <input
                            type="radio"
                            name="modal-language-level"
                            value={level.value}
                            checked={isSelected}
                            onChange={(e) =>
                              setNewLanguageLevel(e.target.value as LanguageProficiency)
                            }
                            className="sr-only"
                            disabled={mutation.isPending}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="flex shrink-0 gap-4 border-t border-slate-100 p-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddLanguage(false);
                    setNewLanguageName('');
                    setNewLanguageLevel('');
                    setNewLanguageCode('');
                    setLanguageError(null);
                  }}
                  disabled={mutation.isPending}
                  className="flex-1 rounded-[24px] border-none bg-[#e2e8f0] py-6 text-[16px] font-bold text-[#64748b] hover:bg-[#cbd5e1] hover:text-[#475569]"
                >
                  {t('cancelBtn')}
                </Button>
                <Button
                  onClick={handleAddLanguage}
                  disabled={!newLanguageName.trim() || !newLanguageLevel || mutation.isPending}
                  className="flex-1 rounded-[24px] bg-[#1e3a8a] py-6 text-[16px] font-bold text-white hover:bg-[#1e40af]"
                >
                  {t('addBtn')}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
      {/* Add Skill Modal Overlay */}
      {showAddSkill &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a2243]/30 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="flex w-full max-w-[500px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl relative max-h-[90vh]">
              {/* Header - Fixed */}
              <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#f97316]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="12" fill="#fff5ec" />
                      <path
                        d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.5-6.3-4.8-6.3 4.8 2.3-7.5-6-4.6h7.6z"
                        stroke="#f97316"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col text-right">
                    <h3 className="text-[18px] font-bold text-[#1e293b]">
                      {t('addSkillModalTitle')}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-[#64748b]">
                      {t('addSkillModalSubtitle')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddSkill(false);
                    setNewSkillName('');
                    setPendingSkills([]);
                    setSkillError(null);
                  }}
                  disabled={mutation.isPending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f1f5f9] text-[#94a3b8] hover:bg-[#e2e8f0] transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Custom Skill Input */}
                <div className="mb-8">
                  <h4 className="mb-4 text-[14px] font-bold text-[#334155]">
                    {t('customSkillLabel')}
                  </h4>
                  {skillError && (
                    <div className="mb-3 rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]">
                      {skillError}
                    </div>
                  )}
                  <Input
                    id="modal-skill-name"
                    placeholder={t('customSkillPlaceholder')}
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCustomSkillEnter();
                      }
                    }}
                    disabled={mutation.isPending}
                    className="mb-2 w-full rounded-[16px] bg-[#f8fafc] h-12"
                  />
                  <p className="text-[12px] text-[#94a3b8] text-right">{t('enterToAdd')}</p>
                </div>

                {/* Categories Section */}
                <div className="mb-6">
                  <h4 className="mb-4 text-[14px] font-bold text-[#334155]">
                    {t('categoryLabel')}
                  </h4>
                  <div className="flex flex-wrap gap-2 justify-start">
                    {skillCategories.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`rounded-[20px] border px-4 py-2 text-[13px] font-bold transition-colors ${
                            isSelected
                              ? 'border-[#f97316] bg-[#f97316] text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Suggestions Section */}
                <div className="mb-8">
                  <div className="flex flex-wrap gap-2.5 justify-start">
                    {skillSuggestions[selectedCategory]?.map((skill) => {
                      const normalizedSkill = normalizeString(skill);
                      const isPending = pendingSkills.some(
                        (s) => normalizeString(s) === normalizedSkill
                      );
                      const isAlreadySaved = data?.skills.some(
                        (s) => normalizeString(s) === normalizedSkill
                      );

                      return (
                        <button
                          key={skill}
                          type="button"
                          disabled={mutation.isPending || isAlreadySaved}
                          onClick={() => handleTogglePendingSkill(skill)}
                          className={`rounded-[20px] border px-4 py-2 text-[14px] transition-colors ${
                            isAlreadySaved
                              ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                              : isPending
                                ? 'border-[#1d4ed8] bg-[#1d4ed8]/5 text-[#1d4ed8] font-bold'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          + {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Skills Preview */}
                {pendingSkills.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2 justify-start">
                      {pendingSkills.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[13px] font-medium text-blue-700"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleTogglePendingSkill(skill)}
                            disabled={mutation.isPending}
                            className="text-blue-400 hover:text-blue-700 transition-colors disabled:opacity-50"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Fixed */}
              <div className="flex shrink-0 gap-4 border-t border-slate-100 p-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddSkill(false);
                    setNewSkillName('');
                    setPendingSkills([]);
                    setSkillError(null);
                  }}
                  disabled={mutation.isPending}
                  className="flex-1 rounded-[24px] border-none bg-[#e2e8f0] py-6 text-[16px] font-bold text-[#64748b] hover:bg-[#cbd5e1] hover:text-[#475569]"
                >
                  {t('cancelBtn')}
                </Button>
                <Button
                  onClick={handleAddSkill}
                  disabled={pendingSkills.length === 0 || mutation.isPending}
                  className="flex-1 rounded-[24px] bg-[#1e3a8a] py-6 text-[16px] font-bold text-white hover:bg-[#1e40af]"
                >
                  {t('addBtn')}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <DeleteConfirmationModal
        open={itemToDelete !== null}
        entityType={itemToDelete?.type || 'skill'}
        itemName={itemToDelete?.name || ''}
        isDeleting={mutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
