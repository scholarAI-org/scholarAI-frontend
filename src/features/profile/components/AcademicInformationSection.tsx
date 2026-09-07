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
import { studyStatusValues } from '../schemas/academic-information-api.schema';
import { useOpenAlexSubfields, useOpenAlexTopics } from '../hooks/useOpenAlex';

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

  void dirtyFields;
  const values = useWatch({ control });
  const busy = mutation.isPending || isSubmitting;
  const query = useAcademicInformation();
  const unavailable = query.isPending;

  const authError =
    mutation.error instanceof ApiError &&
    (mutation.error.status === 401 || mutation.error.status === 403);

  const { data: subfields } = useOpenAlexSubfields();
  const { data: topics } = useOpenAlexTopics(
    values.currentLevel === 'PHD' &&
      values.fieldOfStudyOpenAlexId &&
      values.fieldOfStudyOpenAlexId !== 'legacy'
      ? values.fieldOfStudyOpenAlexId
      : undefined
  );

  const currentYear = new Date().getFullYear();

  const fieldDefinitions = useMemo(() => {
    const isTawjihi = values.currentLevel === 'TAWJIHI';

    const fields: Omit<ProfileFieldData, 'label'>[] = [
      {
        id: 'currentLevel',
        kind: 'select',
        options: [
          { value: '', label: t('placeholders.currentLevel') },
          ...academicLevelValues.map((value) => ({ value, label: t(`levels.${value}`) })),
        ],
        required: true,
      },
    ];

    if (isTawjihi) {
      fields.push({
        id: 'fieldOfStudy',
        kind: 'select',
        options: [
          { value: '', label: t('placeholders.fieldOfStudy') },
          ...fieldOfStudyValues.map((value) => ({ value, label: t(`fieldsOfStudy.${value}`) })),
        ],
        required: true,
      });
    } else {
      const hasLegacy = values.fieldOfStudy && !values.fieldOfStudyOpenAlexId;
      fields.push({
        id: 'fieldOfStudyOpenAlexId',
        kind: 'select',
        searchable: true,
        options: [
          { value: '', label: t('placeholders.fieldOfStudy') },
          ...(subfields || []).map((s) => ({ value: s.id, label: s.display_name })),
          ...(hasLegacy
            ? [
                {
                  value: 'legacy',
                  label: (values.fieldOfStudy
                    ? t.has(`fieldsOfStudy.${values.fieldOfStudy}`)
                      ? t(`fieldsOfStudy.${values.fieldOfStudy}`)
                      : values.fieldOfStudy
                    : '') as string,
                },
              ]
            : []),
        ],
        required: true,
      });
    }

    if (values.currentLevel === 'PHD') {
      fields.push({
        id: 'researchSpecializationOpenAlexId',
        kind: 'select',
        searchable: true,
        optionalLabel: t('optional'),
        options: [
          { value: '', label: t('placeholders.researchSpecialization') },
          ...(topics || []).map((t) => ({ value: t.id, label: t.display_name })),
        ],
      });
    }

    fields.push(
      {
        id: 'targetFieldOfStudyOpenAlexId',
        kind: 'select',
        searchable: true,
        options: [
          { value: '', label: t('placeholders.targetFieldOfStudy') },
          ...(subfields || []).map((s) => ({ value: s.id, label: s.display_name })),
        ],
        required: true,
      },
      { id: 'institution', optionalLabel: t('optional') },
      {
        id: 'graduationYear',
        kind: 'select',
        options: [
          { value: '', label: t('placeholders.graduationYear') },
          ...Array.from({ length: 61 }, (_, i) => {
            const year = String(currentYear + 10 - i);
            return { value: `${year}-01-01`, label: year };
          }),
        ],
        required: true,
      },
      { id: 'gpaValue', inputType: 'number', dir: 'ltr', required: true },
      {
        id: 'gpaSystem',
        kind: 'select',
        options: [
          { value: '', label: t('placeholders.gpaSystem') },
          ...gpaSystemValues.map((value) => ({ value, label: t(`gpaSystems.${value}`) })),
        ],
        required: true,
      },
      {
        id: 'studyStatus',
        kind: 'select',
        options: [
          { value: '', label: t('placeholders.studyStatus') },
          ...studyStatusValues.map((value) => ({ value, label: t(`studyStatuses.${value}`) })),
        ],
        required: true,
      },
      {
        id: 'studyLanguage',
        kind: 'select',
        optionalLabel: t('optional'),
        options: [
          { value: '', label: t('placeholders.studyLanguage') },
          ...languageValues.map((value) => ({ value, label: t(`languages.${value}`) })),
        ],
      }
    );

    return fields;
  }, [
    values.currentLevel,
    values.fieldOfStudyOpenAlexId,
    values.fieldOfStudy,
    subfields,
    topics,
    t,
    currentYear,
  ]);

  const fields = fieldDefinitions.map((field) => {
    const originalId = field.id.replace('OpenAlexId', '');
    return {
      label: t(`fields.${originalId}`),
      placeholder: t(`placeholders.${originalId}`),
      ...field,
    };
  });

  const fieldErrors = Object.fromEntries(
    Object.entries(errors).map(([name, error]) => [name, error?.message])
  );

  if (errors.fieldOfStudy) fieldErrors.fieldOfStudyOpenAlexId = errors.fieldOfStudy.message;
  if (errors.targetFieldOfStudy)
    fieldErrors.targetFieldOfStudyOpenAlexId = errors.targetFieldOfStudy.message;

  useEffect(() => {
    if (query.data) {
      reset(toAcademicInformationForm(query.data), { keepDirtyValues: true });
    }
  }, [query.data, reset]);

  function handleFieldChange(name: string, value: string) {
    if (busy || unavailable || authError) return;
    mutation.reset();

    if (name === 'fieldOfStudyOpenAlexId') {
      if (value === 'legacy') {
        setValue('fieldOfStudyOpenAlexId', null, { shouldDirty: true, shouldValidate: true });
        return;
      }
      setValue('fieldOfStudyOpenAlexId', value, { shouldDirty: true, shouldValidate: true });
      const found = subfields?.find((s) => s.id === value);
      setValue('fieldOfStudy', found ? found.display_name : '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else if (name === 'targetFieldOfStudyOpenAlexId') {
      setValue('targetFieldOfStudyOpenAlexId', value, { shouldDirty: true, shouldValidate: true });
      const found = subfields?.find((s) => s.id === value);
      setValue('targetFieldOfStudy', found ? found.display_name : '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else if (name === 'researchSpecializationOpenAlexId') {
      setValue('researchSpecializationOpenAlexId', value, {
        shouldDirty: true,
        shouldValidate: true,
      });
      const found = topics?.find((t) => t.id === value);
      setValue('researchSpecialization', found ? found.display_name : '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else if (name === 'currentLevel') {
      setValue('currentLevel', value as AcademicInformationFormData['currentLevel'], {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (value === 'TAWJIHI') {
        setValue('fieldOfStudyOpenAlexId', null, { shouldDirty: true });
        setValue('fieldOfStudy', '', { shouldDirty: true });
      } else if (values.currentLevel === 'TAWJIHI') {
        setValue('fieldOfStudy', '', { shouldDirty: true });
      }

      if (value !== 'PHD') {
        setValue('researchSpecializationOpenAlexId', null, { shouldDirty: true });
        setValue('researchSpecialization', null, { shouldDirty: true });
      }
    } else {
      setValue(name as keyof AcademicInformationFormData, value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  function onSubmit(data: AcademicInformationFormData) {
    if (busy || unavailable || authError || saveInFlight.current) return;
    saveInFlight.current = true;

    mutation.mutate(toAcademicInformationPayload(data), {
      onSuccess: (saved) => {
        reset(toAcademicInformationForm(saved));
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

  const valuesForUI = { ...values };
  if (values.currentLevel !== 'TAWJIHI' && values.fieldOfStudy && !values.fieldOfStudyOpenAlexId) {
    valuesForUI.fieldOfStudyOpenAlexId = 'legacy';
  }

  return (
    <div className="space-y-4">
      {authError && (
        <p
          role="alert"
          className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
        >
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
        fields={fields as ProfileFieldData[]}
        values={valuesForUI as Partial<Record<string, string>>}
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
