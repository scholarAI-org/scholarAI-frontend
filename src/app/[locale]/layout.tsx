import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { intlFormats } from '@/i18n/formatting';
import { routing } from '@/i18n/routing';
import { OG_IMAGE } from '@/lib/metadata';
import { absoluteUrl, resolveSiteUrl } from '@/lib/site-url';
import { QueryProvider } from '@/lib/query-provider';
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Defaults every page under /[locale] inherits: the title template, the honest
 * site description and the social cards. Pages override title, description and
 * their canonical URL through buildPageMetadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requested } = await params;
  const locale = routing.locales.includes(requested as 'ar' | 'en')
    ? requested
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const title = t('title');
  const description = t('description');
  const image = { ...OG_IMAGE, url: absoluteUrl(OG_IMAGE.url), alt: title };

  return {
    metadataBase: new URL(resolveSiteUrl()),
    title: { default: title, template: t('titleTemplate') },
    description,
    applicationName: t('siteName'),
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      locale,
      title,
      description,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'ar' | 'en')) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <QueryProvider>
      <NextIntlClientProvider locale={locale} messages={messages} formats={intlFormats}>
        <div dir={dir} lang={locale} className="min-h-full flex flex-col flex-1">
          {children}
        </div>
      </NextIntlClientProvider>
    </QueryProvider>
  );
}
