'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { z } from 'zod';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiError } from '@/lib/api-client';
import { formatDateTime, getSafeExternalUrl } from '../lib/formatters';
import {
  isHttpUrl,
  toChangedScholarshipUpdate,
  toScholarshipEditValues,
  type ScholarshipEditValues,
} from '../lib/edit';
import {
  useScholarshipReviewDetail,
  useUpdatePendingScholarship,
} from '../hooks/useScholarshipReview';

const fields: Array<keyof ScholarshipEditValues> = [
  'title',
  'organization_name',
  'country',
  'deadline',
  'apply_link',
  'image_url',
  'required_documents',
  'eligibility_criteria',
  'description_html',
];

function Field({
  id,
  label,
  error,
  children,
  required,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#434343]" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-[var(--color-text-error)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EditForm({ id, initial }: { id: number; initial: ScholarshipEditValues }) {
  const t = useTranslations('AdminScholarshipReview');
  const router = useRouter();
  const update = useUpdatePendingScholarship();
  const [apiError, setApiError] = useState<string | null>(null);
  const schema = z
    .object({
      title: z.string().trim().min(2, t('validation.title')),
      organization_name: z.string(),
      country: z.string(),
      deadline: z.string(),
      no_deadline: z.boolean(),
      apply_link: z.string().refine(isHttpUrl, t('validation.httpUrl')),
      image_url: z.string().refine(isHttpUrl, t('validation.httpUrl')),
      required_documents: z.string(),
      eligibility_criteria: z.string(),
      description_html: z.string(),
    })
    .superRefine((value, ctx) => {
      if (!value.no_deadline && value.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(value.deadline))
        ctx.addIssue({ code: 'custom', path: ['deadline'], message: t('validation.deadline') });
    });
  const form = useForm<ScholarshipEditValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });
  const noDeadline = useWatch({ control: form.control, name: 'no_deadline' });
  const submit = (values: ScholarshipEditValues) => {
    const payload = toChangedScholarshipUpdate(values, initial);
    if (!Object.keys(payload).length) return;
    setApiError(null);
    update.mutate(
      { id, payload },
      {
        onSuccess: () => router.replace(`/admin/scholarships/review/${id}?notice=updated`),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 422)
            error.details.forEach((detail) => {
              const key = detail.loc.at(-1);
              if (typeof key === 'string' && fields.includes(key as keyof ScholarshipEditValues))
                form.setError(key as keyof ScholarshipEditValues, { message: detail.msg });
            });
          setApiError(
            error instanceof ApiError && error.status === 409
              ? t('errors.notEditable')
              : error instanceof ApiError && error.message
                ? error.message
                : t('errors.update')
          );
        },
      }
    );
  };
  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      noValidate
      className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e1b33]">{t('edit.title')}</h1>
          <p className="mt-1 text-sm text-[#635f80]">{t('edit.beforePublishing')}</p>
        </div>
        <p className="text-sm text-[#635f80]">{t('edit.requiredNotice')}</p>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Field
          id="scholarship-title"
          label={t('edit.scholarshipTitle')}
          required
          error={form.formState.errors.title?.message}
        >
          <Input
            id="scholarship-title"
            hasError={!!form.formState.errors.title}
            aria-invalid={!!form.formState.errors.title}
            aria-describedby={form.formState.errors.title ? 'scholarship-title-error' : undefined}
            {...form.register('title')}
          />
        </Field>
        <Field
          id="granting-organization"
          label={t('edit.organization')}
          error={form.formState.errors.organization_name?.message}
        >
          <Input
            id="granting-organization"
            hasError={!!form.formState.errors.organization_name}
            aria-invalid={!!form.formState.errors.organization_name}
            aria-describedby={
              form.formState.errors.organization_name ? 'granting-organization-error' : undefined
            }
            {...form.register('organization_name')}
          />
        </Field>
        <Field
          id="country"
          label={t('edit.country')}
          error={form.formState.errors.country?.message}
        >
          <Input
            id="country"
            hasError={!!form.formState.errors.country}
            aria-invalid={!!form.formState.errors.country}
            aria-describedby={form.formState.errors.country ? 'country-error' : undefined}
            {...form.register('country')}
          />
        </Field>
        <Field
          id="deadline"
          label={t('edit.deadline')}
          error={form.formState.errors.deadline?.message}
        >
          <Input
            id="deadline"
            type="date"
            disabled={noDeadline}
            hasError={!!form.formState.errors.deadline}
            aria-invalid={!!form.formState.errors.deadline}
            aria-describedby={form.formState.errors.deadline ? 'deadline-error' : undefined}
            {...form.register('deadline')}
          />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('no_deadline')} />
            {t('edit.noDeadline')}
          </label>
        </Field>
        <Field
          id="application-url"
          label={t('edit.applicationUrl')}
          error={form.formState.errors.apply_link?.message}
        >
          <Input
            id="application-url"
            type="url"
            hasError={!!form.formState.errors.apply_link}
            aria-invalid={!!form.formState.errors.apply_link}
            aria-describedby={
              form.formState.errors.apply_link ? 'application-url-error' : undefined
            }
            {...form.register('apply_link')}
          />
        </Field>
        <Field
          id="image-url"
          label={t('edit.imageUrl')}
          error={form.formState.errors.image_url?.message}
        >
          <Input
            id="image-url"
            type="url"
            hasError={!!form.formState.errors.image_url}
            aria-invalid={!!form.formState.errors.image_url}
            aria-describedby={form.formState.errors.image_url ? 'image-url-error' : undefined}
            {...form.register('image_url')}
          />
        </Field>
        <Field
          id="required-documents"
          label={t('edit.requiredDocuments')}
          error={form.formState.errors.required_documents?.message}
        >
          <textarea
            id="required-documents"
            aria-invalid={!!form.formState.errors.required_documents}
            aria-describedby={
              form.formState.errors.required_documents ? 'required-documents-error' : undefined
            }
            className="min-h-28 w-full rounded-lg border border-[#e2e8f0] p-3"
            {...form.register('required_documents')}
          />
        </Field>
        <Field
          id="eligibility"
          label={t('edit.eligibility')}
          error={form.formState.errors.eligibility_criteria?.message}
        >
          <textarea
            id="eligibility"
            aria-invalid={!!form.formState.errors.eligibility_criteria}
            aria-describedby={
              form.formState.errors.eligibility_criteria ? 'eligibility-error' : undefined
            }
            className="min-h-28 w-full rounded-lg border border-[#e2e8f0] p-3"
            {...form.register('eligibility_criteria')}
          />
        </Field>
        <div className="md:col-span-2">
          <Field
            id="description"
            label={t('edit.description')}
            error={form.formState.errors.description_html?.message}
          >
            <textarea
              id="description"
              aria-invalid={!!form.formState.errors.description_html}
              aria-describedby={
                form.formState.errors.description_html ? 'description-error' : undefined
              }
              className="min-h-36 w-full rounded-lg border border-[#e2e8f0] p-3"
              {...form.register('description_html')}
            />
          </Field>
        </div>
      </div>
      {apiError ? (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-[var(--color-bg-error-subtle)] p-3 text-sm text-[var(--color-text-error)]"
        >
          {apiError}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={!form.formState.isDirty || update.isPending}
          isLoading={update.isPending}
        >
          {update.isPending ? t('edit.saving') : t('edit.save')}
        </Button>
        <Link
          href={`/admin/scholarships/review/${id}`}
          className="inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-medium"
        >
          {t('actions.cancel')}
        </Link>
      </div>
    </form>
  );
}

