'use client';

import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ACTIVITY_LIST_LIMIT } from '../constants';
import type { ActivityItem } from '../schemas/activity.schema';
import { ActivityRow } from './ActivityRow';
import { DemoDataBadge } from './DemoDataBadge';
import { HomeSectionCard } from './HomeSectionCard';
import { SectionEmpty } from './SectionEmpty';
import { SectionError } from './SectionError';
import { Skeleton } from './Skeleton';

export type ActivityView =
  | { state: 'loading' }
  | { state: 'error'; onRetry: () => void }
  | { state: 'empty' }
  | { state: 'ready'; items: ActivityItem[] };

interface RecentActivityProps {
  view: ActivityView;
  now: Date | null;
  // True while the section runs on demo data (local development only).
  demo: boolean;
}

// Rendered only while an activity source exists; without one the page omits it.
export function RecentActivity({ view, now, demo }: RecentActivityProps) {
  const t = useTranslations('StudentHome');
  const items = view.state === 'ready' ? view.items.slice(0, ACTIVITY_LIST_LIMIT) : [];

  return (
    <HomeSectionCard
      title={t('activity.title')}
      icon={Activity}
      chipClassName="bg-green-50 text-green-600"
      badge={demo ? <DemoDataBadge /> : null}
    >
      {view.state === 'loading' ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: ACTIVITY_LIST_LIMIT }, (_, index) => (
            <Skeleton key={index} kind="activity" className="h-12 w-full" />
          ))}
        </div>
      ) : view.state === 'error' ? (
        <SectionError message={t('activity.error')} onRetry={view.onRetry} />
      ) : view.state === 'empty' || items.length === 0 ? (
        <SectionEmpty title={t('activity.empty')} />
      ) : (
        <ol className="flex flex-col divide-y divide-gray-200">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} now={now} />
          ))}
        </ol>
      )}
    </HomeSectionCard>
  );
}
