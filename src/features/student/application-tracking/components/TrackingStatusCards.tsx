'use client';

import { useTranslations } from 'next-intl';
import { TRACKING_CARD_ORDER } from '../constants';
import { statusPresentation } from '../lib/presentation';
import type { TrackingCardKey, TrackingCounts } from '../types';

export type SectionState = 'loading' | 'error' | 'ready';

interface TrackingStatusCardsProps {
  // From the tracked list. Ignored unless trackedState is 'ready'.
  counts: TrackingCounts | null;
  trackedState: SectionState;
  // From the saved list (the UI-only 7th card). Ignored unless savedState is 'ready'.
  savedCount: number | null;
  savedState: SectionState;
}

// Figma StatusCardsRow (2415:5342): seven cards, `saved` first (the rightmost in
// RTL). A section that is loading or failed shows a placeholder, never `0`.
export function TrackingStatusCards({
  counts,
  trackedState,
  savedCount,
  savedState,
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
        return (
          <li
            key={key}
            data-testid={`tracking-card-${key}`}
            data-state={value === null ? state : 'ready'}
            className="flex min-w-0 flex-col items-center justify-center gap-2.5 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.01)]"
          >
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
          </li>
        );
      })}
    </ul>
  );
}
