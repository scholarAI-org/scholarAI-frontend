'use client';

import { Flag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { DetailsCard, focusRing } from './DetailsParts';
import { ReportDialog } from './ReportDialog';

// The "problem with this scholarship?" card (Figma 2481:4644) and its dialog.
export function ReportProblemCard({ id }: { id: number }) {
  const t = useTranslations('StudentScholarshipReport');
  const ids = useId();
  const [open, setOpen] = useState(false);

  return (
    <DetailsCard id={`${ids}-title`} title={t('card.title')}>
      <p className="text-sm leading-6 text-[#64748b]">{t('card.body')}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 text-sm text-[#64748b] transition-colors hover:bg-[#f8fafc] ${focusRing}`}
      >
        <Flag aria-hidden className="size-4 [&:dir(rtl)]:-scale-x-100" />
        {t('card.open')}
      </button>
      <ReportDialog id={id} open={open} onClose={() => setOpen(false)} />
    </DetailsCard>
  );
}
