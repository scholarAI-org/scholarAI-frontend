import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { AdminShell } from '@/features/admin/components/AdminShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RoleGuard allowedRoles={['admin']}>
        <AdminShell>{children}</AdminShell>
      </RoleGuard>
    </AuthProvider>
  );
}
