'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TRACKING_STATUSES } from '../constants';
import { statusPresentation } from '../lib/presentation';
import type { TrackingStatus } from '../types';

interface TrackingStatusSelectProps {
  value: TrackingStatus;
  title: string;
  onChange: (status: TrackingStatus) => void;
}

// Figma "drop menu" (2415:6407): a pill with the status icon, label and chevron.
// A native select keeps keyboard, screen reader and mobile pickers for free.
// All six backend statuses are selectable; `saved` is not one of them.
export function TrackingStatusSelect({ value, title, onChange }: TrackingStatusSelectProps) {
  const t = useTranslations('StudentTracking');
  const { icon: Icon, textClass } = statusPresentation[value];

  return (
    <div className="relative inline-flex h-10 w-full items-center sm:w-[195px]">
      <Icon
        aria-hidden
        className={`pointer-events-none absolute start-4 size-4 shrink-0 ${textClass}`}
      />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TrackingStatus)}
        aria-label={`${t('card.statusLabel')}: ${title}`}
        data-testid="tracking-status-select"
        className="h-full w-full cursor-pointer appearance-none rounded-full border border-[#e2e8f0] bg-white ps-10 pe-9 text-xs text-[#434343] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        {TRACKING_STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(`status.${status}`)}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute end-4 size-2.5 shrink-0 text-[#434343]"
      />
    </div>
  );
}
