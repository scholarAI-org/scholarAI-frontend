'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import ProfileFormCard from '@/components/profile/ProfileFormCard';
import type { ProfileFieldData } from '@/components/profile/types';
import { Link } from '@/i18n/navigation';
import { ApiError } from '@/lib/api-client';
import { useAcademicInformation } from '../hooks/useAcademicInformation';
import { useUpdateAcademicInformation } from '../hooks/useUpdateAcademicInformation';
import {
  academicInformationFieldMap,
  emptyAcademicInformation,
  getAcademicInformationCompletion,
  toAcademicInformationForm,
  toAcademicInformationPayload,
} from '../lib/academic-information';
import {
  academicLevelValues,
  createAcademicInformationSchema,
  fieldOfStudyValues,
  gpaSystemValues,
  languageValues,
  type AcademicInformationFormData,
} from '../schemas/academic-information.schema';

type Props = {
  onSavedNext?: () => void;
};

export function AcademicInformationSection({ onSavedNext }: Props) {
  const t = useTranslations('AcademicInformation');
  const mutation = useUpdateAcademicInformation();
  const saveInFlight = useRef(false);
  const schema = useMemo(() => createAcademicInformationSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isDirty, dirtyFields, isSubmitting },
  } = useForm<AcademicInformationFormData>({
    resolver: zodResolver(schema),
    defaultValues: emptyAcademicInformation,
  });

  // keepDirtyValues requires a subscription to dirtyFields.
  void dirtyFields;

  const values = useWatch({ control });
  const busy = mutation.isPending || isSubmitting;
  const query = useAcademicInformation();

  // A first-time profile (or a failed read) must not prevent entering a new draft.
  const unavailable = query.isPending;

  // Checking if the mutation returned an auth error (401/403)
  const authError =
    mutation.error instanceof ApiError &&
    (mutation.error.status === 401 || mutation.error.status === 403);

  const fieldDefinitions: Omit<ProfileFieldData, 'label'>[] = [
    {
      id: 'currentLevel',
      kind: 'select',
      options: [
        { value: '', label: t('placeholders.currentLevel') },
        ...academicLevelValues.map((value) => ({ value, label: t(`levels.${value}`) })),
      ],
    },
    {
      id: 'fieldOfStudy',
      kind: 'select',
      options: [
        { value: '', label: t('placeholders.fieldOfStudy') },
        ...fieldOfStudyValues.map((value) => ({ value, label: t(`fieldsOfStudy.${value}`) })),
      ],
      searchable: true,
    },
    { id: 'institution' },
    {
      id: 'graduationYear',
      kind: 'date',
    },
    { id: 'gpaValue', inputType: 'number', dir: 'ltr' },
    {
      id: 'gpaSystem',
      kind: 'select',
      options: [
        { value: '', label: t('placeholders.gpaSystem') },
        ...gpaSystemValues.map((value) => ({ value, label: t(`gpaSystems.${value}`) })),
      ],
    },
    {
      id: 'studyLanguage',
      kind: 'select',
      options: [
        { value: '', label: t('placeholders.studyLanguage') },
        ...languageValues.map((value) => ({ value, label: t(`languages.${value}`) })),
      ],
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

  useEffect(() => {
    if (query.data) {
      reset(toAcademicInformationForm(query.data), { keepDirtyValues: true });
    }
  }, [query.data, reset]);

  function handleFieldChange(name: string, value: string) {
    if (busy || unavailable || authError || !Object.hasOwn(emptyAcademicInformation, name)) return;
    mutation.reset();
    setValue(name as keyof AcademicInformationFormData, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function onSubmit(data: AcademicInformationFormData) {
    if (busy || unavailable || authError || saveInFlight.current) return;
    saveInFlight.current = true;

    mutation.mutate(toAcademicInformationPayload(data), {
      onSuccess: (saved) => {
        reset(toAcademicInformationForm(saved));
        // Notify parent to navigate to next step when provided
        if (typeof onSavedNext === 'function') {
          onSavedNext();
        }
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
              Object.hasOwn(academicInformationFieldMap, backendField)
            ) {
              const field =
                academicInformationFieldMap[
                  backendField as keyof typeof academicInformationFieldMap
                ];
              if (field) {
                setError(field as keyof AcademicInformationFormData, {
                  type: 'server',
                  message: detail.msg,
                });
              }
            }
          });
        }
      },
    });
  }

  return (
    <div className="space-y-4">
      {authError && (
        <p
          role="alert"
          className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
        >
          {/* We assume the 'PersonalInformation' namespace or common translations have authRequired, but since we use 'AcademicInformation', we might need to add it or fallback. Using raw translation keys if they don't exist yet, but in a real project it'd be shared. */}
          {t('authRequired') || 'Authentication required'}{' '}
          <Link href="/login" className="font-bold underline">
            {t('login') || 'Login'}
          </Link>
        </p>
      )}

      {mutation.isError && !authError && (
        <p
          role="alert"
          className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
        >
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : t('saveError') || 'An error occurred while saving.'}
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
        completion={{ label: t('completion'), value: getAcademicInformationCompletion(values) }}
        actionLabel={t(busy ? 'saving' : 'save')}
        isSaving={busy}
        disabled={authError}
        onFieldChange={handleFieldChange}
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
      />
    </div>
  );
}
