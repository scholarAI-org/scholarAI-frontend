'use client';

import { useId } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { toScholarshipCard } from '@/features/student/scholarship-discovery/adapters/scholarship';
import { ScholarshipBookmark } from '@/features/student/scholarship-discovery/components/ScholarshipBookmark';
import { ScholarshipDeadline } from '@/features/student/scholarship-discovery/components/ScholarshipDeadline';
import { ScholarshipGridCard } from '@/features/student/scholarship-discovery/components/ScholarshipGridCard';
import type { ScholarshipDiscoveryCard } from '@/features/student/scholarship-discovery/types';
import { RecommendationsLocked } from './RecommendationsLocked';
import { SectionError } from './SectionError';
import { Skeleton } from './Skeleton';

export type RecommendationsView =
  | { state: 'loading' }
  | { state: 'locked' }
  | { state: 'error'; onRetry: () => void }
  | { state: 'empty' }
  | { state: 'ready'; items: ScholarshipDiscoveryCard[] };

interface LatestRecommendationsProps {
  view: RecommendationsView;
  detailsEnabled: boolean;
  // Null until mount; deadline lines need the student's local day.
  today: Date | null;
}

// Figma 2353:5470. Locked below 70% completion. Unlocked there is no design, so it
// reuses the discovery scholarship card with the newest published scholarships. They
// are not personalized, so the heading says "Latest scholarships" and no match score
// is shown.
export function LatestRecommendations({ view, detailsEnabled, today }: LatestRecommendationsProps) {
  const t = useTranslations('StudentHome');
  const locale = useLocale();
  const headingId = useId();

  const showsLatest = view.state === 'ready' || view.state === 'empty' || view.state === 'error';
  // One heading in every state (no flip while loading or when locked): the section only
  // ever shows the newest published scholarships.
  const heading = t('recommendations.latestTitle');

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="min-w-0 text-lg font-bold text-[#274383]">
          {heading}
        </h2>
        {showsLatest ? (
          <Link
            href="/student/scholarships"
            className="inline-flex shrink-0 items-center gap-1 text-sm text-orange-500 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            {t('recommendations.viewAll')}
            {/* :dir(rtl) follows the real direction; Tailwind's rtl variant also matches the always-rtl root <html>. */}
            <ChevronRight aria-hidden className="size-4 [&:dir(rtl)]:rotate-180" />
          </Link>
        ) : null}
      </div>

      <div className="@container min-w-0 rounded-2xl border border-gray-300 bg-white p-4 sm:p-6">
        {view.state === 'locked' ? (
          <RecommendationsLocked />
        ) : view.state === 'loading' ? (
          <div className="grid gap-4 @md:grid-cols-2 @3xl:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} kind="recommendation" className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        ) : view.state === 'error' ? (
          <SectionError message={t('recommendations.error')} onRetry={view.onRetry} />
        ) : view.state === 'empty' ? (
          <p className="py-6 text-center text-sm text-[#b5b5b5]">{t('recommendations.empty')}</p>
        ) : (
          <ul className="grid gap-4 @md:grid-cols-2 @3xl:grid-cols-3">
            {view.items.map((item) => {
              // Never a match score: these are the newest scholarships, not recommendations.
              const card = { ...toScholarshipCard(item, locale), match: undefined };
              return (
                <li key={card.id} className="min-w-0">
                  <ScholarshipGridCard
                    card={card}
                    bookmarkSlot={<ScholarshipBookmark card={card} variant="overlay" />}
                    footer={today ? <ScholarshipDeadline card={card} now={today} /> : null}
                    detailsEnabled={detailsEnabled}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