export function ScholarshipReviewEditPage({ id }: { id: number }) {
  const t = useTranslations('AdminScholarshipReview');
  const locale = useLocale();
  const query = useScholarshipReviewDetail(id);
  if (
    !Number.isInteger(id) ||
    id < 1 ||
    (query.error instanceof ApiError && query.error.status === 404)
  )
    return (
      <main className="mx-auto max-w-[1156px] py-6">
        <p role="alert">
          {t('errors.notFound')}{' '}
          <Link className="underline" href="/admin/scholarships/review">
            {t('actions.backToList')}
          </Link>
        </p>
      </main>
    );
  if (query.isPending)
    return (
      <div className="flex min-h-48 items-center justify-center gap-2" role="status">
        <Loader2 className="size-5 animate-spin" />
        {t('states.loadingDetail')}
      </div>
    );
  if (query.isError || !query.data)
    return (
      <main className="mx-auto max-w-[1156px] py-6">
        <p role="alert">{t('errors.detail')}</p>
      </main>
    );
  const detail = query.data;
  const source = getSafeExternalUrl(detail.source_url);
  if (detail.status !== 'pending')
    return (
      <main className="mx-auto max-w-[1156px] py-6">
        <p role="alert" className="rounded-2xl bg-white p-6">
          {t('errors.notEditable')}{' '}
          <Link className="underline" href={`/admin/scholarships/review/${id}`}>
            {t('actions.backToDetail')}
          </Link>
        </p>
      </main>
    );
  const metadata = [detail.organization_name, detail.university_name, detail.country]
    .filter(Boolean)
    .join(' · ');
  const timestamp = formatDateTime(detail.scraped_at, locale);
  const ingestion =
    detail.ingestion_type === 'manual' || detail.ingestion_type === 'scraped'
      ? t(`ingestion.${detail.ingestion_type}`)
      : null;
  return (
    <main className="mx-auto max-w-[1156px] py-6">
      <Link
        href="/admin/scholarships/review"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[#635f80] hover:text-[#f97316] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('actions.backToList')}
      </Link>
      <section className="mb-6 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_12px_rgba(2,38,71,0.04)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1e1b33]">{detail.title}</h2>
            {metadata ? <p className="mt-2 text-sm text-[#434343]">{metadata}</p> : null}
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#635f80]">
              <span className="rounded-full bg-orange-50 px-3 py-1 text-[#7c3f00]">
                {t('status.pending')}
              </span>
              {ingestion ? <span>{ingestion}</span> : null}
              {timestamp ? (
                <time dateTime={detail.scraped_at ?? undefined}>{timestamp}</time>
              ) : null}
            </div>
          </div>
          {source ? (
            <a
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[#635f80] underline hover:text-[#f97316]"
              href={source}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('actions.originalSource')} <ExternalLink className="size-4" />
            </a>
          ) : null}
        </div>
      </section>
      <EditForm id={id} initial={toScholarshipEditValues(detail)} />
    </main>
  );
}
