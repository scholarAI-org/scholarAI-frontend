'use client';

import { Bookmark, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useScholarshipBookmark } from '../hooks/useScholarshipBookmark';
import type { ScholarshipCardModel } from '../types';
import { useCardTitle } from './ScholarshipCardParts';

interface ScholarshipBookmarkProps {
  card: ScholarshipCardModel;
  // overlay: the white circle on the grid image; inline: the list-row spot.
  variant: 'overlay' | 'inline';
}

// Figma bookmark (2358:11656): a 38px white circle with an 18px bookmark icon.
// The failure message is announced politely right next to the button.
export function ScholarshipBookmark({ card, variant }: ScholarshipBookmarkProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const title = useCardTitle(card);
  const { pending, failed, toggle } = useScholarshipBookmark(card.id, card.isSaved);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={card.isSaved}
        aria-busy={pending}
        aria-label={
          card.isSaved ? t('bookmark.removeFor', { title }) : t('bookmark.saveFor', { title })
        }
        className={`flex size-[38px] shrink-0 items-center justify-center rounded-full bg-white transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${variant === 'inline' ? 'border border-gray-300' : 'shadow-[0_2px_8px_rgba(15,23,42,0.12)]'}`}
      >
        {pending ? (
          <Loader2 aria-hidden className="size-[18px] animate-spin text-orange-500" />
        ) : (
          <Bookmark
            aria-hidden
            className={`size-[18px] ${card.isSaved ? 'fill-current text-orange-500' : 'text-[#274383]'}`}
          />
        )}
      </button>
      <p
        role="status"
        aria-live="polite"
        className={
          failed
            ? 'max-w-48 rounded-lg bg-white px-2 py-1 text-[10px] leading-4 text-[var(--color-text-error)] shadow-[0_2px_8px_rgba(15,23,42,0.12)]'
            : 'sr-only'
        }
      >
        {failed ? t('bookmark.error') : ''}
      </p>
    </div>
  );
}
