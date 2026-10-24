'use client';

import { CalendarClock, Heart, RefreshCw, Sparkles, type LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ActivityItem, ActivityType } from '../schemas/activity.schema';
import { formatRelativeTime } from '../lib/relative-time';
import { Skeleton } from './Skeleton';

const STYLES: Record<ActivityType, { icon: LucideIcon; chip: string }> = {
  new_recommendation: { icon: Sparkles, chip: 'bg-orange-50 text-orange-500' },
  deadline_reminder: { icon: CalendarClock, chip: 'bg-amber-50 text-amber-600' },
  scholarship_saved: { icon: Heart, chip: 'bg-red-50 text-red-500' },
  application_status_changed: { icon: RefreshCw, chip: 'bg-blue-50 text-blue-500' },
};

interface ActivityRowProps {
  item: ActivityItem;
  // Null until mount; the relative time depends on the student's clock.
  now: Date | null;
}

// Figma 2358:7698: icon chip at the start, sentence and relative time beside it. The
// sentence is built here from the event type and data; server text is never shown.
export function ActivityRow({ item, now }: ActivityRowProps) {
  const t = useTranslations('StudentHome');
  const locale = useLocale();
  const { icon: Icon, chip } = STYLES[item.type];

  const { scholarship, data } = item;
  const title = (locale === 'ar' ? scholarship.titleAr : scholarship.titleEn) || scholarship.title;
  const sentence = t(`activity.types.${item.type}`, {
    title,
    days: data.daysLeft ?? 0,
    status: data.newStatus ? t(`activity.status.${data.newStatus}`) : '',
  });

  return (
    <li className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span
        aria-hidden
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${chip}`}
      >
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="line-clamp-3 min-w-0 text-sm text-black">
          <bdi>{sentence}</bdi>
        </p>
        <p className="text-xs text-[#b5b5b5]">
          {now ? (
            <time dateTime={item.occurredAt}>
              {formatRelativeTime(item.occurredAt, now, locale, t('activity.justNow'))}
            </time>
          ) : (
            <Skeleton kind="time" className="h-3 w-20" />
          )}
        </p>
      </div>
    </li>
  );
}
