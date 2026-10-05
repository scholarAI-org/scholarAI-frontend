'use client';

import { useId, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { ScholarshipCardModel } from '../types';
import {
  ScholarshipBadges,
  ScholarshipDetailsAction,
  ScholarshipMeta,
  ScholarshipTitle,
  useCardTitle,
} from './ScholarshipCardParts';
import { ScholarshipImage } from './ScholarshipImage';

interface ScholarshipListRowProps {
  card: ScholarshipCardModel;
  bookmarkSlot?: ReactNode;
  footer?: ReactNode;
  detailsEnabled?: boolean;
}

// No List View exists in Figma; this compact row reuses the grid card's model,
// actions and visual system (plan risk "No List Figma").
export function ScholarshipListRow({
  card,
  bookmarkSlot,
  footer,
  detailsEnabled = true,
}: ScholarshipListRowProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const titleId = useId();
  const title = useCardTitle(card);

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white sm:flex-row"
    >
      <ScholarshipImage
        src={card.imageUrl}
        alt={t('card.imageAlt', { title })}
        className="aspect-[448/184] w-full shrink-0 sm:aspect-[4/3] sm:w-44"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <ScholarshipBadges card={card} />
            <ScholarshipTitle card={card} id={titleId} detailsEnabled={detailsEnabled} />
          </div>
          {bookmarkSlot}
        </div>
        <ScholarshipMeta card={card} withProvider />
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-300 pt-3">
          <ScholarshipDetailsAction card={card} detailsEnabled={detailsEnabled} />
          <div className="min-w-0 flex-1 text-xs leading-5 text-[#b5b5b5]">{footer}</div>
        </div>
      </div>
    </article>
  );
}
