'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

interface SectionErrorProps {
  message: string;
  onRetry: () => void;
}

// Error for one section only. Retry refetches just that section's failed sources.
export function SectionError({ message, onRetry }: SectionErrorProps) {
  const t = useTranslations('StudentHome');
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
    >
      <AlertCircle aria-hidden className="size-5 shrink-0 text-orange-500" />
      <span className="min-w-0 flex-1 text-[var(--color-text-error)]">{message}</span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="rounded-full"
        onClick={onRetry}
      >
        {t('states.retry')}
      </Button>
    </div>
  );
}
