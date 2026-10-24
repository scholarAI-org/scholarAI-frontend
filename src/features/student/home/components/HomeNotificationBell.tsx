'use client';

import type { HomeSectionId } from '../config/home-sections';
import { useHomeSourceQuery, useHomeSources } from '../hooks/useHomeSources';
import { NotificationBell } from './NotificationBell';

// Injected into the student header by the route layout. It exists only while a
// notifications source does (real, or demo in local development) and reads the same
// query as the stat card, so both always show the same number.
export function HomeNotificationBell({ mockSections }: { mockSections: readonly HomeSectionId[] }) {
  const sources = useHomeSources(mockSections);
  const query = useHomeSourceQuery('notifications', sources.notifications);
  if (sources.notifications.kind === 'unavailable') return null;
  return <NotificationBell unreadCount={query.data?.unreadCount ?? null} />;
}
