'use client';

import { ChevronDown, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { TRACKING_STATUSES } from '@/features/student/application-tracking/constants';
import type { TrackingStatus } from '@/features/student/application-tracking/types';
import { useScholarshipTracking, useSetScholarshipTracking } from '../hooks/useScholarshipTracking';
import { DetailsCard, focusRing } from './DetailsParts';

// The status a student starts at: the first step of the application lifecycle.
const START_STATUS: TrackingStatus = 'preparing_documents';

// Application status card (Figma "حالة الطلب"): start tracking, or change the
// status of an application that is already tracked. Everything it shows comes
// from GET/PUT /api/scholarships/{id}/tracking.
export function DetailsTracking({ id }: { id: number }) {
  const t = useTranslations('StudentScholarshipDetails');
  const tStatus = useTranslations('StudentTracking');
  const ids = useId();
  const tracking = useScholarshipTracking(id);
  const mutation = useSetScholarshipTracking(id);
  const status = tracking.data?.status ?? null;
  const saving = mutation.isPending;

  let body;
  if (tracking.isPending) {
    body = (
      <p role="status" className="flex items-center gap-2 text-sm text-[#64748b]">
        <Loader2 aria-hidden className="size-4 animate-spin" />
        {t('tracking.loading')}
      </p>
    );
  } else if (tracking.isError) {
    body = (
      <div role="alert" className="flex flex-col items-start gap-2 text-sm">
        <p className="text-[var(--color-text-error)]">{t('tracking.loadError')}</p>
        <button
          type="button"
          onClick={() => void tracking.refetch()}
          className={`rounded-full border border-gray-300 px-4 py-1.5 text-[#274383] hover:bg-[#f8fafc] ${focusRing}`}
        >
          {t('tracking.retry')}
        </button>
      </div>
    );
  } else if (status === null) {
    body = (
      <>
        <p className="text-sm leading-6 text-[#64748b]">{t('tracking.hint')}</p>
        <button
          type="button"
          disabled={saving}
          aria-busy={saving}
          onClick={() => mutation.mutate(START_STATUS)}
          className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-[#274383] px-4 text-base font-medium text-[#274383] transition-colors hover:bg-[#274383]/5 disabled:opacity-60 ${focusRing}`}
        >
          {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          {t('tracking.start')}
        </button>
      </>
    );
  } else {
    body = (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${ids}-status`} className="text-xs leading-5 text-[#64748b]">
          {t('tracking.statusLabel')}
        </label>
        <div className="relative">
          <select
            id={`${ids}-status`}
            value={status}
            disabled={saving}
            aria-busy={saving}
            onChange={(event) => mutation.mutate(event.target.value as TrackingStatus)}
            className={`h-[52px] w-full appearance-none rounded-full border border-gray-300 bg-white ps-4 pe-11 text-base text-[#434343] disabled:opacity-60 ${focusRing}`}
          >
            {TRACKING_STATUSES.map((value) => (
              <option key={value} value={value}>
                {tStatus(`status.${value}`)}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-[#64748b]"
          />
        </div>
      </div>
    );
  }

  return (
    <DetailsCard id={`${ids}-title`} title={t('tracking.title')}>
      {body}
      <p role="status" aria-live="polite" className={mutation.isError ? 'text-sm' : 'sr-only'}>
        {mutation.isError ? (
          <span className="text-[var(--color-text-error)]">{t('tracking.updateError')}</span>
        ) : mutation.isSuccess ? (
          t('tracking.updated')
        ) : null}
      </p>
    </DetailsCard>
  );
}
