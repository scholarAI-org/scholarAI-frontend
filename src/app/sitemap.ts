import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { localePath } from '@/lib/metadata';
import { PUBLIC_ROUTES } from '@/lib/site-routes';
import { absoluteUrl } from '@/lib/site-url';

/** Every public localized URL that exists, each listing its locale alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    PUBLIC_ROUTES.map((route) => ({
      url: absoluteUrl(localePath(locale, route)),
      // The landing page is the entry point; the auth pages matter less.
      priority: route === '/' ? 1 : 0.5,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((other) => [other, absoluteUrl(localePath(other, route))])
        ),
      },
    }))
  );
}
