'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { classifyTrackingError } from '../lib/errors';

// Loading placeholder for the list. The status region announces the state so a
// screen reader never hears "zero" while the request is pending.
export function TrackingLoading() {
  const t = useTranslations('StudentTracking');
  return (
    <div className="flex flex-col gap-7" data-testid="tracking-loading">
      <span className="sr-only" role="status" aria-live="polite">
        {t('page.loading')}
      </span>
      {[0, 1].map((index) => (
        <div
          key={index}
          aria-hidden
          className="flex h-[235px] animate-pulse flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-6"
        >
          <div className="h-5 w-2/5 rounded bg-[#e2e8f0]" />
          <div className="h-3 w-1/3 rounded bg-[#e2e8f0]" />
          <div className="mt-auto h-[89px] rounded-xl bg-[#f1f5f9]" />
        </div>
      ))}
    </div>
  );
}

// The student tracks nothing yet. Only shown for a confirmed empty list, never
// for a failed or pending request.
export function TrackingEmpty() {
  const t = useTranslations('StudentTracking');
  return (
    <section
      aria-labelledby="tracking-empty-heading"
      className="flex flex-col items-center gap-4 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-14 text-center"
      data-testid="tracking-empty"
    >
      <h2 id="tracking-empty-heading" className="text-lg font-bold text-[rgba(30,27,51,0.7)]">
        {t('empty.heading')}
      </h2>
      <p className="max-w-md text-sm text-[#979797]">{t('empty.body')}</p>
      <Link
        href="/student/scholarships"
        className="inline-flex items-center justify-center rounded-full bg-[#f97316] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#ea580c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        data-testid="tracking-empty-cta"
      >
        {t('empty.cta')}
      </Link>
    </section>
  );
}

type Reason = 'unauthorized' | 'forbidden' | 'generic';

export function trackingErrorReason(error: unknown): Reason {
  const kind = classifyTrackingError(error);
  if (kind === 'auth') return 'unauthorized';
  if (kind === 'forbidden') return 'forbidden';
  // Contract errors and everything else get the generic, retryable copy: the UI
  // never reveals backend contract details.
  return 'generic';
}

export function TrackingErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const t = useTranslations('StudentTracking');
  const reason = trackingErrorReason(error);
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-10 text-center text-sm"
      data-testid="tracking-error"
      data-tracking-error-reason={reason}
    >
      <AlertCircle aria-hidden className="size-5 shrink-0 text-orange-500" />
      <span className="text-[var(--color-text-error)]">{t(`errors.${reason}`)}</span>
      {reason !== 'forbidden' ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full"
          onClick={onRetry}
          data-testid="tracking-error-retry"
        >
          {t('errors.retry')}
        </Button>
      ) : null}
    </div>
  );
}
