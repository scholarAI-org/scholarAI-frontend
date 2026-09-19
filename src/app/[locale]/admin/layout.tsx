import type { ReactNode } from 'react';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { AdminShell } from '@/features/admin/components/AdminShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminShell>{children}</AdminShell>
    </RoleGuard>
  );
}
