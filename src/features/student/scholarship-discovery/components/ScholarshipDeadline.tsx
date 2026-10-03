'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatCalendarDate, getDeadlineStatus, toIsoCalendarDate } from '../lib/deadlines';
import type { ScholarshipCardModel } from '../types';

// Deadline line for Grid and List (T041); `now` comes from the results list so
// every card on a page uses the same "today".
export function ScholarshipDeadline({ card, now }: { card: ScholarshipCardModel; now: Date }) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const locale = useLocale();
  const status = getDeadlineStatus(card.deadline, card.noDeadline, now);

  if (status.kind === 'none') return <span>{t('card.noDeadline')}</span>;
  if (status.kind === 'unspecified') return <span>{t('card.deadlineNotSpecified')}</span>;

  const remaining =
    status.kind === 'past'
      ? t('card.deadlinePassed')
      : status.kind === 'today'
        ? t('card.deadlineToday')
        : t('card.daysLeft', { count: status.daysLeft });
  return (
    <span>
      <time dateTime={toIsoCalendarDate(status.date)}>
        {t('card.deadline', { date: formatCalendarDate(status.date, locale) })}
      </time>
      {' · '}
      {remaining}
    </span>
  );
}
