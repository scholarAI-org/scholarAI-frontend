'use client';

import { CircleCheck, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { FOCUSABLE_SELECTOR, getFocusTrapTarget } from '@/features/student/layout/focus-trap';
import { useReportScholarship } from '../hooks/useReportScholarship';
import {
  buildReportRequest,
  classifyReportError,
  DESCRIPTION_MAX_LENGTH,
  REPORT_TYPES,
  type ReportErrorKind,
  type ReportFormErrors,
} from '../lib/report';
import { focusRing } from './DetailsParts';

const buttonBase = `inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

function ReportForm({ id, onClose }: { id: number; onClose: () => void }) {
  const t = useTranslations('StudentScholarshipReport');
  const ids = useId();
  const mutation = useReportScholarship(id);
  const [reportType, setReportType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<ReportFormErrors>({});
  const [failure, setFailure] = useState<ReportErrorKind | null>(null);
  const pending = mutation.isPending;
  const count = [...description].length;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    const result = buildReportRequest({ reportType, description });
    if (!result.ok) {
      setErrors(result.errors);
      setFailure(null);
      // Move focus to the first thing to fix, so the error is not missed.
      const first = result.errors.reportType ? `${ids}-type-0` : `${ids}-details`;
      document.getElementById(first)?.focus();
      return;
    }
    setErrors({});
    setFailure(null);
    mutation.mutate(result.body, { onError: (error) => setFailure(classifyReportError(error)) });
  }

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-8 text-center" role="status">
        <CircleCheck aria-hidden className="size-10 text-[#16c172]" />
        <h3 className="text-lg font-bold text-[#1e293b]">{t('dialog.successTitle')}</h3>
        <p className="text-sm leading-6 text-[#64748b]">{t('dialog.successBody')}</p>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          className={`${buttonBase} mt-2 bg-orange-500 text-white hover:bg-[var(--color-primary-hover)]`}
        >
          {t('dialog.close')}
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4 px-5 pt-4 pb-5">
      <p id={`${ids}-intro`} className="text-sm leading-6 text-[#64748b]">
        {t('dialog.intro')}
      </p>

      <fieldset
        aria-describedby={errors.reportType ? `${ids}-type-error` : undefined}
        className="flex flex-col gap-2"
      >
        <legend className="mb-2 text-sm font-bold text-[#1e293b]">
          {t('dialog.reasonLegend')}
        </legend>
        {REPORT_TYPES.map((type, index) => (
          <label
            key={type}
            className="flex min-h-[46px] cursor-pointer items-center gap-3 rounded-xl border border-gray-300 bg-white px-3 text-sm text-[#434343] has-[:checked]:border-orange-500 has-[:checked]:bg-orange-500/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-orange-500"
          >
            <input
              id={`${ids}-type-${index}`}
              type="radio"
              name={`${ids}-type`}
              value={type}
              checked={reportType === type}
              onChange={() => {
                setReportType(type);
                setErrors((current) => ({ ...current, reportType: undefined }));
              }}
              className="size-4 shrink-0 accent-orange-500"
            />
            <span>{t(`dialog.reasons.${type}`)}</span>
          </label>
        ))}
        {errors.reportType ? (
          <p
            id={`${ids}-type-error`}
            role="alert"
            className="text-xs text-[var(--color-text-error)]"
          >
            {t('errors.reasonRequired')}
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${ids}-details`} className="text-sm font-bold text-[#1e293b]">
          {t('dialog.detailsLabel')}
        </label>
        <textarea
          id={`${ids}-details`}
          rows={3}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            setErrors((current) => ({ ...current, description: undefined }));
          }}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={`${ids}-details-hint${errors.description ? ` ${ids}-details-error` : ''}`}
          className={`w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm text-[#434343] ${
            errors.description ? 'border-[var(--color-text-error)]' : 'border-gray-300'
          } ${focusRing}`}
        />
        <div className="flex items-start justify-between gap-3 text-xs">
          <p id={`${ids}-details-hint`} className="text-[#64748b]">
            {t('dialog.detailsHint')}
          </p>
          <p
            aria-hidden
            className={`shrink-0 tabular-nums ${count > DESCRIPTION_MAX_LENGTH ? 'text-[var(--color-text-error)]' : 'text-[#64748b]'}`}
          >
            {t('dialog.counter', { count })}
          </p>
        </div>
        {errors.description ? (
          <p
            id={`${ids}-details-error`}
            role="alert"
            className="text-xs text-[var(--color-text-error)]"
          >
            {t('errors.detailsTooLong')}
          </p>
        ) : null}
      </div>

      {failure ? (
        <p
          role="alert"
          className="rounded-xl bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]"
        >
          {t(`errors.${failure}`)}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          aria-busy={pending}
          disabled={pending}
          className={`${buttonBase} bg-orange-500 text-white hover:bg-[var(--color-primary-hover)]`}
        >
          {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          {pending ? t('dialog.sending') : t('dialog.submit')}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className={`${buttonBase} border border-gray-300 bg-white text-[#64748b] hover:bg-[#f8fafc]`}
        >
          {t('dialog.cancel')}
        </button>
      </div>
    </form>
  );
}

// Report-a-problem dialog (Figma 2910:8705). A native modal <dialog> makes the
// rest of the page inert and handles Esc; Tab is also wrapped at both ends so
// focus can never leave it, and the browser returns focus to the opener on close.
export function ReportDialog({
  id,
  open,
  onClose,
}: {
  id: number;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('StudentScholarshipReport');
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start on the first reason, not on the close button.
      dialog.querySelector<HTMLElement>('[data-autofocus], input')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((element) => !element.hasAttribute('disabled'));
    const target = getFocusTrapTarget(
      focusable.indexOf(document.activeElement as HTMLElement),
      focusable.length,
      event.shiftKey
    );
    if (target !== null) {
      event.preventDefault();
      focusable[target]?.focus();
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      onKeyDown={trapFocus}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      data-testid="report-dialog"
      className="m-auto w-[calc(100%-2rem)] max-w-[512px] rounded-2xl bg-white p-0 text-start shadow-2xl backdrop:bg-[#0a2243]/40"
    >
      {open ? (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-[#f1f5f9] px-5 py-4">
            <h2 id={headingId} className="text-base font-bold text-[#1e293b]">
              {t('dialog.title')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('dialog.close')}
              className={`flex size-8 items-center justify-center rounded-full text-[#64748b] hover:bg-[#f1f5f9] ${focusRing}`}
            >
              <X aria-hidden className="size-[18px]" />
            </button>
          </div>
          <ReportForm id={id} onClose={onClose} />
        </>
      ) : null}
    </dialog>
  );
}
