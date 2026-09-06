'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ProfileDropdown from '@/components/profile/ProfileDropdown';
import { ApiError } from '@/lib/api-client';
import { usePreferences } from '../hooks/usePreferences';
import { useUpdatePreferences } from '../hooks/useUpdatePreferences';
import { useCountries } from '../hooks/useCountries';
import { ProfileFormActions } from '@/components/profile/ProfileFormActions';
import { ProfileSaveContinueButton } from '@/components/profile/ProfileSaveContinueButton';
import { normalizePreferences } from '../schemas/preferences-api.schema';

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

  // data is always defined because usePreferences uses initialData
  const { data, error: queryError, isError } = usePreferences();
  const mutation = useUpdatePreferences();
  const preferences = normalizePreferences(data);

  const authError = [queryError, mutation.error].some(
    (error) => error instanceof ApiError && (error.status === 401 || error.status === 403)
  );

  // Local state for Add Field Modal
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

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
    { value: 'TAWJIHI', label: t('levels.TAWJIHI') },
    { value: 'BACHELOR', label: t('levels.BACHELOR') },
    { value: 'MASTER', label: t('levels.MASTER') },
    { value: 'PHD', label: t('levels.PHD') },
  ];

  const fundingOptions = [
    { value: 'FULL', label: t('fundingTypes.FULL') },
    { value: 'PARTIAL', label: t('fundingTypes.PARTIAL') },
    { value: 'SELF', label: t('fundingTypes.SELF') },
  ];

  // data is always defined (initialData), safe to spread directly
  function handleUpdateDropdown(field: 'desired_degree_level' | 'funding_type', value: string) {
    mutation.mutate({ ...preferences, [field]: value });
  }

  function handleAddField() {
    const trimmed = newFieldName.trim();
    if (!trimmed) return;
    const normalized = normalizeString(trimmed);
    const isDuplicate = preferences.preferred_fields_of_study.some(
      (f) => normalizeString(f) === normalized
    );

    if (isDuplicate) {
      setFieldError(t('fieldExistsError'));
      return;
    }

    setFieldError(null);
    mutation.mutate(
      {
        ...preferences,
        preferred_fields_of_study: [...preferences.preferred_fields_of_study, trimmed],
      },
      {
        onSuccess: () => {
          setNewFieldName('');
          setShowAddField(false);
        },
      }
    );
  }

  function handleRemoveField(fieldToRemove: string) {
    mutation.mutate({
      ...preferences,
      preferred_fields_of_study: preferences.preferred_fields_of_study.filter(
        (f) => f !== fieldToRemove
      ),
    });
  }

  function handleAddCountry(countryName: string) {
    const normalized = normalizeString(countryName);
    const isDuplicate = preferences.preferred_countries.some(
      (c) => normalizeString(c) === normalized
    );

    if (isDuplicate) {
      setCountryError(t('countryExistsError'));
      return;
    }

    setCountryError(null);
    mutation.mutate(
      {
        ...preferences,
        preferred_countries: [...preferences.preferred_countries, countryName],
      },
      {
        onSuccess: () => {
          setNewCountrySearch('');
          setShowAddCountry(false);
        },
      }
    );
  }

  function handleRemoveCountry(countryToRemove: string) {
    mutation.mutate({
      ...preferences,
      preferred_countries: preferences.preferred_countries.filter((c) => c !== countryToRemove),
    });
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
          isError && (
            <div
              role="alert"
              className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 mb-4 text-sm text-[var(--color-text-error)]"
            >
              {queryError instanceof ApiError ? queryError.message : 'Error fetching data'}
            </div>
          )
        )}

        <div className="flex flex-col gap-8">
          {/* Dropdowns Row */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#334155]">
                {t('studyLevelLabel')}
              </label>
              <ProfileDropdown
                id="study-level"
                value={preferences.desired_degree_level ?? ''}
                placeholder={t('selectPlaceholder')}
                options={levelOptions}
                onChange={(val) => handleUpdateDropdown('desired_degree_level', val)}
                disabled={authError || mutation.isPending}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#334155]">
                {t('fundingTypeLabel')}
              </label>
              <ProfileDropdown
                id="funding-type"
                value={preferences.funding_type ?? ''}
                placeholder={t('selectPlaceholder')}
                options={fundingOptions}
                onChange={(val) => handleUpdateDropdown('funding_type', val)}
                disabled={authError || mutation.isPending}
              />
            </div>
          </div>

          {/* Study Fields */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#334155]">
              {t('studyFieldsLabel')}
            </label>
            <div
              className="flex min-h-[52px] w-full flex-wrap items-center gap-2 rounded-[26px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 cursor-text"
              onClick={() => setShowAddField(true)}
            >
              {preferences.preferred_fields_of_study.map((field, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#334155] hover:border-slate-300 transition-colors shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{field}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field)}
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
              {preferences.preferred_fields_of_study.length === 0 && (
                <span className="text-sm text-[#979797] pointer-events-none">
                  {t('studyFieldsPlaceholder')}
                </span>
              )}
            </div>
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
              {preferences.preferred_countries.map((country, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#334155] hover:border-slate-300 transition-colors shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{country}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCountry(country)}
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
              {preferences.preferred_countries.length === 0 && (
                <span className="text-sm text-[#979797] pointer-events-none">
                  {t('countriesPlaceholder')}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <ProfileFormActions>
            <ProfileSaveContinueButton
              onClick={() => {
                mutation.mutate(preferences, {
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
      </div>

      {/* Add Field Modal */}
      {showAddField &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a2243]/30 backdrop-blur-[2px] p-4"
            onClick={() => {
              setShowAddField(false);
              setFieldError(null);
            }}
          >
            <div
              className="flex w-full max-w-[500px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6">
                <div>
                  <h3 className="text-[18px] font-bold text-[#1e293b]">{t('modalTitleFields')}</h3>
                  <p className="mt-0.5 text-[13px] text-[#64748b]">{t('modalSubtitleFields')}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddField(false);
                    setFieldError(null);
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
              <div className="p-6">
                {fieldError && (
                  <div className="mb-3 rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]">
                    {fieldError}
                  </div>
                )}
                <Input
                  placeholder={t('studyFieldsPlaceholder')}
                  value={newFieldName}
                  onChange={(e) => {
                    setNewFieldName(e.target.value);
                    setFieldError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddField();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex shrink-0 gap-4 border-t border-slate-100 p-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddField(false);
                    setFieldError(null);
                  }}
                  className="flex-1 rounded-full"
                >
                  {t('cancelBtn')}
                </Button>
                <Button
                  onClick={handleAddField}
                  disabled={!newFieldName.trim() || mutation.isPending}
                  className="flex-1 rounded-full bg-[#1e3a8a] text-white"
                >
                  {t('addBtn')}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

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
                            onClick={() => handleAddCountry(country.label)}
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
    </div>
  );
}
