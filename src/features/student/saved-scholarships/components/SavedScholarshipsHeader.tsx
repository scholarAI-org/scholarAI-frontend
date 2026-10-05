'use client';

import { useTranslations } from 'next-intl';

interface SavedScholarshipsHeaderProps {
  // Null during loading or an error: the count is unknown, never zero.
  count: number | null;
}

// Localized title + plural-aware count derived from the array length only.
// No separate total field; no Figma sample copy.
export function SavedScholarshipsHeader({ count }: SavedScholarshipsHeaderProps) {
  const t = useTranslations('StudentSavedScholarships');
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{t('title')}</h1>
      {count !== null ? (
        <p
          aria-live="polite"
          className="text-sm text-[var(--color-text-secondary)]"
          data-testid="saved-count"
        >
          {t('count', { count })}
        </p>
      ) : null}
    </header>
  );
}
