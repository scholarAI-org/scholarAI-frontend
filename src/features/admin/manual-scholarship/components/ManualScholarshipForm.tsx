'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { ApiError } from '@/lib/api-client';
import { Link, useRouter } from '@/i18n/navigation';
import { LeftArrowIcon } from '@/components/icons/LeftArrowIcon';
import { toManualScholarshipCreatePayload } from '../lib/normalizers';
import {
  createManualScholarshipSchema,
  type ManualScholarshipFormValues,
} from '../schemas/manual-scholarship.schema';
import { useCreateManualScholarship } from '../hooks/useCreateManualScholarship';
import { ManualScholarshipBasicFields } from './ManualScholarshipBasicFields';
import { ManualScholarshipDetailsFields } from './ManualScholarshipDetailsFields';
import { ManualScholarshipFormActions } from './ManualScholarshipFormActions';

const fieldNames = new Set<keyof ManualScholarshipFormValues>([
  'title_ar',
  'title_en',
  'organization_name',
  'country',
  'university_name',
  'study_level',
  'funding_type',
  'funding_amount',
  'deadline',
  'majors',
  'language_requirements',
  'eligibility_criteria',
  'required_documents',
  'apply_link',
  'image_url',
  'source_url',
  'description_html',
  'apply_email',
  'apply_phone',
]);

function getFormError(error: unknown, t: ReturnType<typeof useTranslations>) {
  if (!(error instanceof ApiError)) return t('feedback.genericError');
  if (error.status === 401 || error.status === 403) return t('feedback.unauthorized');
  if (error.status === 409) return t('feedback.conflict');
  if (error.status === 422) return t('feedback.validation');
  return error.message || t('feedback.genericError');
}

export function ManualScholarshipForm() {
  const t = useTranslations('AdminManualScholarship');
  const router = useRouter();
  const { mutate, isPending } = useCreateManualScholarship();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const schema = createManualScholarshipSchema({
    required: t('validation.required'),
    invalidHttpUrl: t('validation.invalidHttpUrl'),
    deadlineRequired: t('validation.deadlineRequired'),
    invalidDeadline: t('validation.invalidDeadline'),
  });
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ManualScholarshipFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { no_deadline: false },
  });
  const noDeadline = useWatch({ control, name: 'no_deadline' });

  useEffect(() => {
    if (!successMessage) return;

    const redirectTimer = setTimeout(() => router.push('/admin/dashboard'), 1500);
    return () => clearTimeout(redirectTimer);
  }, [router, successMessage]);

  function onSubmit(values: ManualScholarshipFormValues) {
    setFormError(null);
    mutate(toManualScholarshipCreatePayload(values), {
      onSuccess: () => {
        setSuccessMessage(t('feedback.success'));
      },
      onError: (error) => {
        let mapped = false;
        if (error instanceof ApiError) {
          error.details.forEach((detail) => {
            const name = detail.loc.at(-1);
            if (
              typeof name === 'string' &&
              fieldNames.has(name as keyof ManualScholarshipFormValues)
            ) {
              setError(name as keyof ManualScholarshipFormValues, { message: detail.msg });
              mapped = true;
            }
          });
        }
        if (!mapped) setFormError(getFormError(error, t));
      },
    });
  }

  return (
    <div className="mx-auto max-w-4xl py-6 lg:py-8">
      <Link
        href="/admin/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#635f80] transition-colors hover:text-[#434343] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3dc971]"
      >
        <LeftArrowIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
        {t('back')}
      </Link>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm sm:p-8"
        noValidate
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-[#434343]">{t('sectionTitle')}</h2>
          <p className="flex items-start gap-2 rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs font-medium leading-5 text-[#635f80]">
            <Info className="mt-0.5 size-4 shrink-0 text-[#f97316]" aria-hidden="true" />
            {t('workflowNotice')}
          </p>
        </div>
        <div className="mt-8">
          <ManualScholarshipBasicFields
            register={register}
            errors={errors}
            noDeadline={noDeadline}
            setValue={setValue}
          />
          <ManualScholarshipDetailsFields register={register} errors={errors} />
        </div>
        {formError ? (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-[var(--color-bg-error-subtle)] px-4 py-3 text-sm text-[var(--color-text-error)]"
          >
            {formError}
          </p>
        ) : null}
        {successMessage ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-6 rounded-xl bg-[var(--color-bg-success-subtle)] px-4 py-3 text-sm text-[var(--color-success)]"
          >
            {successMessage}
          </p>
        ) : null}
        <ManualScholarshipFormActions isPending={isPending} />
      </form>
    </div>
  );
}
