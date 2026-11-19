'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { classifyListError } from '../lib/errors';

// The design has no loading, empty or error state; these follow the Saved and Tracking pages
// (a white rounded-2xl card, an AlertCircle card with role="alert" and a Retry button, skeletons
// with an sr-only status).

export function NotificationsLoading() {
  const t = useTranslations('StudentNotifications');
  return (
    <div className="flex flex-col gap-4" data-testid="notifications-loading">
      <span className="sr-only" role="status" aria-live="polite">
        {t('page.loading')}
      </span>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          aria-hidden
          className="flex animate-pulse items-start gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:px-5 sm:py-[18px]"
        >
          <div className="size-[42px] shrink-0 rounded-xl bg-[#e2e8f0]" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="h-4 w-2/5 rounded bg-[#e2e8f0]" />
            <div className="h-3 w-4/5 rounded bg-[#f1f5f9]" />
            <div className="h-3 w-1/4 rounded bg-[#f1f5f9]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Only for a confirmed empty list (the last page is loaded and nothing is renderable), never for
// a failed or pending request.
export function NotificationsEmpty() {
  const t = useTranslations('StudentNotifications');
  return (
    <section
      aria-labelledby="notifications-empty-heading"
      className="flex flex-col items-center gap-4 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-14 text-center"
      data-testid="notifications-empty"
    >
      <h2 id="notifications-empty-heading" className="text-lg font-bold text-[rgba(30,27,51,0.7)]">
        {t('empty.heading')}
      </h2>
      <p className="max-w-md text-sm text-[#979797]">{t('empty.body')}</p>
      <Link
        href="/student/scholarships"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f97316] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#ea580c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        data-testid="notifications-empty-cta"
      >
        {t('empty.cta')}
      </Link>
    </section>
  );
}

// First-page failure: a reason-specific message, and Retry except when access is unavailable.
export function NotificationsError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const t = useTranslations('StudentNotifications');
  const reason = classifyListError(error);
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-10 text-center text-sm"
      data-testid="notifications-error"
      data-notifications-error-reason={reason}
    >
      <AlertCircle aria-hidden className="size-5 shrink-0 text-orange-500" />
      <span className="text-[var(--color-text-error)]">{t(`errors.${reason}`)}</span>
      {reason !== 'forbidden' ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-11 rounded-full"
          onClick={onRetry}
          data-testid="notifications-error-retry"
        >
          {t('errors.retry')}
        </Button>
      ) : null}
    </div>
  );
}
