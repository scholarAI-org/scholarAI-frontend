import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { HomeNotificationBell } from '@/features/student/home/components/HomeNotificationBell';
import { resolveHomeMockSections } from '@/features/student/home/config/resolve-mock-sections';
import { StudentShell } from '@/features/student/layout/StudentShell';
import { featureFlags } from '@/lib/feature-flags';

export default function StudentLayout({ children }: { children: ReactNode }) {
  const homeEnabled = featureFlags.studentHomeEnabled;
  const shellProps = {
    savedEnabled: featureFlags.savedScholarshipsEnabled,
    homeEnabled,
    // The bell renders nothing unless a notifications source exists; the shell itself
    // stays generic and only receives it as a node.
    headerActions: homeEnabled ? (
      <HomeNotificationBell mockSections={resolveHomeMockSections(process.env)} />
    ) : undefined,
  };

  return (
    <AuthProvider>
      <RoleGuard allowedRoles={['student']}>
        <StudentShell {...shellProps}>{children}</StudentShell>
      </RoleGuard>
    </AuthProvider>
  );
}
