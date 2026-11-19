'use client';

import { useTranslations } from 'next-intl';
import { useMinuteClock } from '../hooks/useMinuteClock';
import { useNotificationsList } from '../hooks/useNotificationsList';
import { useSessionRecheck } from '../hooks/useSessionRecheck';
import { NotificationCard } from './NotificationCard';
import { NotificationsEmpty, NotificationsError, NotificationsLoading } from './NotificationStates';

interface NotificationsPageProps {
  // SCHOLARSHIP_DETAILS_ENABLED, read in the route's Server Component.
  detailsEnabled?: boolean;
}

// The body of /[locale]/student/notifications. The student header already carries the title
// and description ("Notifications center"), so the page starts with the list.
export function NotificationsPage({ detailsEnabled = false }: NotificationsPageProps) {
  const t = useTranslations('StudentNotifications');
  const now = useMinuteClock();
  const list = useNotificationsList();
  useSessionRecheck(list.error);

  // `now` is null until mount (the server clock is not the student's).
  if (list.isPending || now === null) return <NotificationsLoading />;
  if (list.isError && !list.data) {
    return <NotificationsError error={list.error} onRetry={() => void list.refetch()} />;
  }
  if (list.items.length === 0 && !list.hasNextPage) return <NotificationsEmpty />;

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-6">
      <ol aria-label={t('page.listLabel')} className="flex min-w-0 flex-col gap-4">
        {list.items.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            now={now}
            detailsEnabled={detailsEnabled}
          />
        ))}
      </ol>
    </div>
  );
}
