import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { absoluteUrl, resolveSiteUrl } from './site-url';

export type Locale = (typeof routing.locales)[number];

/**
 * The only image in the repository that suits a social card: the graduation
 * photo already shown on the public landing page.
 */
export const OG_IMAGE = {
  url: '/images/landing/2100-736-imgGeminiGeneratedImageHkn13Ehkn13Ehkn11.png',
  width: 1408,
  height: 768,
} as const;

/** Path of `pathname` under `locale`, e.g. ('en', '/login') → '/en/login'. */
export function localePath(locale: string, pathname = '/'): string {
  const path = pathname === '/' ? '' : pathname.replace(/\/+$/, '');
  return `/${locale}${path.startsWith('/') || path === '' ? path : `/${path}`}`;
}

/**
 * Canonical URL plus one hreflang alternate per locale. Search engines need
 * every localized variant of a page to point at the same set, and x-default
 * names the locale an unmatched visitor gets (the routing default).
 */
export function localeAlternates(locale: string, pathname = '/'): Metadata['alternates'] {
  const languages: Record<string, string> = {};
  for (const other of routing.locales) {
    languages[other] = localePath(other, pathname);
  }
  languages['x-default'] = localePath(routing.defaultLocale, pathname);

  return { canonical: localePath(locale, pathname), languages };
}

type PageMetadataOptions = {
  locale: string;
  /** Route path without the locale prefix, e.g. '/login'. */
  pathname?: string;
  /** Key under the `Metadata.pages` namespace; omitted for the site default. */
  page?: string;
  /** Keep the page out of search results (token and one-off flow pages). */
  noindex?: boolean;
};

/**
 * Metadata for a public page: localized title and description, canonical and
 * hreflang alternates, and matching Open Graph / Twitter cards.
 */
export async function buildPageMetadata({
  locale,
  pathname = '/',
  page,
  noindex = false,
}: PageMetadataOptions): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const siteTitle = t('title');
  // A page title flows through the layout's title template; the site title is
  // already complete, so it is set absolutely instead of templated into itself.
  const title = page ? t(`pages.${page}.title`) : { absolute: siteTitle };
  const description = page ? t(`pages.${page}.description`) : t('description');
  const cardTitle = typeof title === 'string' ? title : siteTitle;
  const url = absoluteUrl(localePath(locale, pathname));
  const image = { ...OG_IMAGE, url: absoluteUrl(OG_IMAGE.url), alt: siteTitle };

  return {
    metadataBase: new URL(resolveSiteUrl()),
    title,
    description,
    alternates: localeAlternates(locale, pathname),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      locale,
      url,
      title: cardTitle,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: cardTitle,
      description,
      images: [image],
    },
  };
}
