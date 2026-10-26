import { getTranslations } from 'next-intl/server';
import { RouteStatus } from '@/components/shared/RouteStatus';
import { buttonStyles } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

/**
 * The 404 page for everything under /[locale]. It is also what a visitor sees
 * when a feature flag is off and the route gate calls notFound().
 */
export default async function LocaleNotFound() {
  const t = await getTranslations('NotFound');

  return (
    <RouteStatus code="404" title={t('title')} description={t('description')}>
      <Link href="/" className={buttonStyles({ size: 'md' })}>
        {t('home')}
      </Link>
    </RouteStatus>
  );
}
