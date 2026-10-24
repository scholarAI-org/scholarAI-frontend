'use client';

import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NotificationBellProps {
  // Null while the count is loading or unavailable: no dot is shown.
  unreadCount: number | null;
}

// Figma 2353:5372: a 32px circle with a bell and an orange dot when there is something
// unread. No notifications page exists yet, so this is an indicator, not a control.
export function NotificationBell({ unreadCount }: NotificationBellProps) {
  const t = useTranslations('StudentHome');
  const count = unreadCount ?? 0;
  return (
    <span
      role="img"
      aria-label={t('bell.label', { count })}
      className="relative flex size-8 shrink-0 items-center justify-center rounded-full border-[0.8px] border-gray-300 bg-white text-[#274383]"
    >
      <Bell aria-hidden className="size-5" />
      {count > 0 ? (
        <span
          aria-hidden
          data-bell-dot
          className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-orange-500"
        />
      ) : null}
    </span>
  );
}
