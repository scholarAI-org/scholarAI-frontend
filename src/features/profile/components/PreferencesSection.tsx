'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ProfileDropdown from '@/components/profile/ProfileDropdown';
import { ApiError } from '@/lib/api-client';
import { usePreferences } from '../hooks/usePreferences';
import { useUpdatePreferences } from '../hooks/useUpdatePreferences';
import { useCountries } from '../hooks/useCountries';
import { useOpenAlexSubfields, useOpenAlexTopics } from '../hooks/useOpenAlex';
import { getFieldOfStudyOptions } from '../lib/field-of-study';
import { ProfileFormActions } from '@/components/profile/ProfileFormActions';
import { ProfileSaveContinueButton } from '@/components/profile/ProfileSaveContinueButton';
import { emptyPreferences } from '../schemas/preferences-api.schema';
import { createPreferencesSchema, type PreferencesForm } from '../schemas/preferences.schema';
import { toPreferencesForm, toPreferencesDto } from '../lib/preferences';

type Props = {
  onSavedNext?: () => void;
};

const emptySubscribe = () => () => undefined;

export function PreferencesSection({ onSavedNext }: Props) {
  const t = useTranslations('Preferences');
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const query = usePreferences();
  const mutation = useUpdatePreferences();

  const schema = useMemo(() => createPreferencesSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PreferencesForm>({
    resolver: zodResolver(schema),
    defaultValues: emptyPreferences,
  });

  useEffect(() => {
    if (query.data) {
      reset(toPreferencesForm(query.data), { keepDirtyValues: true });
    }
  }, [query.data, reset]);

  const desiredDegreeLevel = useWatch({ control, name: 'desired_degree_level' });
  const targetFieldOfStudy = useWatch({ control, name: 'target_field_of_study' });
  const targetFieldOpenAlexId = useWatch({ control, name: 'target_field_of_study_openalex_id' });
  const detailedSpecialization = useWatch({ control, name: 'detailed_specialization' });
  const preferredCountries = useWatch({ control, name: 'preferred_countries' }) ?? [];

  const authError = [query.error, mutation.error].some(
    (error) => error instanceof ApiError && (error.status === 401 || error.status === 403)
  );

  // Local state for Add Country Modal
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [newCountrySearch, setNewCountrySearch] = useState('');
  const [countryError, setCountryError] = useState<string | null>(null);

  const countriesQuery = useCountries();
  const countriesData = useMemo(() => countriesQuery.data ?? [], [countriesQuery.data]);

  const filteredCountries = useMemo(() => {
    if (!countriesData.length) return [];
    const term = newCountrySearch.trim().toLowerCase();
    if (!term) return countriesData.slice(0, 50);
    return countriesData
      .filter((c) => c.label.toLowerCase().includes(term) || c.value.toLowerCase().includes(term))
      .slice(0, 50);
  }, [countriesData, newCountrySearch]);

  const normalizeString = (val: string) => val.trim().toLowerCase().replace(/\s+/g, ' ');

  const levelOptions = [
    { value: 'BACHELOR', label: t('levels.BACHELOR') },
    { value: 'MASTER', label: t('levels.MASTER') },
    { value: 'PHD', label: t('levels.PHD') },
    { value: 'DIPLOMA', label: t('levels.DIPLOMA') },
    { value: 'OTHER', label: t('levels.OTHER') },
  ];

  const subfieldsQuery = useOpenAlexSubfields();
  const subfields = subfieldsQuery.data;
  const { data: topics } = useOpenAlexTopics(
    desiredDegreeLevel === 'PHD' && targetFieldOpenAlexId && targetFieldOpenAlexId !== 'legacy'
      ? targetFieldOpenAlexId
      : undefined
  );

  const targetFieldOptions = useMemo(() => {
    return getFieldOfStudyOptions(desiredDegreeLevel, subfields);
  }, [desiredDegreeLevel, subfields]);

  const detailedSpecializationOptions = useMemo(() => {
    const baseOptions = (topics || []).map((topic) => ({
      value: topic.display_name,
      label: topic.display_name,
    }));

    if (
      detailedSpecialization &&
      !baseOptions.some((opt) => opt.value === detailedSpecialization)
    ) {
      return [{ value: detailedSpecialization, label: detailedSpecialization }, ...baseOptions];
    }

    return baseOptions;
  }, [topics, detailedSpecialization]);

  const fundingOptions = [
    { value: 'FULL', label: t('fundingTypes.FULL') },
    { value: 'PARTIAL', label: t('fundingTypes.PARTIAL') },
    { value: 'SELF', label: t('fundingTypes.SELF') },
  ];

  function handleDegreeLevelChange(newLevel: string) {
    const validOptions = getFieldOfStudyOptions(newLevel, subfields);
    const isFieldValid = validOptions.some(
      (opt) => opt.value === targetFieldOpenAlexId || opt.value === targetFieldOfStudy
    );

    const level = (newLevel as PreferencesForm['desired_degree_level']) || undefined;
    setValue('desired_degree_level', level, { shouldValidate: true, shouldDirty: true });

    // Clear target field if subfields have loaded and selection is invalid for new level
    if (subfieldsQuery.isSuccess && !isFieldValid) {
      setValue('target_field_of_study', undefined, { shouldValidate: true, shouldDirty: true });
      setValue('target_field_of_study_openalex_id', undefined, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    // Switching away from PhD clears PhD-only detailed_specialization
    if (newLevel !== 'PHD') {
      setValue('detailed_specialization', undefined, { shouldValidate: true, shouldDirty: true });
    }
  }

  function handleTargetFieldChange(val: string) {
    const selectedOpt = targetFieldOptions.find((opt) => opt.value === val);

    setValue(
      'target_field_of_study',
      selectedOpt?.isOpenAlex ? selectedOpt.label : val || undefined,
      { shouldValidate: true, shouldDirty: true }
    );
    setValue('target_field_of_study_openalex_id', selectedOpt?.isOpenAlex ? val : undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (desiredDegreeLevel === 'PHD') {
      setValue('detailed_specialization', undefined, { shouldValidate: true, shouldDirty: true });
    }
  }

  const getCountryLabel = (code: string) => {
    const found = countriesData.find((c) => c.value.toUpperCase() === code.toUpperCase());
    return found ? found.label : code;
  };

  function handleAddCountry(inputCodeOrName: string) {
    const trimmed = inputCodeOrName.trim();
    const matched = countriesData.find(
      (c) =>
        c.value.toUpperCase() === trimmed.toUpperCase() ||
        normalizeString(c.label) === normalizeString(trimmed)
    );

    const codeToAdd = matched
      ? matched.value.toUpperCase()
      : /^[A-Za-z]{2}$/.test(trimmed)
        ? trimmed.toUpperCase()
        : null;

    if (!codeToAdd) {
      setCountryError(t('invalidCountryError') || 'يرجى اختيار دولة من القائمة');
      return;
    }

    if (preferredCountries.some((c) => c.toUpperCase() === codeToAdd)) {
      setCountryError(t('countryExistsError'));
      return;
    }

    setCountryError(null);
    setValue('preferred_countries', [...preferredCountries, codeToAdd], {
      shouldValidate: true,
      shouldDirty: true,
    });
    setNewCountrySearch('');
    setShowAddCountry(false);
  }

  function handleRemoveCountry(countryToRemove: string) {
    setValue(
      'preferred_countries',
      preferredCountries.filter((c) => c !== countryToRemove),
      { shouldValidate: true, shouldDirty: true }
    );
  }

  const onSubmit = (formData: PreferencesForm) => {
    const payload = toPreferencesDto(formData);
    mutation.mutate(payload, {
      onSuccess: () => {
        if (typeof onSavedNext === 'function') onSavedNext();
      },
    });
  };

  const getMutationErrorMessage = (error: unknown): string => {
    if (!(error instanceof ApiError)) return 'Failed to save preferences. Please try again.';
    const msg = error.message.toLowerCase();
    if (msg.includes('detailed_specialization') || msg.includes('phd')) {
      return t('detailedSpecializationRequired');
    }
    return error.message;
  };

  const isBusy = mutation.isPending || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            </div>
          )
        )}

        {/* Mutation error: mapped localized user message for backend errors */}
        {!authError && mutation.isError && (
          <div
            role="alert"
            className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 mb-4 text-sm text-[var(--color-text-error)]"
          >
            {getMutationErrorMessage(mutation.error)}
          </div>
        )}

        <div className="flex flex-col gap-8">
          {/* Dropdowns Row */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#334155]">
                {t('studyLevelLabel')}
              </label>
              <Controller
                name="desired_degree_level"
                control={control}
                render={({ field }) => (
                  <ProfileDropdown
                    id="study-level"
                    value={field.value ?? ''}
                    placeholder={t('selectPlaceholder')}
                    options={levelOptions}
                    onChange={(val) => {
                      field.onChange(val);
                      handleDegreeLevelChange(val);
                    }}
                    errorMessage={errors.desired_degree_level?.message}
                    disabled={authError || isBusy}
                  />
                )}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#334155]">
                {t('fundingTypeLabel')}
              </label>
              <Controller
                name="funding_type"
                control={control}
                render={({ field }) => (
                  <ProfileDropdown
                    id="funding-type"
                    value={field.value ?? ''}
                    placeholder={t('selectPlaceholder')}
                    options={fundingOptions}
                    onChange={field.onChange}
                    errorMessage={errors.funding_type?.message}
                    disabled={authError || isBusy}
                  />
                )}
              />
            </div>
          </div>

          {/* Target Field of Study */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#334155]">
                {t('targetFieldLabel')}
              </label>
              <Controller
                name="target_field_of_study_openalex_id"
                control={control}
                render={({ field }) => (
                  <ProfileDropdown
                    id="target-field-of-study"
                    value={field.value || targetFieldOfStudy || ''}
                    placeholder={t('targetFieldPlaceholder')}
                    options={[
                      { value: '', label: t('targetFieldPlaceholder') },
                      ...targetFieldOptions.map((opt) => ({ value: opt.value, label: opt.label })),
                    ]}
                    onChange={(val) => {
                      handleTargetFieldChange(val);
                    }}
                    errorMessage={errors.target_field_of_study?.message}
                    disabled={authError || isBusy || !desiredDegreeLevel}
                    searchable
                  />
                )}
              />
            </div>

            {/* PhD Detailed Specialization */}
            {desiredDegreeLevel === 'PHD' && (
              <div>
                <label className="mb-2 block text-sm font-bold text-[#334155]">
                  {t('detailedSpecializationLabel')}
                </label>
                <Controller
                  name="detailed_specialization"
                  control={control}
                  render={({ field }) => (
                    <ProfileDropdown
                      id="detailed-specialization"
                      value={field.value ?? ''}
                      placeholder={t('detailedSpecializationPlaceholder')}
                      options={[
                        { value: '', label: t('detailedSpecializationPlaceholder') },
                        ...detailedSpecializationOptions,
                      ]}
                      onChange={(val) => {
                        field.onChange(val || undefined);
                      }}
                      errorMessage={errors.detailed_specialization?.message}
                      disabled={authError || isBusy}
                      searchable
                    />
                  )}
                />
              </div>
            )}
          </div>

          {/* Preferred Countries */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#334155]">
              {t('countriesLabel')}
            </label>
            <div
              className="flex min-h-[52px] w-full flex-wrap items-center gap-2 rounded-[26px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 cursor-text"
              onClick={() => setShowAddCountry(true)}
            >
              {preferredCountries.map((country, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#334155] hover:border-slate-300 transition-colors shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{getCountryLabel(country)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCountry(country)}
                    disabled={authError || isBusy}
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
              {preferredCountries.length === 0 && (
                <span className="text-sm text-[#979797] pointer-events-none">
                  {t('countriesPlaceholder')}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <ProfileFormActions>
            <ProfileSaveContinueButton
              type="submit"
              disabled={authError || isBusy}
              isLoading={isBusy}
            />
          </ProfileFormActions>
        </div>
      </div>

      {/* Add Country Modal */}
      {showAddCountry &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a2243]/30 backdrop-blur-[2px] p-4"
            onClick={() => {
              setShowAddCountry(false);
              setCountryError(null);
              setNewCountrySearch('');
            }}
          >
            <div
              className="flex w-full max-w-[500px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6">
                <div>
                  <h3 className="text-[18px] font-bold text-[#1e293b]">
                    {t('modalTitleCountries')}
                  </h3>
                  <p className="mt-0.5 text-[13px] text-[#64748b]">{t('modalSubtitleCountries')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCountry(false);
                    setCountryError(null);
                    setNewCountrySearch('');
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f1f5f9] text-[#94a3b8] hover:bg-[#e2e8f0]"
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
              <div className="flex flex-1 flex-col overflow-hidden p-6">
                {countryError && (
                  <div className="mb-3 shrink-0 rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]">
                    {countryError}
                  </div>
                )}
                <Input
                  placeholder={t('searchCountryPlaceholder')}
                  value={newCountrySearch}
                  onChange={(e) => {
                    setNewCountrySearch(e.target.value);
                    setCountryError(null);
                  }}
                  className="mb-4 shrink-0"
                  autoFocus
                />
                <div className="min-h-[200px] flex-1 overflow-y-auto rounded-xl border border-slate-100">
                  {countriesQuery.isPending ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {t('loadingCountries')}
                    </div>
                  ) : countriesQuery.isError ? (
                    <div className="p-4 text-center text-sm text-red-500">
                      <p>Failed to load countries list.</p>
                      <button
                        type="button"
                        onClick={() => void countriesQuery.refetch()}
                        className="mt-2 text-xs font-bold underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : filteredCountries.length > 0 ? (
                    <ul className="py-2">
                      {filteredCountries.map((country) => (
                        <li key={country.value}>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-start text-sm text-slate-700 transition-colors hover:bg-[#1e3a8a]/5 hover:text-[#1e3a8a]"
                            onClick={() => handleAddCountry(country.value)}
                          >
                            {country.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {t('noResults')}
                      {newCountrySearch.trim() && (
                        <div className="mt-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddCountry(newCountrySearch.trim())}
                            className="rounded-full bg-[#1e3a8a] text-white"
                          >
                            Add &quot;{newCountrySearch.trim()}&quot;
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 border-t border-slate-100 p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddCountry(false);
                    setCountryError(null);
                    setNewCountrySearch('');
                  }}
                  className="w-full rounded-full"
                >
                  {t('cancelBtn')}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </form>
  );
}
