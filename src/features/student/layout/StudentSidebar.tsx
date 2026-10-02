'use client';

import { GraduationCap, LogOut, Search, UserRound, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useLogout } from '@/features/auth/hooks/useLogout';
import {
  getVisibleStudentNavigation,
  isStudentNavigationItemActive,
  studentNavigation,
} from './student-navigation';
import { getStudentDisplayName, getStudentInitial } from './student-identity';
import type { StudentNavigationItemId } from './types';

const navigationIcons: Record<StudentNavigationItemId, LucideIcon> = {
  profile: UserRound,
  scholarships: Search,
};

const variantClasses = {
  desktop:
    'rounded-3xl border border-[#e2e8f0] bg-white px-5 py-6 lg:min-h-[733px] lg:rounded-none lg:border-y-0 lg:border-e',
  drawer: 'bg-white px-5 pb-6',
};

interface StudentSidebarProps {
  variant?: keyof typeof variantClasses;
  onNavigate?: () => void;
}

export function StudentSidebar({ variant = 'desktop', onNavigate }: StudentSidebarProps) {
  const t = useTranslations('StudentLayout');
  const pathname = usePathname();
  const { user } = useAuth();
  const { mutate: logout, isPending } = useLogout();
  const name = getStudentDisplayName(user, t('identity.fallbackName'));

  return (
    <div className={variantClasses[variant]}>
      <div className="mx-auto max-w-[196px]">
        <div className="flex h-[108px] items-start justify-start gap-2 pt-2">
          <Image
            src="/images/logo-icon.png"
            alt={t('brand.name')}
            width={50}
            height={42}
            className="h-[42px] w-[50px] shrink-0 rounded-full object-cover"
            priority
          />
          <div className="text-start">
            <p className="text-[17px] font-bold leading-[1.5] text-[#274383]">
              <bdi>{t('brand.name')}</bdi>
            </p>
            <p className="text-[10px] leading-[1.2] text-[#f97316]">{t('brand.tagline')}</p>
          </div>
        </div>

        <div className="flex h-[65px] w-[187px] items-center justify-start gap-3 rounded-2xl bg-[#f8fafc] px-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#274383] text-[15px] font-extrabold text-white"
          >
            {getStudentInitial(name)}
          </span>
          <div className="min-w-0 text-start">
            <p className="truncate text-[15px] font-medium leading-[1.25] text-[#274383]">
              <bdi>{name}</bdi>
            </p>
            <p className="mt-2 flex items-center justify-start gap-1 text-[10px] leading-none text-[#f97316]">
              <GraduationCap aria-hidden className="h-3 w-3" />
              <span className="truncate">{t('identity.role')}</span>
            </p>
          </div>
        </div>

        <nav aria-label={t('navigationLabel')} className="mt-6 w-[188px]">
          <ul className="space-y-2">
            {getVisibleStudentNavigation(studentNavigation).map((item) => {
              const Icon = navigationIcons[item.id];
              const active = isStudentNavigationItemActive(item, pathname);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'flex items-center justify-start gap-4 rounded-full px-4 text-sm transition-colors',
                      active
                        ? 'h-[42px] border border-[#f97316] bg-[#f8fafc] font-bold text-[#f97316]'
                        : 'h-[38px] text-[rgba(30,27,51,0.7)] hover:bg-[#f8fafc]',
                    ].join(' ')}
                  >
                    <Icon aria-hidden className="h-5 w-5 shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="mt-10 border-t border-[#f1f5f9] pt-5">
        <button
          type="button"
          onClick={() => logout()}
          disabled={isPending}
          className="mx-auto flex h-[42px] w-full max-w-[196px] items-center justify-center gap-2 rounded-full px-3 text-sm text-[#b5b5b5] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isPending ? t('logoutPending') : t('logout')}</span>
          <LogOut aria-hidden className="h-5 w-5 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
