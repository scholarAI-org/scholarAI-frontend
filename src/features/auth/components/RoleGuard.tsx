'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { useAuth } from '../providers/AuthProvider';
import { useRouter } from '@/i18n/navigation';

import type { UserRole } from '../types';

type RoleGuardProps = {
  children: ReactNode;
  allowedRoles: UserRole[];
};

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const redirectTargetRef = useRef<string | null>(null);

  const { user, isLoading, isUnauthenticated, error } = useAuth();

  const hasAllowedRole = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let redirectTarget: string | null = null;

    if (isUnauthenticated) {
      redirectTarget = '/login';
    } else if (user && !allowedRoles.includes(user.role)) {
      if (user.role === 'admin') {
        redirectTarget = '/admin/dashboard';
      } else {
        redirectTarget = '/student/profile';
      }
    }

    if (redirectTarget && redirectTargetRef.current !== redirectTarget) {
      redirectTargetRef.current = redirectTarget;
      router.replace(redirectTarget);
    }
  }, [user, isLoading, isUnauthenticated, allowedRoles, router]);

  if (isLoading) {
    return <div>جاري التحقق من الجلسة...</div>;
  }

  if (error && !isUnauthenticated) {
    return <div>حدث خطأ أثناء التحقق من الجلسة.</div>;
  }

  if (!user || !hasAllowedRole) {
    return null;
  }

  return children;
}
