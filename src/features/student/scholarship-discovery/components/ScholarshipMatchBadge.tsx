'use client';

import { useTranslations } from 'next-intl';
import { getMatchBadgeDisplay } from '../lib/match-badge';
import type { ScholarshipMatchInfo } from '../types';

// Future seam (T033): renders only authoritative match data, which Feature 005
// never supplies, so today it always renders nothing.
export function ScholarshipMatchBadge({ match }: { match?: ScholarshipMatchInfo | null }) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const display = getMatchBadgeDisplay(match);
  if (!display) return null;
  const text = [
    display.level ? t(`card.matchLevel.${display.level}`) : null,
    display.score !== undefined ? t('card.matchScore', { score: display.score }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-[rgba(139,92,246,0.1)] px-2 text-xs font-bold text-[#8b5cf6]">
      {text}
    </span>
  );
}
