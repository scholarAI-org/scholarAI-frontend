'use client';

import { Bell, Globe2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { ProfileUser } from './types';

interface NavbarProps {
  title: string;
  subtitle: string;
  user: Pick<ProfileUser, 'name' | 'initials'>;
  hasUnreadNotifications?: boolean;
}

export default function Navbar({
  title,
  subtitle,
  user,
  hasUnreadNotifications = false,
}: NavbarProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = locale === 'ar' ? 'en' : 'ar';
  const switchLabel = nextLocale === 'en' ? 'Switch to English' : 'التبديل إلى العربية';

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
          <h1 className="text-lg font-bold leading-[1.2] text-[#434343]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#b5b5b5] sm:text-base">{subtitle}</p>
        </div>

        <div className="order-1 flex items-center justify-end gap-2 sm:order-2">
          <div className="flex h-10 items-center gap-2 rounded-full border border-[#e2e8f0] px-2">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#f97316] text-[10px] leading-none text-white">
              {user.initials}
            </span>
            <span className="text-sm leading-5 text-black">
              <bdi>{user.name}</bdi>
            </span>
          </div>

          <button
            type="button"
            aria-label={locale === 'ar' ? 'الاشعارات' : 'Notifications'}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#274383]"
          >
            <Bell className="h-5 w-5" />
            {hasUnreadNotifications && (
              <span className="absolute start-2 top-2 h-1 w-1 rounded-full bg-[#f97316]" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={switchLabel}
              onClick={switchLanguage}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#274383] text-white"
            >
              <Globe2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={switchLabel}
              onClick={switchLanguage}
              lang={nextLocale}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8fafc] text-xs text-black"
            >
              {nextLocale === 'en' ? 'En' : 'ع'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
