'use client';

import { ArrowLeft, ExternalLink, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Button, buttonStyles } from '@/components/ui/Button';
import { ApiError } from '@/lib/api-client';
import { displayText, formatDateTime, getSafeExternalUrl } from '../lib/formatters';
import { getFundingValues, isValidRejectionReason, toDetailValues } from '../lib/presentation';
import {
  useApproveScholarship,
  useRejectScholarship,
  useScholarshipReviewDetail,
} from '../hooks/useScholarshipReview';
import type { ScholarshipReviewDetail } from '../types';

function Status({ value }: { value: string | null | undefined }) {
  const t = useTranslations('AdminScholarshipReview');
  const known = value && ['pending', 'approved', 'rejected'].includes(value);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-[#7c3f00]">
      <span className="size-2 rounded-full bg-[#f59e0b]" aria-hidden="true" />
      {known ? t(`status.${value}`) : t('status.unknown')}
    </span>
  );
}
function ExternalAction({ href, label }: { href: string | null | undefined; label: string }) {
  const safe = getSafeExternalUrl(href);
  return safe ? (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonStyles({ variant: 'primary', size: 'sm', className: 'rounded-full px-4' })}
      aria-label={`${label} (${new URL(safe).hostname})`}
    >
      {label}
      <ExternalLink className="size-4" aria-hidden="true" />
    </a>
  ) : (
    <span className="text-sm text-[#979797]">{label}: —</span>
  );
}
function TextList({
  items,
  empty,
}: {
  items: string[] | string | null | undefined;
  empty: string;
}) {
  const output = toDetailValues(items);
  return output.length ? (
    <ul className="list-disc space-y-2 ps-5 text-sm leading-6 text-[#434343]">
      {output.map((item, i) => (
        <li key={`${item}-${i}`}>{item}</li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-[#979797]">{empty}</p>
  );
}

function ReviewDialog({
  open,
  title,
  description,
  isPending,
  onClose,
  initialFocusRef,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  isPending: boolean;
  onClose: () => void;
  initialFocusRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const t = useTranslations('AdminScholarshipReview');
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `review-dialog-title-${title.toLowerCase().replaceAll(' ', '-')}`;
  const descriptionId = `${titleId}-description`;
  useEffect(() => {
    if (open) {
      const target = initialFocusRef.current;
      (target?.matches('button, textarea, input')
        ? target
        : target?.querySelector<HTMLElement>('button, textarea, input')
      )?.focus();
    }
  }, [initialFocusRef, open]);
  useEffect(() => {
    if (!open || isPending) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), [href], input:not([disabled]), select:not([disabled])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPending, onClose, open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a2243]/35 p-4"
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[calc(100vh-2rem)] w-full max-w-[512px] overflow-y-auto rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl"
      >
        <div className="flex min-h-[63px] items-center justify-between gap-4 border-b border-[#e2e8f0] px-5">
          <h2 id={titleId} className="text-lg font-bold text-[#1e1b33]">
            {title}
          </h2>
          <button
            type="button"
            aria-label={t('dialog.close')}
            disabled={isPending}
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-lg text-[#635f80] hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 pb-5 pt-4">
          <p id={descriptionId} className="text-sm leading-6 text-[#434343]">
            {description}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}

function DetailContent({ detail }: { detail: ScholarshipReviewDetail }) {
  const t = useTranslations('AdminScholarshipReview');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const approve = useApproveScholarship();
  const reject = useRejectScholarship();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const approveTriggerRef = useRef<HTMLSpanElement>(null);
  const rejectTriggerRef = useRef<HTMLSpanElement>(null);
  const approveCancelRef = useRef<HTMLSpanElement>(null);
  const rejectReasonRef = useRef<HTMLTextAreaElement>(null);
  const busy = approve.isPending || reject.isPending;
  const actionError = approve.error || reject.error;
  const context = [
    displayText(detail.organization_name),
    displayText(detail.university_name),
    displayText(detail.country),
  ]
    .filter(Boolean)
    .join(' · ');
  const deadline = detail.no_deadline
    ? t('details.noDeadline')
    : detail.deadline
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(detail.deadline))
      : t('values.unavailable');
  const ingest =
    detail.ingestion_type === 'manual' || detail.ingestion_type === 'scraped'
      ? t(`ingestion.${detail.ingestion_type}`)
      : t('values.unavailable');
  const funding = getFundingValues(detail.funding_type, detail.funding_amount);
  const updated = searchParams.get('notice') === 'updated';
  useEffect(() => {
    if (!updated) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('notice');
    router.replace(
      params.size
        ? `/admin/scholarships/review/${detail.id}?${params}`
        : `/admin/scholarships/review/${detail.id}`
    );
  }, [detail.id, router, searchParams, updated]);
  const submitApprove = () =>
    approve.mutate(detail.id, {
      onSuccess: () => router.replace('/admin/scholarships/review?notice=approved'),
    });
  const submitReject = () => {
    if (!isValidRejectionReason(reason)) {
      setReasonError(t('validation.rejectionReason'));
      return;
    }
    setReasonError(null);
    reject.mutate(
      { id: detail.id, reason: reason.trim() },
      { onSuccess: () => router.replace('/admin/scholarships/review?notice=rejected') }
    );
  };
  const closeApprove = () => {
    if (approve.isPending) return;
    setApproveOpen(false);
    window.setTimeout(() =>
      approveTriggerRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    );
  };
  const closeReject = () => {
    if (reject.isPending) return;
    setRejectOpen(false);
    window.setTimeout(() =>
      rejectTriggerRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    );
  };
  return (
    <div className="space-y-4">
      <ReviewDialog
        open={approveOpen}
        title={t('dialog.approveTitle')}
        description={t('dialog.approveDescription')}
        isPending={approve.isPending}
        onClose={closeApprove}
        initialFocusRef={approveCancelRef}
      >
        {approve.error ? (
          <p role="alert" className="mt-3 text-sm text-[var(--color-text-error)]">
            {approve.error instanceof ApiError && approve.error.message
              ? approve.error.message
              : t('errors.approvalFailure')}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <span ref={approveCancelRef}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-11 rounded-full px-5"
              disabled={approve.isPending}
              onClick={closeApprove}
            >
              {t('actions.cancel')}
            </Button>
          </span>
          <Button
            type="button"
            size="sm"
            className="h-11 rounded-full px-5"
            isLoading={approve.isPending}
            disabled={approve.isPending}
            onClick={submitApprove}
          >
            {approve.isPending ? t('dialog.approving') : t('dialog.confirm')}
          </Button>
        </div>
      </ReviewDialog>
      <ReviewDialog
        open={rejectOpen}
        title={t('dialog.rejectTitle')}
        description={t('dialog.rejectDescription')}
        isPending={reject.isPending}
        onClose={closeReject}
        initialFocusRef={rejectReasonRef}
      >
        <div className="mt-4 space-y-2">
          <label htmlFor="rejection-reason" className="text-sm font-medium text-[#434343]">
            {t('details.rejectionReason')}
          </label>
          <textarea
            id="rejection-reason"
            ref={rejectReasonRef}
            value={reason}
            minLength={3}
            placeholder={t('dialog.rejectionPlaceholder')}
            aria-invalid={reasonError ? 'true' : undefined}
            aria-describedby={reasonError ? 'rejection-reason-error' : undefined}
            onChange={(event) => {
              setReason(event.target.value);
              if (reasonError) setReasonError(null);
            }}
            className="min-h-24 w-full resize-y rounded-lg border border-[#e2e8f0] bg-white p-3 text-sm text-[#434343] placeholder:text-[#979797] focus-visible:outline-2 focus-visible:outline-[#f97316]"
          />
          {reasonError ? (
            <p
              id="rejection-reason-error"
              role="alert"
              className="text-sm text-[var(--color-text-error)]"
            >
              {reasonError}
            </p>
          ) : null}
          {reject.error ? (
            <p role="alert" className="text-sm text-[var(--color-text-error)]">
              {reject.error instanceof ApiError && reject.error.message
                ? reject.error.message
                : t('errors.rejectionFailure')}
            </p>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-11 rounded-full px-5"
            disabled={reject.isPending}
            onClick={closeReject}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-11 rounded-full bg-[var(--color-text-error)] px-5 hover:bg-[var(--color-text-error)]"
            isLoading={reject.isPending}
            disabled={reject.isPending}
            onClick={submitReject}
          >
            {reject.isPending ? t('dialog.rejecting') : t('dialog.confirm')}
          </Button>
        </div>
      </ReviewDialog>
      <Link
        href="/admin/scholarships/review"
        className="inline-flex items-center gap-1 text-sm text-[#635f80] hover:text-[#f97316] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t('actions.backToList')}
      </Link>
      {updated ? (
        <p
          role="status"
          className="rounded-xl bg-[var(--color-bg-success-subtle)] p-3 text-sm text-[var(--color-success)]"
        >
          {t('edit.saved')}
        </p>
      ) : null}
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_12px_rgba(2,38,71,0.04)]">
        <div className="flex flex-col justify-between gap-5 lg:flex-row">
          <div>
            <h1 className="text-xl font-bold text-[#1e1b33] sm:text-2xl">{detail.title}</h1>
            {context ? <p className="mt-2 text-sm text-[#434343]">{context}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Status value={detail.status} />
              <span className="text-sm text-[#635f80]">
                {t('details.ingestion')}: {ingest}
              </span>
              {detail.scraped_at ? (
                <time className="text-sm text-[#635f80]" dateTime={detail.scraped_at}>
                  {formatDateTime(detail.scraped_at, locale)}
                </time>
              ) : null}
            </div>
          </div>
          <ExternalAction href={detail.source_url} label={t('actions.originalSource')} />
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,330px)_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
            <h2 className="text-lg font-bold text-[#434343]">{t('details.information')}</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-[#979797]">{t('details.funding')}</dt>
                <dd className="mt-1 text-[#434343]">
                  {funding.length ? funding.join(' · ') : t('values.unavailable')}
                </dd>
              </div>
              <div>
                <dt className="text-[#979797]">{t('details.deadline')}</dt>
                <dd className="mt-1 text-[#434343]">{deadline}</dd>
              </div>
              <div>
                <dt className="text-[#979797]">{t('details.majors')}</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {toDetailValues(detail.majors).length ? (
                    toDetailValues(detail.majors).map((item, i) => (
                      <span
                        key={`${item}-${i}`}
                        className="rounded-full bg-[#f8fafc] px-3 py-1 text-[#434343]"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#979797]">{t('values.unavailable')}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[#979797]">{t('details.source')}</dt>
                <dd className="mt-1 break-all">
                  <ExternalAction href={detail.source_url} label={t('actions.openSource')} />
                </dd>
              </div>
              <div>
                <dt className="text-[#979797]">{t('details.application')}</dt>
                <dd className="mt-1 break-all">
                  <ExternalAction href={detail.apply_link} label={t('actions.openApplication')} />
                </dd>
              </div>
            </dl>
          </section>
          <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
            <h2 className="text-lg font-bold text-[#434343]">{t('details.actions')}</h2>
            {actionError && !approveOpen && !rejectOpen ? (
              <p role="alert" className="mt-3 text-sm text-[var(--color-text-error)]">
                {actionError instanceof ApiError && actionError.message
                  ? actionError.message
                  : t('errors.action')}
              </p>
            ) : null}
            {detail.status === 'pending' ? (
              <div className="mt-4 space-y-3">
                <Link
                  href={`/admin/scholarships/review/${detail.id}/edit`}
                  className="flex w-full items-center justify-center rounded-full border border-[#e2e8f0] px-4 py-2.5 text-sm font-medium text-[#434343]"
                >
                  {t('actions.edit')}
                </Link>
                <span ref={approveTriggerRef}>
                  <Button
                    type="button"
                    size="md"
                    className="w-full rounded-full"
                    disabled={busy}
                    onClick={() => setApproveOpen(true)}
                  >
                    {t('actions.approve')}
                  </Button>
                </span>
                <span ref={rejectTriggerRef}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="w-full rounded-full text-[var(--color-text-error)]"
                    disabled={busy}
                    onClick={() => setRejectOpen(true)}
                  >
                    {t('actions.reject')}
                  </Button>
                </span>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#979797]">{t('details.noActions')}</p>
            )}
          </section>
        </aside>
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
            <h2 className="text-lg font-bold text-[#434343]">{t('details.overview')}</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#434343]">
              {displayText(detail.description_html) ?? t('details.emptyOverview')}
            </p>
          </section>
          <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
            <h2 className="text-lg font-bold text-[#434343]">{t('details.eligibility')}</h2>
            <div className="mt-4">
              <TextList items={detail.eligibility_criteria} empty={t('details.emptyEligibility')} />
            </div>
          </section>
          <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
            <h2 className="text-lg font-bold text-[#434343]">{t('details.requiredDocuments')}</h2>
            <div className="mt-4">
              <TextList items={detail.required_documents} empty={t('details.emptyDocuments')} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function ScholarshipReviewDetailPage({ id }: { id: number }) {
  const t = useTranslations('AdminScholarshipReview');
  const query = useScholarshipReviewDetail(id);
  if (
    !Number.isInteger(id) ||
    id < 1 ||
    (query.error instanceof ApiError && query.error.status === 404)
  )
    return (
      <div className="mx-auto max-w-[1156px] py-6">
        <p role="alert" className="rounded-2xl bg-white p-6 text-[#434343]">
          {t('errors.notFound')}{' '}
          <Link className="text-[#f97316] underline" href="/admin/scholarships/review">
            {t('actions.backToList')}
          </Link>
        </p>
      </div>
    );
  if (query.isPending)
    return (
      <div className="flex min-h-48 items-center justify-center gap-2" role="status">
        <Loader2 className="size-5 animate-spin text-[#f97316]" />
        {t('states.loadingDetail')}
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className="mx-auto max-w-[1156px] py-6">
        <div role="alert" className="rounded-2xl bg-white p-6">
          <p>{t('errors.detail')}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => void query.refetch()}
          >
            {t('actions.retry')}
          </Button>
        </div>
      </div>
    );
  return (
    <main className="mx-auto max-w-[1156px] py-6">
      <DetailContent detail={query.data} />
    </main>
  );
}
