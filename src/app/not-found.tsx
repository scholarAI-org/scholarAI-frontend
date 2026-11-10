import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { RouteStatus } from '@/components/shared/RouteStatus';
import { buttonStyles } from '@/components/ui/Button';
import { matchLocale } from '@/i18n/negotiate';

/**
 * The 404 page for the whole app: Next resolves every notFound(), including the
 * feature-flag route gates, to this boundary rather than to one inside
 * /[locale], because it renders outside the matched route.
 *
 * With no route params there is no request locale either, so the language is
 * negotiated from the visitor's Accept-Language header. The root layout's
 * document direction is fixed, so the card carries its own dir and lang.
 */
export default async function NotFound() {
  const locale = matchLocale((await headers()).get('accept-language'));
  const t = await getTranslations({ locale, namespace: 'NotFound' });
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} lang={locale} className="flex min-h-full flex-1 flex-col">
      <RouteStatus code="404" title={t('title')} description={t('description')}>
        <a href={`/${locale}`} className={buttonStyles({ size: 'md' })}>
          {t('home')}
        </a>
      </RouteStatus>
    </div>
  );
}
