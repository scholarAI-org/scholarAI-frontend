'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import type { DiscoveryErrorReason } from '../lib/results-state';

interface DiscoveryErrorStateProps {
  reason: DiscoveryErrorReason;
  onRetry: () => void;
  onClearFilters: () => void;
  compact?: boolean;
}

// 401 shows a short message only; the existing AuthProvider/RoleGuard flow does the
// redirect. 403 has no action, 422 offers clear filters, others offer retry.
export function DiscoveryErrorState({
  reason,
  onRetry,
  onClearFilters,
  compact = false,
}: DiscoveryErrorStateProps) {
  const t = useTranslations('StudentScholarshipDiscovery');
  const action =
    reason === 'validation'
      ? { label: t('empty.noMatches.clearFilters'), onClick: onClearFilters }
      : reason === 'generic'
        ? { label: t('errors.retry'), onClick: onRetry }
        : null;
  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center gap-3 rounded-2xl border border-gray-300 bg-white text-sm ${compact ? 'px-4 py-3' : 'justify-center px-4 py-10 text-center'}`}
    >
      <AlertCircle aria-hidden className="size-5 shrink-0 text-orange-500" />
      <span className="text-[var(--color-text-error)]">{t(`errors.${reason}`)}</span>
      {action ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
