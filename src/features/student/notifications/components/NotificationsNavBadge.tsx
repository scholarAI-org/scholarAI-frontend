'use client';

import { useTranslations } from 'next-intl';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { formatBadge } from '../lib/badge';

// The orange pill on the sidebar's Notifications item (Figma 2979:7515): nothing for no count or
// 0, the number from 1 to 99, "99+" above. It sits at the end of the item's row, and its hidden
// text puts the count in the link's accessible name ("Notifications 3 unread").
export function NotificationsNavBadge() {
  const t = useTranslations('StudentNotifications');
  const { count } = useUnreadCount({ notificationsEnabled: true });
  const label = formatBadge(count);
  if (!label) return null;

  return (
    <span
      data-testid="notifications-badge"
      className="ms-auto inline-flex min-w-[18px] shrink-0 items-center justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] leading-[13px] font-black text-white"
    >
      <span aria-hidden>{label}</span>
      <span className="sr-only">{t('badge.short', { count: count ?? 0 })}</span>
    </span>
  );
}
