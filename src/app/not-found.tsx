import { getTranslations } from 'next-intl/server';
import { RouteStatus } from '@/components/shared/RouteStatus';
import { buttonStyles } from '@/components/ui/Button';
import { routing } from '@/i18n/routing';

/**
 * Last-resort 404, for URLs that never reach a locale segment. There is no
 * locale to read here, so it speaks the default one; everything the locale
 * middleware routes lands on src/app/[locale]/not-found.tsx instead.
 */
export default async function RootNotFound() {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: 'NotFound' });

  return (
    <RouteStatus code="404" title={t('title')} description={t('description')}>
      <a href={`/${routing.defaultLocale}`} className={buttonStyles({ size: 'md' })}>
        {t('home')}
      </a>
    </RouteStatus>
  );
}
