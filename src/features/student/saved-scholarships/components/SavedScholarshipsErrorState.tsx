'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/lib/api-client';
import { SavedContractError } from '../lib/validateSavedResponse';

interface SavedScholarshipsErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

type Reason = 'unauthorized' | 'forbidden' | 'generic';

function pickReason(error: unknown): Reason {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'unauthorized';
    if (error.status === 403) return 'forbidden';
  }
  // SavedContractError and every other error fall back to the generic
  // retryable copy. User-visible text never leaks backend-contract details.
  // The saved endpoint does not document 403; 403 copy stays generic
  // ("access unavailable") and must not say "account disabled".
  return 'generic';
}

export function SavedScholarshipsErrorState({ error, onRetry }: SavedScholarshipsErrorStateProps) {
  const t = useTranslations('StudentSavedScholarships');
  const reason = pickReason(error);
  // SavedContractError is handled as generic — the UI must never reveal that
  // the backend violated the target contract. We only log at the boundary.
  if (error instanceof SavedContractError) {
    // Non-production noise is OK; production builds strip console.
    console.warn('[SavedScholarships] contract error', error.reason, error.itemIndex);
  }
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white px-4 py-10 text-center text-sm"
      data-testid="saved-error"
      data-saved-error-reason={reason}
    >
      <AlertCircle aria-hidden className="size-5 shrink-0 text-orange-500" />
      <span className="text-[var(--color-text-error)]">{t(`errors.${reason}`)}</span>
      {reason !== 'forbidden' ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full"
          onClick={onRetry}
          data-testid="saved-error-retry"
        >
          {t('errors.retry')}
        </Button>
      ) : null}
    </div>
  );
}
