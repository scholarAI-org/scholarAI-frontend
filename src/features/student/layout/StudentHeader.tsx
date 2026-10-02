'use client';

import type { RefObject } from 'react';
import { Globe2, Menu } from 'lucide-react';
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

          <div className="flex h-10 min-w-0 items-center gap-2 rounded-full border border-[#e2e8f0] px-2">
            <span
              aria-hidden
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#f97316] text-[10px] leading-none text-white"
            >
              {getStudentInitial(name)}
            </span>
            <span className="truncate text-sm leading-5 text-black">
              <bdi>{name}</bdi>
            </span>
          </div>

          <button
            type="button"
            onClick={switchLanguage}
            aria-label={t('languageSwitch.label')}
            lang={nextLocale}
            className="flex h-8 shrink-0 items-center gap-2 rounded-full bg-[#f8fafc] pe-3 text-xs text-black"
          >
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#274383] text-white"
            >
              <Globe2 className="h-4 w-4" />
            </span>
            <span aria-hidden>{t('languageSwitch.short')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
