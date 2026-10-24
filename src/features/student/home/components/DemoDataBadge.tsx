'use client';

import { useTranslations } from 'next-intl';

// Marks a section that runs on demo data (local development only).
export function DemoDataBadge() {
  const t = useTranslations('StudentHome');
  return (
    <span
      data-demo
      className="inline-flex h-5 w-fit shrink-0 items-center rounded-full bg-amber-50 px-2 text-[10px] font-medium text-amber-700"
    >
      {t('demoBadge')}
    </span>
  );
}
