'use client';

import { useTranslations } from 'next-intl';

interface ProfileCompletionBarProps {
  // Already clamped to 0..100.
  percent: number;
}

// Figma 2353:5390: label at the start, percentage at the end, bar below.
export function ProfileCompletionBar({ percent }: ProfileCompletionBarProps) {
  const t = useTranslations('StudentHome');
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 text-[#434343]">{t('welcome.completion')}</span>
        <span className="shrink-0 font-bold text-[#274383]">
          {t('welcome.completionValue', { percent })}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t('welcome.completion')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full overflow-hidden rounded-full bg-[#ede9fe]"
      >
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
