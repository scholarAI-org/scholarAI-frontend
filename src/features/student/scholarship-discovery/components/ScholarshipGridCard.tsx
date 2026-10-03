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

interface ScholarshipGridCardProps {
  card: ScholarshipCardModel;
  // Bookmark action (T039), placed in the image's top-end corner as in Figma.
  bookmarkSlot?: ReactNode;
  // Deadline line; filled by the deadline helpers (T041).
  footer?: ReactNode;
}

// Figma "scholarship card" (2358:9963): image with a top-end action slot, badges,
// title, country and level, divider, then Details and the deadline.
export function ScholarshipGridCard({ card, bookmarkSlot, footer }: ScholarshipGridCardProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const titleId = useId();
  const title = useCardTitle(card);

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white"
    >
      <div className="grid">
        <ScholarshipImage
          src={card.imageUrl}
          alt={t('card.imageAlt', { title })}
          className="col-start-1 row-start-1 aspect-[448/184] w-full"
        />
        {bookmarkSlot ? (
          <div className="col-start-1 row-start-1 me-[23px] mt-4 self-start justify-self-end">
            {bookmarkSlot}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ScholarshipBadges card={card} />
        <div className="flex flex-col gap-2">
          <ScholarshipTitle card={card} id={titleId} />
          <ScholarshipMeta card={card} />
        </div>
        <div className="mt-auto flex flex-col gap-4">
          <hr className="border-0 border-t border-gray-300" />
          <div className="flex min-h-10 items-center gap-4">
            <ScholarshipDetailsAction card={card} />
            <div className="min-w-0 flex-1 text-center text-xs leading-5 text-[#b5b5b5]">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
