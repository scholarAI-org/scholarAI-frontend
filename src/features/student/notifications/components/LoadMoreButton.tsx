'use client';

import { useTranslations } from 'next-intl';

interface LoadMoreButtonProps {
  onClick: () => void;
  // The next page is being requested.
  pending: boolean;
}

// The design has no "load more"; it follows the discovery list's pagination spirit in the page's
// own pill style. A 44px target on a phone.
export function LoadMoreButton({ onClick, pending }: LoadMoreButtonProps) {
  const t = useTranslations('StudentNotifications');
  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-busy={pending}
        data-testid="notifications-load-more"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#e2e8f0] bg-white px-6 text-sm text-[rgba(30,27,51,0.7)] transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t('loadMore.pending') : t('loadMore.label')}
      </button>
    </div>
  );
}
