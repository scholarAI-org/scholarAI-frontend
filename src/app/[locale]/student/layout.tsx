import type { ReactNode } from 'react';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { StudentShell } from '@/features/student/layout/StudentShell';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['student']}>
      <StudentShell>{children}</StudentShell>
    </RoleGuard>
  );
}
