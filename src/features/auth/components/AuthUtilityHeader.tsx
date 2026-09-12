'use client';

import { ArrowLeft, ArrowRight, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';

export function AuthUtilityHeader({ backHref = '/login' }: { backHref?: '/login' | '/register' }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('PasswordRecovery');
  const nextLocale = locale === 'ar' ? 'en' : 'ar';
  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;

  function switchLanguage() {
    router.replace(pathname + window.location.search, { locale: nextLocale, scroll: false });
  }

  return (
    <div className="flex h-8 items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          role="img"
          aria-label={t('appearance')}
          className="flex size-8 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-white text-[var(--color-primary)]"
        >
          <Sun className="size-4" />
        </span>
        <button
          type="button"
          onClick={switchLanguage}
          aria-label={t('switchLanguage')}
          lang={nextLocale}
          className="flex size-8 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-white text-xs text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          {nextLocale === 'en' ? 'En' : 'ع'}
        </button>
      </div>
      <Link
        href={backHref}
        aria-label={t('back')}
        className="rounded-sm text-[#aeb4ba] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        <BackIcon className="size-6" />
      </Link>
    </div>
  );
}
