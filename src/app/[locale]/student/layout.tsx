import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { HomeNotificationBell } from '@/features/student/home/components/HomeNotificationBell';
import { resolveHomeMockSections } from '@/features/student/home/config/resolve-mock-sections';
import { StudentShell } from '@/features/student/layout/StudentShell';
import {
  NotificationsBell,
  NotificationsCountDriver,
  NotificationsNavBadge,
} from '@/features/student/notifications';
import { featureFlags } from '@/lib/feature-flags';

export default function StudentLayout({ children }: { children: ReactNode }) {
  const homeEnabled = featureFlags.studentHomeEnabled;
  const notificationsEnabled = featureFlags.notificationsEnabled;
  const shellProps = {
    savedEnabled: featureFlags.savedScholarshipsEnabled,
    homeEnabled,
    trackingEnabled: featureFlags.trackingEnabled,
    // Settings has no navigation item: the flag only decides whether the account menu
    // links to it.
    settingsEnabled: featureFlags.settingsEnabled,
    // Feature 011: the Notifications item, its count pill and the bell are nodes the shell is
    // handed; it never imports the feature. Nothing is passed while the flag is off.
    notificationsEnabled,
    navigationBadges: notificationsEnabled
      ? { notifications: <NotificationsNavBadge /> }
      : undefined,
    // The bell renders nothing unless a notifications source exists; the shell itself
    // stays generic and only receives it as a node. With the flag on it is the link to the
    // center; with it off Home keeps its own indicator (and its local demo source).
    headerActions: notificationsEnabled ? (
      <NotificationsBell />
    ) : homeEnabled ? (
      <HomeNotificationBell mockSections={resolveHomeMockSections(process.env)} />
    ) : undefined,
  };

  return (
    <AuthProvider>
      <RoleGuard allowedRoles={['student']}>
        {/* The one poller of the unread count: it mounts only for a signed-in student. */}
        {notificationsEnabled ? <NotificationsCountDriver /> : null}
        <StudentShell {...shellProps}>{children}</StudentShell>
      </RoleGuard>
    </AuthProvider>
  );
}
