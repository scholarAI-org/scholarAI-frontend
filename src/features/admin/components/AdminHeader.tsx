'use client';

import { Menu, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { AdminPageHeader } from './AdminPageHeader';
import { getAdminPageMetadata } from '../page-metadata';
type AdminHeaderProps = { isNavigationOpen: boolean; onNavigationToggle: () => void };

export function AdminHeader({ isNavigationOpen, onNavigationToggle }: AdminHeaderProps) {
  const t = useTranslations('AdminShell');

  const locale = useLocale();
  const pathname = usePathname();
  const pageMetadata = getAdminPageMetadata(pathname);
  const pageTranslations = useTranslations(pageMetadata?.namespace ?? 'AdminShell');
  const router = useRouter();
  const nextLocale = locale === 'ar' ? 'en' : 'ar';

  function switchLanguage() {
    const query = window.location.search;
    const hash = window.location.hash;
    router.replace(`${pathname}${query}${hash}`, { locale: nextLocale, scroll: false });
  }

  return (
    <header className="flex min-h-[72px] items-center justify-between border-b border-[#e2e8f0] bg-white px-4 py-3 lg:h-[108px] lg:px-6">
      {pageMetadata ? (
        <AdminPageHeader
          title={pageTranslations(pageMetadata.titleKey)}
          description={pageTranslations(pageMetadata.descriptionKey)}
        />
      ) : (
        <div className="min-h-[72px] lg:h-[108px]" aria-hidden="true" />
      )}

      <button
        type="button"
        onClick={onNavigationToggle}
        aria-expanded={isNavigationOpen}
        aria-controls="admin-mobile-navigation"
        aria-label={isNavigationOpen ? t('closeNavigation') : t('openNavigation')}
        className="inline-flex size-10 items-center justify-center rounded-full border border-[#e2e8f0] text-[#274383] lg:hidden"
      >
        {isNavigationOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      <div className="ms-auto flex items-center gap-2">
        <button
          type="button"
          onClick={switchLanguage}
          aria-label={t('switchLanguage')}
          lang={nextLocale}
          className="inline-flex size-8 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-xs text-[#434343]"
        >
          {nextLocale === 'en' ? 'En' : 'ع'}
        </button>
      </div>
    </header>
  );
}
