'use client';

import type { ReactNode, RefObject } from 'react';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { getStudentCompactTitleKey, getStudentPageKey } from './student-navigation';
import { getStudentDisplayName, getStudentInitial } from './student-identity';
import { StudentUserMenu } from './StudentUserMenu';

export const STUDENT_MOBILE_NAVIGATION_ID = 'student-mobile-navigation';

interface StudentHeaderProps {
  isNavigationOpen: boolean;
  onNavigationToggle: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  // Extra controls before the language button (desktop). Nothing renders when empty.
  headerActions?: ReactNode;
}

export function StudentHeader({
  isNavigationOpen,
  onNavigationToggle,
  menuButtonRef,
  headerActions,
}: StudentHeaderProps) {
  const t = useTranslations('StudentLayout');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const pageKey = getStudentPageKey(pathname);
  const compactTitleKey = getStudentCompactTitleKey(pathname);
  const name = getStudentDisplayName(user, t('identity.fallbackName'));
  const nextLocale = locale === 'ar' ? 'en' : 'ar';

  function switchLanguage() {
    router.replace(pathname + window.location.search + window.location.hash, {
      locale: nextLocale,
      scroll: false,
    });
  }

  const initial = getStudentInitial(name);
  // Below sm the switch has to clear 44x44; from sm up it keeps the 32px circle the
  // existing header and the desktop design use.
  const renderLanguageButton = (sizeClass: string) => (
    <button
      type="button"
      onClick={switchLanguage}
      aria-label={t('languageSwitch.label')}
      lang={nextLocale}
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full border-[0.8px] border-gray-300 bg-white text-xs text-black transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500`}
    >
      <span aria-hidden>{t('languageSwitch.short')}</span>
    </button>
  );
  const languageButton = renderLanguageButton('size-8');

  return (
    <header>
      {/* Below lg: Figma mobile header (3606:11257) - menu and brand at the start,
          language and avatar at the end. */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-300 bg-white px-4 pt-2.5 pb-3 sm:px-6 lg:hidden">
        <div className="flex min-w-0 items-center gap-3.5">
          {/* Below sm the drawer is gone — the tab bar carries the destinations — so the
              menu button only exists from sm up, where the drawer still does. */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onNavigationToggle}
            aria-expanded={isNavigationOpen}
            aria-controls={STUDENT_MOBILE_NAVIGATION_ID}
            aria-label={isNavigationOpen ? t('closeNavigation') : t('openNavigation')}
            className="hidden size-10 items-center justify-center rounded-xl bg-[#f1f5f9] text-[#274383] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:flex"
          >
            <Menu aria-hidden className="size-5" />
          </button>
          <div className="grid h-10 w-[33px] shrink-0 place-items-center overflow-hidden">
            <Image
              src="/images/admin/brand.png"
              alt={t('brand.name')}
              width={55}
              height={55}
              className="size-[55px] max-w-none"
            />
          </div>
          {/* The compact bar names the page; the full heading still follows below it. */}
          {compactTitleKey && (
            <span className="min-w-0 truncate text-sm font-bold text-[#434343] sm:hidden">
              {t(compactTitleKey)}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {renderLanguageButton('size-11 sm:size-8')}
          <span
            role="img"
            aria-label={name}
            className="hidden size-[34px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-[15px] text-white sm:flex"
          >
            {initial}
          </span>
          <StudentUserMenu className="sm:hidden" />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 lg:h-[108px] lg:flex-row lg:items-center lg:justify-between lg:border-b lg:border-gray-300 lg:bg-white lg:py-6">
        <div className="text-start">
          {pageKey && (
            <>
              <h1 className="text-lg font-bold leading-[1.2] text-[#434343]">
                {t(`pages.${pageKey}.title`, { name })}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#b5b5b5] sm:text-base">
                {t(`pages.${pageKey}.description`)}
              </p>
            </>
          )}
        </div>

        {/* lg: Figma 2262:3341 - the language circle beside the title, then the user chip. */}
        <div className="hidden items-center gap-2 lg:flex">
          {headerActions}
          {languageButton}
          <div className="flex min-w-0 items-center gap-2 rounded-full border border-gray-300 p-2">
            <span
              aria-hidden
              className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] leading-none text-white"
            >
              {initial}
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
