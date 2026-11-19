'use client';

import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface NotificationBellProps {
  // Null while the count is loading or unavailable: no dot is shown.
  unreadCount: number | null;
  // Feature 011: when the notification center exists the bell is a link to it. Without an
  // href it stays an indicator only, as before.
  href?: string;
  // `compact` is the 44px touch target of the top bar below lg (it shrinks to 32px from sm).
  size?: 'default' | 'compact';
  // True on the notification center itself.
  current?: boolean;
}

const CIRCLE =
  'relative flex shrink-0 items-center justify-center rounded-full border-[0.8px] border-gray-300 bg-white text-[#274383]';
const SIZES = {
  default: 'size-8',
  compact: 'size-11 sm:size-8',
};
const DOT_POSITIONS = {
  default: 'end-1.5 top-1.5',
  compact: 'end-3 top-3 sm:end-1.5 sm:top-1.5',
};

// Figma 2353:5372: a 32px circle with a bell and an orange dot when there is something
// unread. Without an href no notifications page exists, so it is an indicator, not a control.
export function NotificationBell({
  unreadCount,
  href,
  size = 'default',
  current = false,
}: NotificationBellProps) {
  const t = useTranslations('StudentHome');
  const count = unreadCount ?? 0;
  const label = t('bell.label', { count });
  const content = (
    <>
      <Bell aria-hidden className="size-5" />
      {count > 0 ? (
        <span
          aria-hidden
          data-bell-dot
          className={`absolute size-1.5 rounded-full bg-orange-500 ${DOT_POSITIONS[size]}`}
        />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        aria-current={current ? 'page' : undefined}
        data-notifications-bell
        className={`${CIRCLE} ${SIZES[size]} transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500`}
      >
        {content}
      </Link>
    );
  }

  return (
    <span role="img" aria-label={label} className={`${CIRCLE} ${SIZES[size]}`}>
      {content}
    </span>
  );
}
