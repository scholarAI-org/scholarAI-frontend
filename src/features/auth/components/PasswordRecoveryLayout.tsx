'use client';

import { LockKeyhole } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthUtilityHeader } from './AuthUtilityHeader';
import { LoginPanelFooter, LoginPanelVisual } from './LoginPanel';

export function PasswordRecoveryLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('AuthLayout');

  return (
    <AuthLayout
      backgroundImage="/images/auth-panel-bg.png"
      heroTitle={
        <>
          {t('heroTitleLine1')}
          <br />
          <span className="text-[var(--color-primary)]">{t('heroTitleHighlight')}</span>{' '}
          {t('heroTitleLine2')}
        </>
      }
      heroSubtitle={t('heroSubtitle')}
      visual={<LoginPanelVisual />}
      footer={<LoginPanelFooter />}
      contentClassName="!bg-white lg:!px-10"
    >
      <main className="flex min-h-[590px] w-full max-w-[510px] flex-col">
        <AuthUtilityHeader />
        <div className="flex flex-1 flex-col justify-center py-6">{children}</div>
      </main>
    </AuthLayout>
  );
}

export function RecoveryLockMark() {
  return (
    <div className="relative mx-auto size-[127px] rounded-full border-2 border-[#0a3a6814] bg-[#27438305] p-[14px]">
      <div className="flex size-full items-center justify-center rounded-full border-2 border-[#0a3a6814] bg-[#27438305]">
        <LockKeyhole className="size-10 text-[var(--color-primary)]" strokeWidth={1.8} />
      </div>
      <span className="absolute bottom-1 start-1 flex size-7 items-center justify-center rounded-full border-4 border-white bg-[var(--color-primary)] text-sm font-bold text-white">
        ?
      </span>
    </div>
  );
}
