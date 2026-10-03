'use client';

import { Bookmark, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useScholarshipBookmark } from '../hooks/useScholarshipBookmark';
import type { ScholarshipCardModel } from '../types';
import { useCardTitle } from './ScholarshipCardParts';

interface ScholarshipBookmarkProps {
  card: ScholarshipCardModel;
  // overlay: the white circle on the grid image; inline: the list-row spot;
  // details: the labelled pill on the details page (Figma 2481:4560).
  variant: 'overlay' | 'inline' | 'details';
}

const buttonClasses = {
  overlay:
    'size-[38px] justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)] hover:bg-[#f8fafc]',
  inline:
    'size-[38px] justify-center rounded-full border border-gray-300 bg-white hover:bg-[#f8fafc]',
  details:
    'h-[52px] w-full justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 text-base text-[#434343] hover:bg-[#f8fafc]',
};

// Figma bookmark (2358:11656): a 38px white circle with an 18px bookmark icon.
// The failure message is announced politely right next to the button. The details
// variant shows its name as visible text instead of an aria-label.
export function ScholarshipBookmark({ card, variant }: ScholarshipBookmarkProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const tDetails = useTranslations('StudentScholarshipDetails');
  const labelled = variant === 'details';
  const title = useCardTitle(card);
  const { pending, failed, toggle } = useScholarshipBookmark(card.id, card.isSaved);

  return (
    <div className={labelled ? 'flex flex-col gap-1' : 'flex flex-col items-end gap-1'}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={card.isSaved}
        aria-busy={pending}
        aria-label={
          labelled
            ? undefined
            : card.isSaved
              ? t('bookmark.removeFor', { title })
              : t('bookmark.saveFor', { title })
        }
        className={`flex shrink-0 items-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${buttonClasses[variant]}`}
      >
        {pending ? (
          <Loader2 aria-hidden className="size-[18px] animate-spin text-orange-500" />
        ) : (
          <Bookmark
            aria-hidden
            className={`size-[18px] ${card.isSaved ? 'fill-current text-orange-500' : 'text-[#274383]'}`}
          />
        )}
        {labelled ? (
          <span>{card.isSaved ? tDetails('bookmark.remove') : tDetails('bookmark.save')}</span>
        ) : null}
      </button>
      <p
        role="status"
        aria-live="polite"
        className={
          failed && labelled
            ? 'text-center text-xs leading-5 text-[var(--color-text-error)]'
            : failed
              ? 'max-w-48 rounded-lg bg-white px-2 py-1 text-[10px] leading-4 text-[var(--color-text-error)] shadow-[0_2px_8px_rgba(15,23,42,0.12)]'
              : 'sr-only'
        }
      >
        {failed ? t('bookmark.error') : ''}
      </p>
    </div>
  );
}
