'use client';

import { useId } from 'react';
import { KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChangePasswordForm } from './ChangePasswordForm';

// Settings content only; the student frame and the page title come from StudentShell.
// The card follows the section pattern of the other student pages: an icon chip and a
// heading above a white rounded card.
export function SettingsPage() {
  const t = useTranslations('Settings.changePassword');
  const headingId = useId();

  return (
    // Capped so a single short form does not stretch across a 1204px desktop column.
    <section aria-labelledby={headingId} className="flex min-w-0 max-w-xl flex-col gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#274383]/10 text-[#274383]"
        >
          <KeyRound className="size-5" />
        </span>
        <h2 id={headingId} className="min-w-0 text-base font-bold text-[#434343]">
          {t('title')}
        </h2>
      </div>
      <div className="min-w-0 rounded-2xl border border-gray-300 bg-white p-4 sm:p-6">
        <p className="mb-6 max-w-md text-sm leading-6 text-[#64748b]">{t('description')}</p>
        <ChangePasswordForm />
      </div>
    </section>
  );
}
