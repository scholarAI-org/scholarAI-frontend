import type { ReactNode } from 'react';
import { RoleGuard } from '@/features/auth/components/RoleGuard';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <RoleGuard allowedRoles={['student']}>{children}</RoleGuard>;
}
