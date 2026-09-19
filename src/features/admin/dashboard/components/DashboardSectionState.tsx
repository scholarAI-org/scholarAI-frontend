'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type DashboardSectionStateProps = {
  kind: 'loading' | 'error' | 'empty';
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function DashboardSectionState({
  kind,
  message,
  retryLabel,
  onRetry,
}: DashboardSectionStateProps) {
  if (kind === 'loading') {
    return (
      <div
        className="flex min-h-32 items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]"
        role="status"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>{message}</span>
      </div>
    );
  }

  if (kind === 'error') {
    return (
      <div
        className="flex min-h-32 flex-col items-center justify-center gap-3 px-4 py-6 text-center"
        role="alert"
      >
        <p className="text-sm text-[var(--color-text-error)]">{message}</p>
        {onRetry && retryLabel ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={onRetry}
          >
            {retryLabel}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-32 items-center justify-center px-4 py-6 text-center" role="status">
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );
}
