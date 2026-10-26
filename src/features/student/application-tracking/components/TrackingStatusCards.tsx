'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { TRACKING_CARD_ORDER } from '../constants';
import { statusPresentation } from '../lib/presentation';
import type { SectionState } from '../lib/view-state';
import type { TrackingCardKey, TrackingCounts, TrackingStatus } from '../types';

interface TrackingStatusCardsProps {
  // From the tracked list. Ignored unless trackedState is 'ready'.
  counts: TrackingCounts | null;
  trackedState: SectionState;
  // From the saved list (the UI-only 7th card). Ignored unless savedState is 'ready'.
  savedCount: number | null;
  savedState: SectionState;
  // The status filter. The six backend statuses toggle it; `saved` never does.
  activeFilter: TrackingStatus | null;
  onToggleFilter: (status: TrackingStatus) => void;
  // Where the saved card goes, or null when the Saved page is not enabled.
  savedHref: string | null;
}

const cardClass =
  'flex min-w-0 flex-col items-center justify-center gap-2.5 rounded-2xl border bg-white p-4 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.01)]';
const focusClass =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500';

// Figma StatusCardsRow (2415:5342): seven cards, `saved` first (the rightmost in
// RTL). A section that is loading or failed shows a placeholder, never `0`.
// Once the tracked list is loaded the six status cards are filter toggles.
export function TrackingStatusCards({
  counts,
  trackedState,
  savedCount,
  savedState,
  activeFilter,
  onToggleFilter,
  savedHref,
}: TrackingStatusCardsProps) {
  const t = useTranslations('StudentTracking');

  return (
    <ul
      aria-label={t('summary.label')}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
      data-testid="tracking-status-cards"
    >
      {TRACKING_CARD_ORDER.map((key) => {
        const { icon: Icon, textClass } = statusPresentation[key];
        const state = key === 'saved' ? savedState : trackedState;
        const value =
          state !== 'ready'
            ? null
            : key === 'saved'
              ? savedCount
              : counts
                ? counts[key as Exclude<TrackingCardKey, 'saved'>]
                : null;
        const pressed = key !== 'saved' && activeFilter === key;

        const content: ReactNode = (
          <>
            <span className={`flex size-8 items-center justify-center ${textClass}`}>
              <Icon aria-hidden className="size-5" />
            </span>
            {value === null ? (
              state === 'loading' ? (
                <span
                  aria-hidden
                  className="h-7 w-5 animate-pulse rounded bg-[#e2e8f0]"
                  data-testid={`tracking-card-${key}-loading`}
                />
              ) : (
                <span
                  className="text-2xl font-bold text-[rgba(30,27,51,0.7)]"
                  title={t('summary.unavailable')}
                  data-testid={`tracking-card-${key}-unavailable`}
                >
                  <span aria-hidden>—</span>
                  <span className="sr-only">{t('summary.unavailable')}</span>
                </span>
              )
            ) : (
              <span className="text-2xl font-bold text-[rgba(30,27,51,0.7)]">{value}</span>
            )}
            <span className={`text-center text-xs leading-5 ${textClass}`}>
              {t(`status.${key}`)}
            </span>
          </>
        );

        // The saved card is a link (only when its count is known and the page is
        // enabled); the others are toggle buttons once the tracked list is loaded.
        let inner: ReactNode;
        if (key === 'saved') {
          inner =
            savedHref && value !== null ? (
              <Link
                href={savedHref}
                className={`${cardClass} w-full border-[#e2e8f0] hover:border-orange-300 ${focusClass}`}
              >
                {content}
              </Link>
            ) : (
              <div className={`${cardClass} h-full border-[#e2e8f0]`}>{content}</div>
            );
        } else if (value !== null) {
          inner = (
            <button
              type="button"
              aria-pressed={pressed}
              onClick={() => onToggleFilter(key as TrackingStatus)}
              className={`${cardClass} w-full cursor-pointer transition-colors ${focusClass} ${
                pressed
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-[#e2e8f0] hover:border-orange-300'
              }`}
            >
              {content}
            </button>
          );
        } else {
          inner = <div className={`${cardClass} h-full border-[#e2e8f0]`}>{content}</div>;
        }

        return (
          <li
            key={key}
            data-testid={`tracking-card-${key}`}
            data-state={value === null ? state : 'ready'}
            className="flex min-w-0"
          >
            {inner}
          </li>
        );
      })}
    </ul>
  );
}
