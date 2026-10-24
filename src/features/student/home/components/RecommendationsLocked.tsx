'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { RECOMMENDATIONS_UNLOCK_PERCENT } from '../constants';

// Figma 2354:6598: icon chip, title, explanation and a primary call to action.
export function RecommendationsLocked() {
  const t = useTranslations('StudentHome');
  return (
    <div className="flex flex-col items-center gap-4 px-2 py-6 text-center sm:py-8">
      <span
        aria-hidden
        className="flex size-[72px] items-center justify-center rounded-2xl bg-[#f8fafc] text-orange-500"
      >
        <TriangleAlert className="size-9" />
      </span>
      <div className="flex max-w-md flex-col gap-1">
        <h3 className="text-base font-bold text-black">{t('recommendations.locked.title')}</h3>
        <p className="text-sm leading-6 text-[#b5b5b5]">
          {t('recommendations.locked.text', { percent: RECOMMENDATIONS_UNLOCK_PERCENT })}
        </p>
      </div>
      <Link
        href="/student/profile"
        className="inline-flex h-[52px] w-full max-w-[286px] items-center justify-center rounded-full bg-[#274383] px-6 text-base font-bold text-white transition-colors hover:bg-[#1f356a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        {t('recommendations.locked.cta')}
      </Link>
    </div>
  );
}
