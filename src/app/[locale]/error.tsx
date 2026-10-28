'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { RouteStatus } from '@/components/shared/RouteStatus';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

/**
 * Error boundary for everything under /[locale]. `reset` re-renders the failed
 * segment, which recovers from a transient failure without a full reload.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('ErrorState');

  useEffect(() => {
    // The digest is the only handle on the server-side stack, which Next never
    // sends to the browser.
    console.error('Unhandled route error', error.digest ?? error);
  }, [error]);

  return (
    <RouteStatus code="500" title={t('title')} description={t('description')}>
      <Button type="button" onClick={reset}>
        {t('retry')}
      </Button>
      <Link href="/" className={buttonStyles({ variant: 'secondary', size: 'md' })}>
        {t('home')}
      </Link>
    </RouteStatus>
  );
}
