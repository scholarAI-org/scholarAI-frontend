'use client';

import { usePathname } from '@/i18n/navigation';
// Allow-listed import from the Home feature: the bell is Home's own component, extended to be a
// link, so there is one bell design (not a second one).
import { NotificationBell } from '@/features/student/home/components/NotificationBell';
import { useUnreadCount } from '../hooks/useUnreadCount';

export const NOTIFICATIONS_HREF = '/student/notifications';

interface NotificationsBellProps {
  // `compact` is the 44px bell of the top bar below lg.
  size?: 'default' | 'compact';
}

// The header bell: an orange dot while something is unread (never while the count is unknown or
// stopped), a link to the notification center, aria-current on the page itself.
export function NotificationsBell({ size = 'default' }: NotificationsBellProps) {
  const { count } = useUnreadCount({ notificationsEnabled: true });
  const pathname = usePathname();
  const current = pathname === NOTIFICATIONS_HREF || pathname.startsWith(`${NOTIFICATIONS_HREF}/`);
  return (
    <NotificationBell unreadCount={count} href={NOTIFICATIONS_HREF} size={size} current={current} />
  );
}
