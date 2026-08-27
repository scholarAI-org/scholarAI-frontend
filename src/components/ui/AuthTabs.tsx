'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function AuthTabs({ active }: { active: 'login' | 'register' }) {
  const t = useTranslations('AuthTabs');

  return (
    <div className="flex rtl:flex-row-reverse rounded-full bg-[var(--color-bg-tab)] p-1">
      <Link
        href="/register"
        className={`flex-1 rounded-full py-2 text-center text-sm font-medium transition ${
          active === 'register'
            ? 'bg-[var(--color-bg-page)] text-[var(--color-primary)] shadow-[var(--shadow-tab)]'
            : 'text-[var(--color-text-primary)]/60'
        }`}
      >
        {t('createAccount')}
      </Link>
      <Link
        href="/login"
        className={`flex-1 rounded-full py-2 text-center text-sm font-medium transition ${
          active === 'login'
            ? 'bg-[var(--color-bg-page)] text-[var(--color-primary)] shadow-[var(--shadow-tab)]'
            : 'text-[var(--color-text-primary)]/60'
        }`}
      >
        {t('login')}
      </Link>
    </div>
  );
}
