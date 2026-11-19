'use client';

import { CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MarkAllReadButtonProps {
  onClick: () => void;
  disabled: boolean;
}

// Figma 2481:4982: an outlined pill with the label and a double check, at the end side above
// the list. min-h-11 keeps it a 44px touch target on a phone.
export function MarkAllReadButton({ onClick, disabled }: MarkAllReadButtonProps) {
  const t = useTranslations('StudentNotifications');
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid="notifications-mark-all"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-[17px] text-xs text-[rgba(30,27,51,0.7)] transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10"
    >
      <span>{t('markAll.label')}</span>
      <CheckCheck aria-hidden className="size-3.5 shrink-0" />
    </button>
  );
}
