'use client';

import { useState } from 'react';
import { ClipboardCheck, ClipboardPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useStartedMap } from '../hooks/useStartedMap';
import { useTrackedQuery } from '../hooks/useTrackedQuery';
import { useStartTracking } from '../hooks/useTrackingMutations';
import { classifyTrackingError, type TrackingErrorKind } from '../lib/errors';
import { selectStartState } from '../lib/start-state';

interface TrackScholarshipButtonProps {
  scholarshipId: number;
  title?: string;
  // card: the compact pill on discovery and saved cards; details: the full-width
  // button in the apply panel of the details page.
  variant?: 'card' | 'details';
}

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full border text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500';
const variants = {
  card: 'h-10 px-4',
  details: 'h-[52px] w-full px-4 text-base',
};
const startClass = 'border-orange-500 bg-white text-orange-600 hover:bg-orange-50';
const trackedClass = 'border-[#e2e8f0] bg-[#f8fafc] text-[#434343] hover:bg-white';

// Start tracking from a scholarship card or the details page (rendered only when
// TRACKING_ENABLED is on: the pages pass this in through a slot). It shows nothing
// until the tracked list is known, so it never offers to track something that is
// already tracked. Clicking flips it to "Tracking" at once and back on failure.
export function TrackScholarshipButton({
  scholarshipId,
  title,
  variant = 'card',
}: TrackScholarshipButtonProps) {
  const t = useTranslations('StudentTracking');
  const tracked = useTrackedQuery();
  const started = useStartedMap();
  const start = useStartTracking();
  const [failure, setFailure] = useState<TrackingErrorKind | null>(null);

  const state = selectStartState(tracked.data, started, scholarshipId);
  if (state.kind === 'unknown') return null;

  function begin() {
    setFailure(null);
    start
      .mutateAsync({ scholarshipId })
      .catch((error: unknown) => setFailure(classifyTrackingError(error)));
  }

  if (state.kind === 'tracked') {
    const status = t(`status.${state.status}`);
    return (
      <div className={variant === 'details' ? 'flex w-full' : 'flex'} data-testid="track-control">
        <Link
          href="/student/tracking"
          aria-label={title ? t('track.trackingFor', { title }) : undefined}
          aria-busy={state.pending}
          className={`${base} ${variants[variant]} ${trackedClass}`}
          data-testid="track-tracked"
        >
          <ClipboardCheck aria-hidden className="size-4 text-[#16c172]" />
          <span>{t('track.trackingStatus', { status })}</span>
        </Link>
      </div>
    );
  }

  const failureKey =
    failure === null
      ? null
      : failure === 'not-found'
        ? 'track.notFound'
        : failure === 'forbidden'
          ? 'track.forbidden'
          : 'track.failed';

  return (
    <div
      className={
        variant === 'details' ? 'flex w-full flex-col gap-1' : 'flex flex-col items-start gap-1'
      }
      data-testid="track-control"
    >
      <button
        type="button"
        onClick={begin}
        aria-label={title ? t('track.startFor', { title }) : undefined}
        className={`${base} ${variants[variant]} ${startClass}`}
        data-testid="track-start"
      >
        <ClipboardPlus aria-hidden className="size-4" />
        <span>{t('track.start')}</span>
      </button>
      <p
        role="status"
        aria-live="polite"
        className={failureKey ? 'text-xs leading-5 text-[var(--color-text-error)]' : 'sr-only'}
        data-testid="track-failure"
      >
        {failureKey ? t(failureKey) : null}
      </p>
    </div>
  );
}
