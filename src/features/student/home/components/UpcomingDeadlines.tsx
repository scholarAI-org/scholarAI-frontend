'use client';

import { CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buttonStyles } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { UPCOMING_WINDOW_DAYS } from '../constants';
import type { UpcomingDeadline } from '../lib/derive-home-summary';
import { DeadlineRow } from './DeadlineRow';
import { HomeSectionCard } from './HomeSectionCard';
import { SectionEmpty } from './SectionEmpty';
import { SectionError } from './SectionError';
import { Skeleton } from './Skeleton';

export type DeadlinesView =
  | { state: 'loading' }
  | { state: 'error'; onRetry: () => void }
  | { state: 'empty' }
  | { state: 'ready'; items: UpcomingDeadline[] };

interface UpcomingDeadlinesProps {
  view: DeadlinesView;
  detailsEnabled: boolean;
}

export function UpcomingDeadlines({ view, detailsEnabled }: UpcomingDeadlinesProps) {
  const t = useTranslations('StudentHome');
  return (
    <HomeSectionCard
      title={t('deadlines.title')}
      icon={CalendarDays}
      chipClassName="bg-[#eef2ff] text-[#6366f1]"
    >
      {view.state === 'loading' ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} kind="deadline" className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : view.state === 'error' ? (
        <SectionError message={t('deadlines.error')} onRetry={view.onRetry} />
      ) : view.state === 'empty' ? (
        <SectionEmpty
          title={t('deadlines.empty.title', { days: UPCOMING_WINDOW_DAYS })}
          action={
            <Link
              href="/student/scholarships"
              className={buttonStyles({
                variant: 'secondary',
                size: 'sm',
                className: 'rounded-full',
              })}
            >
              {t('deadlines.empty.action')}
            </Link>
          }
        />
      ) : (
        <ol className="flex flex-col gap-2">
          {view.items.map((item) => (
            <DeadlineRow key={item.id} item={item} detailsEnabled={detailsEnabled} />
          ))}
        </ol>
      )}
    </HomeSectionCard>
  );
}
