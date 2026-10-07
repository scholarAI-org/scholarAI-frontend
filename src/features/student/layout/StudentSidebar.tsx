'use client';

import { Bookmark, GraduationCap, LogOut, Search, UserRound, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useLogout } from '@/features/auth/hooks/useLogout';
import {
  getStudentNavigationSections,
  isStudentNavigationItemActive,
  studentNavigation,
} from './student-navigation';
import { getStudentDisplayName, getStudentInitial } from './student-identity';
import type { StudentNavigationItem, StudentNavigationItemId } from './types';

const navigationIcons: Record<StudentNavigationItemId, LucideIcon> = {
  profile: UserRound,
  scholarships: Search,
  saved: Bookmark,
};

// Figma sidebar (2979:9136): brand, user pill and grouped navigation at the top,
// logout pinned to the bottom.
const variantClasses = {
  desktop: 'flex h-full min-h-0 flex-col border-e border-gray-300 bg-white pt-4',
  drawer: 'flex min-h-0 flex-1 flex-col bg-white',
};

interface StudentSidebarProps {
  variant?: keyof typeof variantClasses;
  onNavigate?: () => void;
  items?: readonly StudentNavigationItem[];
}

export function StudentSidebar({
  variant = 'desktop',
  onNavigate,
  items = studentNavigation,
}: StudentSidebarProps) {
  const t = useTranslations('StudentLayout');
  const pathname = usePathname();
  const sectionId = useId();
  const { user } = useAuth();
  const { mutate: logout, isPending } = useLogout();
  const name = getStudentDisplayName(user, t('identity.fallbackName'));

  return (
    <div className={variantClasses[variant]}>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-6 overflow-y-auto px-4 pb-4">
        {/* Figma shows a centred crop of the brand image in a 65x79 box. */}
        <div className="grid h-[79px] w-[65px] shrink-0 place-items-center overflow-hidden">
          <Image
            src="/images/admin/brand.png"
            alt={t('brand.name')}
            width={108}
            height={108}
            className="size-[108px] max-w-none"
            priority
          />
        </div>

        <div className="flex w-full flex-col gap-4">
          <div className="flex h-[58px] items-center gap-2.5 rounded-full bg-[#f8fafc] px-3 py-2.5">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#274383] text-[15px] font-extrabold text-white"
            >
              {getStudentInitial(name)}
            </span>
            <div className="flex min-w-0 flex-col gap-1 text-start">
              <p className="truncate text-sm font-medium leading-[1.3] text-[#274383]">
                <bdi>{name}</bdi>
              </p>
              <p className="flex items-center gap-1 text-[10px] leading-none text-orange-500">
                <GraduationCap aria-hidden className="size-3" />
                <span className="truncate">{t('identity.role')}</span>
              </p>
            </div>
          </div>

          <nav aria-label={t('navigationLabel')} className="flex flex-col gap-6">
            {getStudentNavigationSections(items).map((section) => (
              <section key={section.id} aria-labelledby={`${sectionId}-${section.id}`}>
                <h2
                  id={`${sectionId}-${section.id}`}
                  className="px-[13px] text-[10px] leading-none text-[#b5b5b5]"
                >
                  {t(section.labelKey)}
                </h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {section.items.map((item) => {
                    const Icon = navigationIcons[item.id];
                    const active = isStudentNavigationItemActive(item, pathname);
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          aria-current={active ? 'page' : undefined}
                          className={[
                            'flex items-center justify-start gap-2 rounded-full px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500',
                            active
                              ? 'h-[52px] border-s-4 border-orange-500 bg-[#f8fafc] font-bold text-orange-500'
                              : 'h-[38px] text-text-label hover:bg-[#f8fafc]',
                          ].join(' ')}
                        >
                          <Icon aria-hidden className="size-5 shrink-0" />
                          <span>{t(item.labelKey)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#f1f5f9] px-3 pt-3 pb-4">
        <button
          type="button"
          onClick={() => logout()}
          disabled={isPending}
          className="flex w-full items-center justify-start gap-2 rounded-full px-3 py-2.5 text-sm text-text-label transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut aria-hidden className="size-5 shrink-0 rtl:rotate-180" />
          <span>{isPending ? t('logoutPending') : t('logout')}</span>
        </button>
      </div>
    </div>
  );
}
