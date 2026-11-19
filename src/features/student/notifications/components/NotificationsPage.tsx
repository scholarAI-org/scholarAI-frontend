'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMarkAllRead } from '../hooks/useMarkAllRead';
import { useMarkRead } from '../hooks/useMarkRead';
import { useMinuteClock } from '../hooks/useMinuteClock';
import { useNotificationsList } from '../hooks/useNotificationsList';
import { useSessionRecheck } from '../hooks/useSessionRecheck';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { hasUnread } from '../lib/cache-updates';
import { MarkAllReadButton } from './MarkAllReadButton';
import { NotificationCard } from './NotificationCard';
import { NotificationsEmpty, NotificationsError, NotificationsLoading } from './NotificationStates';

interface NotificationsPageProps {
  // SCHOLARSHIP_DETAILS_ENABLED, read in the route's Server Component.
  detailsEnabled?: boolean;
}

// What the last mark attempt left to say. It stays until the next attempt (FR-037).
type Feedback = null | 'markFailed' | 'allFailed' | 'allDone';

// The body of /[locale]/student/notifications. The student header already carries the title
// and description ("Notifications center"), so the page starts with the list.
export function NotificationsPage({ detailsEnabled = false }: NotificationsPageProps) {
  const t = useTranslations('StudentNotifications');
  const now = useMinuteClock();
  const list = useNotificationsList();
  // The page only exists while the flag is on, so the count is the real one.
  const { count } = useUnreadCount({ notificationsEnabled: true });
  const [feedback, setFeedback] = useState<Feedback>(null);
  const markRead = useMarkRead({ onFailed: () => setFeedback('markFailed') });
  const { markAll, isPending: markingAll } = useMarkAllRead({
    onFailed: () => setFeedback('allFailed'),
    onDone: () => setFeedback('allDone'),
  });
  useSessionRecheck(list.error);

  // `now` is null until mount (the server clock is not the student's).
  if (list.isPending || now === null) return <NotificationsLoading />;
  if (list.isError && !list.data) {
    return <NotificationsError error={list.error} onRetry={() => void list.refetch()} />;
  }
  if (list.items.length === 0 && !list.hasNextPage) return <NotificationsEmpty />;

  // Offered while a loaded card is unread or the count says so, whether or not the count loaded.
  const showMarkAll = hasUnread(list.data) || (count ?? 0) > 0;

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-6">
      {showMarkAll ? (
        <div className="flex justify-end">
          <MarkAllReadButton
            disabled={markingAll}
            onClick={() => {
              setFeedback(null);
              markAll();
            }}
          />
        </div>
      ) : null}

      <div role="status" aria-live="polite">
        {feedback === 'allDone' ? (
          <p className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#434343]">
            {t('markAll.done')}
          </p>
        ) : null}
      </div>
      {feedback === 'markFailed' || feedback === 'allFailed' ? (
        <p
          role="alert"
          data-testid="notifications-mark-error"
          className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[var(--color-text-error)]"
        >
          {t(feedback === 'markFailed' ? 'markRead.failed' : 'markAll.failed')}
        </p>
      ) : null}

      <ol aria-label={t('page.listLabel')} className="flex min-w-0 flex-col gap-4">
        {list.items.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            now={now}
            detailsEnabled={detailsEnabled}
            onMarkRead={(id) => {
              setFeedback(null);
              markRead(id);
            }}
          />
        ))}
      </ol>
    </div>
  );
}
