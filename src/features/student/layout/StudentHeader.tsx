'use client';

import type { RefObject } from 'react';
import { Menu } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { getStudentPageKey } from './student-navigation';
import { getStudentDisplayName, getStudentInitial } from './student-identity';

export const STUDENT_MOBILE_NAVIGATION_ID = 'student-mobile-navigation';

interface StudentHeaderProps {
  isNavigationOpen: boolean;
  onNavigationToggle: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}

export function StudentHeader({
  isNavigationOpen,
  onNavigationToggle,
  menuButtonRef,
}: StudentHeaderProps) {
  const t = useTranslations('StudentLayout');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const pageKey = getStudentPageKey(pathname);
  const name = getStudentDisplayName(user, t('identity.fallbackName'));
  const nextLocale = locale === 'ar' ? 'en' : 'ar';

  function switchLanguage() {
    router.replace(pathname + window.location.search + window.location.hash, {
      locale: nextLocale,
      scroll: false,
    });
  }

  return (
    <header className="border-b border-[#e2e8f0] bg-white lg:h-[108px]">
      <div className="flex h-full flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6 lg:py-6">
        <div className="order-2 text-start sm:order-1">
          {pageKey && (
            <>
              <h1 className="text-lg font-bold leading-[1.2] text-[#434343]">
                {t(`pages.${pageKey}.title`)}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#b5b5b5] sm:text-base">
                {t(`pages.${pageKey}.description`)}
              </p>
            </>
          )}
        </div>

        <div className="order-1 flex items-center justify-end gap-2 sm:order-2">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onNavigationToggle}
            aria-expanded={isNavigationOpen}
            aria-controls={STUDENT_MOBILE_NAVIGATION_ID}
            aria-label={isNavigationOpen ? t('closeNavigation') : t('openNavigation')}
            className="me-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#e2e8f0] text-[#274383] lg:hidden"
          >
            <Menu aria-hidden className="h-5 w-5" />
          </button>

          {/* Figma 2262:3341: one 32px white circle; Figma order puts it beside the title. */}
          <button
            type="button"
            onClick={switchLanguage}
            aria-label={t('languageSwitch.label')}
            lang={nextLocale}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border-[0.8px] border-gray-300 bg-white text-xs text-black transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            <span aria-hidden>{t('languageSwitch.short')}</span>
          </button>

          <div className="flex min-w-0 items-center gap-2 rounded-full border border-gray-300 p-2">
            <span
              aria-hidden
              className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] leading-none text-white"
            >
              {getStudentInitial(name)}
            </span>
            <span className="truncate text-sm leading-5 text-black">
              <bdi>{name}</bdi>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
