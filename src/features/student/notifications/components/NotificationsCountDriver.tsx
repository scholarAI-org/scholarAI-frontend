'use client';

import { useUnreadCountDriver } from '../hooks/useUnreadCountDriver';

// Renders nothing: it only mounts the one poller of the unread count. The route layout mounts it
// inside RoleGuard, and only while the notifications flag is on.
export function NotificationsCountDriver() {
  useUnreadCountDriver({ notificationsEnabled: true });
  return null;
}
