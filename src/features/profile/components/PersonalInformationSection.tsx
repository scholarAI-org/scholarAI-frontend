'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import ProfileFormCard from '@/components/profile/ProfileFormCard';
import type { ProfileFieldData } from '@/components/profile/types';
import { Link } from '@/i18n/navigation';
import { ApiError } from '@/lib/api-client';
import { useCountries } from '../hooks/useCountries';
import { useCallingCodes } from '../hooks/useCallingCodes';
import { usePersonalInformation } from '../hooks/usePersonalInformation';
import { useUpdatePersonalInformation } from '../hooks/useUpdatePersonalInformation';
import {
  emptyPersonalInformation,
  getPersonalInformationCompletion,
  personalInformationFieldMap,
  toPersonalInformationForm,
  toPersonalInformationPayload,
} from '../lib/personal-information';
import { genderValues, financialStatusValues } from '../schemas/personal-information-api.schema';
import {
  createPersonalInformationSchema,
  type PersonalInformationFormData,
} from '../schemas/personal-information.schema';

type Props = {
  onSavedNext?: () => void;
};

export function PersonalInformationSection({ onSavedNext }: Props) {
  const t = useTranslations('PersonalInformation');
  const locale = useLocale();
  const query = usePersonalInformation();
  const countriesQuery = useCountries();
  const callingCodesQuery = useCallingCodes();
  const mutation = useUpdatePersonalInformation();
  const saveInFlight = useRef(false);
  const schema = useMemo(() => createPersonalInformationSchema(t), [t]);
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isDirty, dirtyFields, isSubmitting },
  } = useForm<PersonalInformationFormData>({
    resolver: zodResolver(schema),
    defaultValues: emptyPersonalInformation,
  });
  // keepDirtyValues requires a subscription to dirtyFields.
  void dirtyFields;

  useEffect(() => {
    if (query.data) {
      reset(toPersonalInformationForm(query.data), { keepDirtyValues: true });
    }
  }, [query.data, reset]);

  const values = useWatch({ control });
  const busy = mutation.isPending || isSubmitting;
  // A first-time profile (or a failed read) must not prevent entering a new draft.
  const unavailable = query.isPending;
  const countries = countriesQuery.data ?? [];
  const countryNames = useMemo(() => new Intl.DisplayNames([locale], { type: 'region' }), [locale]);
  const countryOptions = countries
    .map((country) => ({
      value: country.value,
      label: locale === 'ar' ? country.label : (countryNames.of(country.value) ?? country.label),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  const callingCodeOptions = useMemo(
    () =>
      (callingCodesQuery.data ?? []).map((option) => ({
        ...option,
        label:
          `${option.flag ?? ''} ${countryNames.of(option.countryCode) ?? option.label} (${option.dialCode})`.trim(),
      })),
    [callingCodesQuery.data, countryNames]
  );
  const nationalityOptions = countries
    .map((country) => ({ value: country.value, label: country.nationalityLabel }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  const fieldDefinitions: Omit<ProfileFieldData, 'label'>[] = [
    { id: 'firstName', required: true },
    { id: 'lastName', required: true },
    { id: 'email', inputType: 'email', dir: 'ltr', required: true },
    {
      id: 'phone',
      kind: 'phone',
      dir: 'ltr',
      callingCodeOptions,
      disabled: callingCodesQuery.isPending || callingCodesQuery.isError,
      placeholder: t('placeholders.phoneLocal'),
      optionalLabel: t('optional'),
    },
    {
      id: 'gender',
      kind: 'select',
      options: genderValues.map((value) => ({ value, label: t(`gender.${value}`) })),
      required: true,
    },
    { id: 'birthDate', kind: 'date', required: true },
    {
      id: 'nationalityCode',
      kind: 'select',
      options: nationalityOptions,
      searchable: true,
      disabled: countriesQuery.isPending || countriesQuery.isError,
      placeholder: countriesQuery.isPending
        ? t('loadingNationalities')
        : t('placeholders.nationalityCode'),
      required: true,
    },
    {
      id: 'residenceCountryCode',
      kind: 'select',
      options: countryOptions,
      searchable: true,
      disabled: countriesQuery.isPending || countriesQuery.isError,
      placeholder: countriesQuery.isPending
        ? t('loadingCountries')
        : t('placeholders.residenceCountryCode'),
      required: true,
    },
    { id: 'nationalId', dir: 'ltr', optionalLabel: t('optional') },
    { id: 'passportNumber', dir: 'ltr', optionalLabel: t('optional') },
    { id: 'city', optionalLabel: t('optional') },
    {
      id: 'financialSituation',
      kind: 'select',
      options: [
        { value: '', label: t('financial.unset') },
        ...financialStatusValues.map((value) => ({ value, label: t(`financial.${value}`) })),
      ],
      required: true,
    },
  ];
  const fields = fieldDefinitions.map((field) => ({
    label: t(`fields.${field.id}`),
    placeholder: t(`placeholders.${field.id}`),
    ...field,
  }));
  const fieldErrors = Object.fromEntries(
    Object.entries(errors).map(([name, error]) => [name, error?.message])
  );
  const authError = [query.error, mutation.error].some(
    (error) => error instanceof ApiError && (error.status === 401 || error.status === 403)
  );

  function handleFieldChange(name: string, value: string) {
    if (busy || unavailable || authError || !Object.hasOwn(emptyPersonalInformation, name)) return;
    mutation.reset();
    setValue(name as keyof PersonalInformationFormData, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function onSubmit(data: PersonalInformationFormData) {
    if (busy || unavailable || authError || saveInFlight.current) return;
    saveInFlight.current = true;
    mutation.mutate(toPersonalInformationPayload(data), {
      onSuccess: (saved) => {
        reset(toPersonalInformationForm(saved));
        if (typeof onSavedNext === 'function') onSavedNext();
      },
      onSettled: () => {
        saveInFlight.current = false;
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          error.details.forEach((detail) => {
            const backendField = detail.loc[detail.loc.length - 1];
            if (
              typeof backendField === 'string' &&
              Object.hasOwn(personalInformationFieldMap, backendField)
            ) {
              const field =
                personalInformationFieldMap[
                  backendField as keyof typeof personalInformationFieldMap
                ];
              setError(field, { type: 'server', message: detail.msg });
            }
          });
        }
      },
    });
  }

  return (
    <div className="space-y-4">
      {query.isPending && <p role="status">{t('loading')}</p>}
      {query.isSuccess && query.data === null && <p role="status">{t('firstTime')}</p>}
      {authError ? (
        <p
          role="alert"
          className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
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
            className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
          >
            {query.data
              ? t('refreshError')
              : query.error instanceof ApiError
                ? query.error.status
                  ? t('loadHttpError', { status: query.error.status })
                  : t('responseError')
                : query.error instanceof SyntaxError
                  ? t('responseError')
                  : t('networkError')}{' '}
            {query.error instanceof ApiError && query.error.status && (
              <span dir="auto">{query.error.message} </span>
            )}
            <button
              type="button"
              disabled={query.isFetching || busy}
              onClick={() => void query.refetch()}
              className="font-bold underline"
            >
              {t('retry')}
            </button>
          </div>
        )
      )}
      {countriesQuery.isError && (
        <div
          role="alert"
          className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
        >
          {t('countriesError')}{' '}
          <button
            type="button"
            disabled={countriesQuery.isFetching}
            onClick={() => void countriesQuery.refetch()}
            className="font-bold underline"
          >
            {t('retry')}
          </button>
        </div>
      )}
      {callingCodesQuery.isError && (
        <div
          role="alert"
          className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
        >
          {t('callingCodesError')}{' '}
          <button
            type="button"
            disabled={callingCodesQuery.isFetching}
            onClick={() => void callingCodesQuery.refetch()}
            className="font-bold underline"
          >
            {t('retry')}
          </button>
        </div>
      )}
      {mutation.isError && !authError && (
        <p
          role="alert"
          className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
        >
          {mutation.error instanceof ApiError ? mutation.error.message : t('saveError')}
        </p>
      )}
      {mutation.isSuccess && !isDirty && (
        <p
          role="status"
          className="rounded-lg bg-[var(--color-bg-success-subtle)] px-3 py-2 text-sm text-[var(--color-success)]"
        >
          {t('saved')}
        </p>
      )}
      <ProfileFormCard
        title={t('title')}
        fields={fields}
        values={values}
        errors={fieldErrors}
        completion={{ label: t('completion'), value: getPersonalInformationCompletion(values) }}
        actionLabel={t(busy ? 'saving' : 'save')}
        isSaving={busy}
        disabled={unavailable || authError}
        onFieldChange={handleFieldChange}
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
      />
    </div>
  );
}
