import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { StudentShell } from '@/features/student/layout/StudentShell';
import { featureFlags } from '@/lib/feature-flags';

export default function StudentLayout({ children }: { children: ReactNode }) {
  const savedEnabled = featureFlags.savedScholarshipsEnabled;

  return (
    <AuthProvider>
      <RoleGuard allowedRoles={['student']}>
        <StudentShell savedEnabled={savedEnabled}>{children}</StudentShell>
      </RoleGuard>
    </AuthProvider>
  );
}
